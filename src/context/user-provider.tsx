import { useToast } from '@/hooks/use-toast';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAccount, useDisconnect, useWaitForTransactionReceipt, useWriteContract, useChainId, useSwitchChain } from 'wagmi';
import { config, rabbykit, sonicMainnet } from '@/lib/wagmi';
import { contractAbi, contractAddress } from '@/lib/contract-config';
import { readContract } from '@wagmi/core';
import { useQuery } from '@tanstack/react-query';

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
  isUserLoaded: false, // New state
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

function UserProviderContent({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(initialState);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();
  const { writeContractAsync, isPending: isClaimingC, error: claimError, reset } = useWriteContract();

  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({
    hash: txHash || undefined,
    chainId: sonicMainnet.id,
  });

  useEffect(() => {
    if (isConnected && chainId) {
      setState(prevState => ({
        ...prevState,
        isWrongNetwork: chainId !== sonicMainnet.id,
      }));
    }
  }, [isConnected, chainId]);

  // Query for fetching the real-time claimable amount
  const { data: claimableData } = useQuery({
    queryKey: ['claimableAmount', state.pendingClicks],
    queryFn: async () => {
      const response = await fetch('/api/get-claimable-amount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clicks: state.pendingClicks }),
      });
      if (!response.ok) {
        throw new Error('Failed to fetch claimable amount');
      }
      return response.json();
    },
    enabled: isConnected && !state.isWrongNetwork,
    refetchInterval: 15000,
  });

  const { data: priceData } = useQuery({
    queryKey: ['tokenPrice'],
    queryFn: async () => {
      const response = await fetch('/api/token-price');
      if (!response.ok) {
        console.error('Failed to fetch token price');
        return null;
      }
      return response.json();
    },
    enabled: false,
    refetchInterval: 60000,
  });

  const { data: globalStatsData } = useQuery({
    queryKey: ['globalStats'],
    queryFn: async () => {
      const response = await fetch('/api/global-stats');
      if (!response.ok) {
        console.error('Failed to fetch global stats');
        return null;
      }
      return response.json();
    },
    refetchInterval: 60000,
  });

  useEffect(() => {
    if (globalStatsData) {
      setState(prevState => ({
        ...prevState,
        totalSupply: globalStatsData.totalSupply,
        totalClaimedAllUsers: globalStatsData.totalClaimed,
      }));
    }
  }, [globalStatsData]);

  useEffect(() => {
    if (claimableData) {
      setState(prevState => ({
        ...prevState,
        claimableTokens: claimableData.claimableAmount,
        decayInfo: claimableData.decay,
        currentRewardPerClick: claimableData.currentRewardPerClick,
      }));
    }
  }, [claimableData]);

  useEffect(() => {
    if (priceData) {
      setState(prevState => ({
        ...prevState,
        tokenPriceUSD: priceData.price,
      }));
    }
  }, [priceData]);

  useEffect(() => {
    fetch('https://ipapi.co/country_code')
        .then(res => res.text())
        .then(countryInfo => {
            if (countryInfo) {
                const match = countryInfo.match(/[A-Z]{2}/);
                if (match) {
                    setState(prevState => ({...prevState, country: match[0]}));
                } else {
                    setState(prevState => ({...prevState, country: 'FL'}));
                }
            } else {
                setState(prevState => ({...prevState, country: 'FL'}));
            }
        }).catch(err => {
            console.log("Could not fetch country, defaulting to Flowland", err);
            setState(prevState => ({...prevState, country: 'FL'}));
        });
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      const userId = address;
      setState((s) => ({ ...s, isConnected: true, walletAddress: address, userId, isUserLoaded: false }));
      if (chainId === sonicMainnet.id) {
        fetchUserData(userId, chainId);
      }
    } else {
      setState(initialState);
    }
  }, [isConnected, address, chainId]);

  useEffect(() => {
    if (isConfirmed && receipt) {
        toast({
            title: '🎉 Tokens Claimed!',
            description: `Your transaction was successful.`,
            action: (
              <div className="flex flex-col gap-2 mt-2">
                <a href={`https://sonicscan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    View Transaction
                </a>
                <a href={`https://sonicscan.org/token/${contractAddress}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    View Token
                </a>
              </div>
            )
        });

        const claimedAmount = parseFloat(state.claimableTokens);
        const clicksClaimed = state.pendingClicks;

        setState((s) => ({
            ...s,
            totalClaimed: s.totalClaimed + claimedAmount,
            claimedClicks: s.claimedClicks + clicksClaimed,
            pendingClicks: 0,
            claimableTokens: '0',
        }));
        setTxHash(null);
        reset();

        // Re-fetch user data directly from Supabase to ensure synchronization
        if (state.userId) {
            const refetchSupabaseData = async () => { // Defined async function
                const { data: updatedUserData, error: updatedFetchError } = await supabase
                    .from('users')
                    .select('total_claimed, total_clicks, claimed_clicks')
                    .eq('id', state.userId)
                    .single();

                if (updatedFetchError) {
                    console.error('Error re-fetching user data after claim:', updatedFetchError);
                } else if (updatedUserData) {
                    const pending = updatedUserData.total_clicks - updatedUserData.claimed_clicks;
                    setState((s) => ({
                        ...s,
                        totalClicks: updatedUserData.total_clicks,
                        totalClaimed: updatedUserData.total_claimed,
                        claimedClicks: updatedUserData.claimed_clicks,
                    }));
                }
            };
            refetchSupabaseData(); // Called the async function
        }
    }
    if (claimError || receiptError) {
        const error = claimError || receiptError;
        const message = (error as any)?.shortMessage || error?.message || 'Could not claim tokens.';
        toast({
            variant: 'destructive',
            title: 'Transaction Failed',
            description: message,
        });
        setTxHash(null);
        reset();
    }
  }, [isConfirmed, receipt, claimError, receiptError, txHash, state.pendingClicks, toast, reset]);

  const fetchUserData = async (userId: string, chainId: number) => {
    const { data, error } = await supabase
      .from('users')
      .select('total_claimed, total_clicks, claimed_clicks')
      .eq('id', userId)
      .single();

    if (chainId === sonicMainnet.id) {
        try {
            const balance = await readContract(config, {
                abi: contractAbi,
                address: contractAddress,
                functionName: 'balanceOf',
                args: [userId as `0x${string}`],
            });

            const decimals = await readContract(config, {
                abi: contractAbi,
                address: contractAddress,
                functionName: 'decimals',
            });

            const balanceInUnits = Number(balance) / (10 ** Number(decimals));

            if (data && balanceInUnits !== data.total_claimed) {
                console.log(`Reconciling... DB: ${data.total_claimed}, Chain: ${balanceInUnits}`);
                setState(s => ({...s, totalClaimed: balanceInUnits}));
            }

        } catch (e) {
            console.error("Could not fetch balance for reconciliation", e);
        }
    }

    if (error && error.code === 'PGRST116') {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ id: userId, total_clicks: 0, total_claimed: 0, claimed_clicks: 0 })
        .select('total_claimed, total_clicks, claimed_clicks')
        .single();

      if (insertError) {
        console.error('Error creating user:', insertError);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not create a new user profile.',
        });
      } else if (newUser) {
        setState((s) => ({
          ...s,
          totalClicks: newUser.total_clicks,
          totalClaimed: newUser.total_claimed,
          claimedClicks: newUser.claimed_clicks,
        }));
      }
    } else if (error) {
      console.error('Error fetching user data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not fetch your data.',
      });
    } else if (data) {
      if (data) {
      // Fetch pending clicks directly from Redis
      const redisClicksResponse = await fetch('/api/get-redis-clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: userId }),
      });

      let redisPendingClicks = 0;
      if (redisClicksResponse.ok) {
        const redisData = await redisClicksResponse.json();
        redisPendingClicks = redisData.clicks;
      } else {
        console.error('Failed to fetch pending clicks from Redis API');
      }

      setState((s) => ({
        ...s,
        totalClicks: data.total_clicks,
        totalClaimed: data.total_claimed,
        claimedClicks: data.claimed_clicks,
        pendingClicks: redisPendingClicks, // Use value from Redis
      }));
    }
    }
    setState((s) => ({ ...s, isUserLoaded: true }));
  };

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

  const addClick = async () => {
    if (!state.isConnected || !state.userId) {
      toast({
        variant: 'destructive',
        title: 'Not Connected',
        description: 'Please connect your wallet to start clicking.',
      });
      return;
    }

    if (state.isWrongNetwork) {
      switchToSonicNetwork();
      return;
    }

    if (!state.isUserLoaded) {
      toast({
        variant: 'destructive',
        title: 'Please wait',
        description: 'User data is still loading. Please try again in a moment.',
      });
      return;
    }

    setState((s) => ({
      ...s,
      pendingClicks: s.pendingClicks + 1,
      totalClicks: s.totalClicks + 1,
    }));

    try {
      const response = await fetch('/api/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: state.userId, country: state.country }),
      });

      if (!response.ok) throw new Error('Failed to save click');

    } catch (error) {
      console.error('Error saving click:', error);
      setState((s) => ({
        ...s,
        pendingClicks: s.pendingClicks - 1,
        totalClicks: s.totalClicks - 1,
      }));
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not save your click. Please try again.',
      });
    }
  };

  const claimTokens = async () => {
    if (state.pendingClicks <= 0 || !state.walletAddress) {
      toast({ title: 'No Clicks to Claim' });
      return;
    }

    if (state.isWrongNetwork) {
      switchToSonicNetwork();
      return;
    }

    setTxHash(('0x' + '0'.repeat(64)) as `0x${string}`);

    try {
      const sigResponse = await fetch('/api/get-claim-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      setTxHash(hash);

      await fetch('/api/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ 
            player: state.walletAddress, 
            amount: state.claimableTokens, 
            txHash: hash, 
            clicks: state.pendingClicks 
          }),
      });

    } catch (e: any) {
      console.error("Claim failed", e);
      toast({
        variant: 'destructive',
        title: 'Claim Failed',
        description: e.shortMessage || e.message,
      });
      setTxHash(null);
    }
  };

  const isClaiming = isClaimingC || isConfirming;

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
