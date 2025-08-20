'use client';

import { useToast } from '@/hooks/use-toast';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { WagmiProvider, useAccount, useDisconnect } from 'wagmi';
import { config, rabbykit } from '@/lib/wagmi';

interface UserState {
  userId: string | null;
  walletAddress: string | null;
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
  const { toast } = useToast();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

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
      const userId = address; // Or a more sophisticated way to get a user ID
      setState((s) => ({ ...s, isConnected: true, walletAddress: address, userId }));
      fetchUserData(userId);
    } else {
      setState(initialState);
    }
  }, [isConnected, address]);

  const fetchUserData = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('total_claimed, total_clicks')
      .eq('id', userId)
      .single();

    if (data) {
      setState((s) => ({
        ...s,
        totalClicks: data.total_clicks,
        totalClaimed: data.total_claimed,
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

    const response = await fetch('/api/click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: state.userId, country: state.country }),
    });

    const data = await response.json();

    if (response.ok) {
      setState((s) => ({
        ...s,
        pendingClicks: data.clicks,
        totalClicks: s.totalClicks + 1,
      }));
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not register click.',
      });
    }
  };

  const claimTokens = async () => {
    if (state.pendingClicks <= 0 || !state.userId) {
      toast({
        variant: 'destructive',
        title: 'No Clicks to Claim',
        description: 'Accumulate some clicks first!',
      });
      return;
    }

    const response = await fetch('/api/claim', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: state.userId }),
    });

    const data = await response.json();

    if (response.ok) {
        setState((s) => ({
            ...s,
            pendingClicks: 0,
            totalClaimed: s.totalClaimed + data.claimed,
        }));
        toast({
            title: '🎉 Tokens Claimed!',
            description: `You have successfully claimed ${data.claimed} FLOW tokens.`,
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not claim tokens.',
        });
    }
  };

  return (
    <UserContext.Provider
      value={{ ...state, connectWallet, disconnectWallet, addClick, claimTokens }}
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
