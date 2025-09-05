import { useToast } from '@/hooks/use-toast';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAccount, useDisconnect, useWaitForTransactionReceipt, useWriteContract, useChainId, useSwitchChain } from 'wagmi';
import { config, rabbykit, sonicMainnet } from '@/lib/wagmi';
import { contractAbi, contractAddress } from '@/lib/contract-config';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface DecayInfo {
  initialReward: string;
  finalReward: string;
  decayDurationInDays: number;
  launchTimestamp: number;
}

interface UserState {
  userId: string | null;
  walletAddress: `0x${string}` | null;
  isConnected: boolean;
  isWrongNetwork: boolean;
  isUserLoaded: boolean; // New state
  pendingClicks: number;
  totalClicks: number;
  totalClaimed: number;
  claimedClicks: number;
  country: string;
  claimableTokens: string;
  decayInfo: DecayInfo | null;
  currentRewardPerClick: string;
  tokenPriceUSD: number | null;
  totalSupply: number | null;
  totalClaimedAllUsers: number | null;
}

interface UserContextType extends UserState {
  connectWallet: () => void;
  disconnectWallet: () => void;
  switchToSonicNetwork: () => void;
  addClick: () => void;
  claimTokens: () => void;
  isClaiming: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const initialState: UserState = {
  userId: null,
  walletAddress: null,
  isConnected: false,
  isWrongNetwork: false,
  isUserLoaded: false,
  pendingClicks: 0,
  totalClicks: 0,
  totalClaimed: 0,
  claimedClicks: 0,
  country: 'FL', // Default to Flowland
  claimableTokens: '0',
  decayInfo: null,
  currentRewardPerClick: '0',
  tokenPriceUSD: null,
  totalSupply: null,
  totalClaimedAllUsers: null,
};

async function fetchUserData(userId: string) {
  // This function now only fetches, it does not set state.
  const { data, error } = await supabase
    .from('users')
    .select('total_claimed, total_clicks, claimed_clicks')
    .eq('id', userId)
    .single();

  let userData = data;

  if (error && error.code === 'PGRST116') {
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({ id: userId, total_clicks: 0, total_claimed: 0, claimed_clicks: 0 })
      .select('total_claimed, total_clicks, claimed_clicks')
      .single();
    if (insertError) throw new Error('Failed to create user profile.');
    userData = newUser;
  } else if (error) {
    throw new Error('Failed to fetch user data from Supabase.');
  }

  if (!userData) throw new Error('No user data found.');

  const redisClicksResponse = await fetch('/api/get-redis-clicks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ player: userId }),
    cache: 'no-store',
  });

  let redisPendingClicks = 0;
  if (redisClicksResponse.ok) {
    const redisData = await redisClicksResponse.json();
    redisPendingClicks = redisData.clicks;
  } else {
    console.error('Failed to fetch pending clicks from Redis API');
  }

  return {
    totalClicks: userData.total_clicks,
    totalClaimed: userData.total_claimed,
    claimedClicks: userData.claimed_clicks,
    pendingClicks: redisPendingClicks,
  };
}

