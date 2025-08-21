import { useToast } from '@/hooks/use-toast';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { WagmiProvider, useAccount, useDisconnect, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { config, rabbykit } from '@/lib/wagmi';
import { contractAbi, contractAddress } from '@/lib/contract-config';
import { readContract } from '@wagmi/core';

// ... (interfaces and context definition remain the same)
interface UserState {
    userId: string | null;
    walletAddress: `0x${string}` | null;
    isConnected: boolean;
    pendingClicks: number;
    totalClicks: number;
    totalClaimed: number;
    country: string;
  }
  
  interface UserContextType extends UserState {
    connectWallet: () => void;
    disconnectWallet: () => void;
    addClick: () => void;
    claimTokens: () => void;
    isClaiming: boolean;
  }
  
  const UserContext = createContext<UserContextType | undefined>(undefined);
  
  const initialState: UserState = {
    userId: null,
    walletAddress: null,
    isConnected: false,
    pendingClicks: 0,
    totalClicks: 0,
    totalClaimed: 0,
    country: 'BO', // Default to Bolivia as per mock
  };

function UserProviderContent({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(initialState);
  const [txHash, setTxHash] = useState<`0x${string}` | null>(null);
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { writeContractAsync, isPending: isClaimingC, error: claimError, reset } = useWriteContract();

  const { data: receipt, isLoading: isConfirming, isSuccess: isConfirmed, error: receiptError } = useWaitForTransactionReceipt({ hash: txHash });

  useEffect(() => {
    // Fetch country from a geo IP API on initial load
    fetch('https://ipapi.co/country_code')
        .then(res => res.text())
        .then(countryCode => {
            if (countryCode) {
                setState(prevState => ({...prevState, country: countryCode}))
            }
        }).catch(err => console.log("Could not fetch country", err));
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      const userId = address;
      setState((s) => ({ ...s, isConnected: true, walletAddress: address, userId }));
      fetchUserData(userId);
    } else {
      setState(initialState);
    }
  }, [isConnected, address]);

  // Effect to handle the result of the transaction confirmation
  useEffect(() => {
    if (isConfirmed && receipt) {
        toast({
            title: '🎉 Tokens Claimed!',
            description: `Your transaction was successful.`,
            action: (
                <a href={`https://sonicscan.org/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                    View on SonicScan
                </a>
            )
        });

        const claimedAmount = state.pendingClicks;

        // The backend now handles the database update.
        // We just update the local state.
        setState((s) => ({
            ...s,
            totalClaimed: s.totalClaimed + claimedAmount,
            pendingClicks: 0,
        }));
        setTxHash(null);
        reset();
    }
    if (claimError || receiptError) {
        toast({
            variant: 'destructive',
            title: 'Transaction Failed',
            description: (claimError?.shortMessage || receiptError?.shortMessage) || 'Could not claim tokens.',
        });
        setTxHash(null);
        reset();
    }
  }, [isConfirmed, receipt, claimError, receiptError, txHash, state.pendingClicks, toast, reset]);

  const fetchUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('total_claimed, total_clicks')
      .eq('id', userId)
      .single();

    // Reconciliation logic starts here
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
            // Here you would call an API to update your DB
            // For now, we just update the state
            setState(s => ({...s, totalClaimed: balanceInUnits}));
        }

    } catch (e) {
        console.error("Could not fetch balance for reconciliation", e);
    }

    if (error && error.code === 'PGRST116') {
      // User does not exist, create one
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({ id: userId, total_clicks: 0, total_claimed: 0 })
        .select('total_claimed, total_clicks')
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
      const pending = data.total_clicks - data.total_claimed;
      setState((s) => ({
        ...s,
        totalClicks: data.total_clicks,
        totalClaimed: data.total_claimed,
        pendingClicks: pending > 0 ? pending : 0,
      }));
    }
  };

  const connectWallet = () => {
    rabbykit.open();
  };

  const disconnectWallet = () => {
    disconnect();
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

    setTxHash('0x' + '0'.repeat(64)); // Start loading indicator

    try {
      // 1. Get signature from the backend
      const sigResponse = await fetch('/api/get-claim-signature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player: state.walletAddress, clicks: state.pendingClicks }),
      });

      const { signature, nonce } = await sigResponse.json();

      if (!sigResponse.ok) {
        throw new Error('Failed to get claim signature');
      }

      // 2. Send transaction from the frontend
      const hash = await writeContractAsync({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'claim',
        args: [state.walletAddress, BigInt(state.pendingClicks), signature],
      });

      setTxHash(hash);

      // 3. Update database after transaction is sent
      await fetch('/api/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ player: state.walletAddress, clicks: state.pendingClicks, txHash: hash }),
      });

    } catch (e: any) {
      console.error("Claim failed", e);
      toast({
        variant: 'destructive',
        title: 'Claim Failed',
        description: e.shortMessage || e.message,
      });
      setTxHash(null); // Reset loading state on error
    }
  };

  const isClaiming = isClaimingC || isConfirming;

  return (
    <UserContext.Provider
      value={{ ...state, connectWallet, disconnectWallet, addClick, claimTokens, isClaiming }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function UserProvider({ children }: { children: ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <UserProviderContent>{children}</UserProviderContent>
        </WagmiProvider>
    )
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