function UserProviderContent({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(initialState);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { writeContractAsync, reset } = useWriteContract();
  const queryClient = useQueryClient();

  const connectWallet = () => {
    rabbykit.open();
  };

  const disconnectWallet = () => {
    disconnect();
  };

  const switchToSonicNetwork = () => {
    if (switchChain) {
      switchChain({ chainId: sonicMainnet.id });
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not switch network. Please do it manually in your wallet.'
      });
    }
  };

  // --- DATA FETCHING using React Query ---

  const { data: userData, isPending: isUserLoading } = useQuery({
    queryKey: ['userData', address],
    queryFn: () => fetchUserData(address!),
    enabled: isConnected && !!address && chainId === sonicMainnet.id,
    refetchInterval: 30000, // Increased refetch interval
    refetchOnWindowFocus: true,
  });

  // ... (other queries for claimable amount, price, etc. remain the same)

  // --- STATE SYNCHRONIZATION ---

  useEffect(() => {
    if (isConnected && address) {
      setState(s => ({ ...s, isConnected: true, walletAddress: address, userId: address, isWrongNetwork: chainId !== sonicMainnet.id }));
    } else {
      setState(initialState);
    }
  }, [isConnected, address, chainId]);

  useEffect(() => {
    if (userData) {
      setState(s => ({ ...s, ...userData, isUserLoaded: !isUserLoading }));
    }
  }, [userData, isUserLoading]);

  // ... (effects for claimableData, priceData, globalStatsData remain the same)

  // --- MUTATIONS for actions ---

  const clickMutation = useMutation({
    mutationFn: () => fetch('/api/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
      },
      body: JSON.stringify({ userId: state.userId, country: state.country }),
    }),
    onSuccess: async (response) => {
      if (!response.ok) throw new Error('Failed to save click');
      // Invalidate to refetch and get the true count from the backend
      await queryClient.invalidateQueries({ queryKey: ['userData', address] });
    },
    onError: (error) => {
      console.error('Error saving click:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not save your click. Please try again.' });
    },
  });

  const claimTokensMutation = useMutation({
    mutationFn: async () => {
      if (state.pendingClicks <= 0 || !state.walletAddress) {
        throw new Error("No clicks to claim.");
      }
      if (state.isWrongNetwork) {
        switchToSonicNetwork();
        throw new Error("Wrong network. Please switch to Sonic.");
      }

      const sigResponse = await fetch('/api/get-claim-signature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_API_KEY}`,
        },
        body: JSON.stringify({ player: state.walletAddress, clicks: state.pendingClicks }),
      });

      const { signature, nonce, token } = await sigResponse.json();

      if (!sigResponse.ok) {
        throw new Error('Failed to get claim signature');
      }

      const hash = await writeContractAsync({
        chainId: sonicMainnet.id,
        address: contractAddress,
        abi: contractAbi,
        functionName: 'claim',
        args: [state.walletAddress, BigInt(state.pendingClicks), signature],
      });
      
      // Also call the backend API to notify it of the claim tx
      await fetch('/api/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            txHash: hash, 
            amount: state.claimableTokens,
          }),
      });

      return hash;
    },
    onSuccess: (hash) => {
      setTxHash(hash);
      toast({ title: 'Transaction Submitted', description: 'Waiting for confirmation...' });
    },
    onError: (e: any) => {
      console.error("Claim failed", e);
      toast({
        variant: 'destructive',
        title: 'Claim Failed',
        description: e.message,
      });
    }
  });

  // Effect for handling transaction confirmation
  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
    chainId: sonicMainnet.id,
  });

  useEffect(() => {
    if (isConfirmed && receipt) {
      toast({ title: '🎉 Tokens Claimed!', description: 'Your transaction was successful.' });
      // Invalidate queries to refetch everything from the source of truth
      queryClient.invalidateQueries({ queryKey: ['userData', address] });
      queryClient.invalidateQueries({ queryKey: ['claimableAmount'] });
      setTxHash(null);
      reset();
    }
  }, [isConfirmed, receipt, queryClient, address, reset, toast]);


  // --- CONTEXT VALUE ---

  const addClick = () => {
    if (!state.isUserLoaded) {
      toast({ title: 'Please wait', description: 'Data is loading...' });
      return;
    }
    clickMutation.mutate();
  };

  const claimTokens = () => {
    claimTokensMutation.mutate();
  };

  const isClaiming = claimTokensMutation.isPending || isConfirming;

  return (
    <UserContext.Provider
      value={{ ...state, connectWallet, disconnectWallet, switchToSonicNetwork, addClick, claimTokens, isClaiming }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function UserProvider({ children }: { children: ReactNode }) {
    return (
        <UserProviderContent>{children}</UserProviderContent>
    )
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}