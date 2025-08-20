'use client';

import { useToast } from '@/hooks/use-toast';
import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState } from 'react';

interface UserState {
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
  walletAddress: null,
  isConnected: false,
  pendingClicks: 0,
  totalClicks: 0,
  totalClaimed: 0,
  country: 'BO', // Default to Bolivia as per mock
};

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<UserState>(initialState);
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedState = localStorage.getItem('flowclicker_user_state');
      if (storedState) {
        setState(JSON.parse(storedState));
      }
    } catch (error) {
      console.error('Failed to parse user state from localStorage', error);
    }
    // Fetch country from a geo IP API on initial load
    fetch('https://ipapi.co/country_code')
        .then(res => res.text())
        .then(countryCode => {
            if (countryCode) {
                setState(prevState => ({...prevState, country: countryCode}))
            }
        }).catch(err => console.log("Could not fetch country", err));

    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      try {
        localStorage.setItem('flowclicker_user_state', JSON.stringify(state));
      } catch (error) {
        console.error('Failed to save user state to localStorage', error);
      }
    }
  }, [state, isMounted]);

  const connectWallet = () => {
    // This is a mock connection
    const mockAddress = `0x${Array.from({ length: 40 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('')}`;
    setState((s) => ({ ...s, isConnected: true, walletAddress: mockAddress }));
    toast({
      title: 'Wallet Connected',
      description: `Address: ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`,
    });
  };

  const disconnectWallet = () => {
    setState((s) => ({
      ...s,
      isConnected: false,
      walletAddress: null,
    }));
    toast({ title: 'Wallet Disconnected' });
  };

  const addClick = () => {
    if (!state.isConnected) {
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
  };

  const claimTokens = () => {
    if (state.pendingClicks <= 0) {
      toast({
        variant: 'destructive',
        title: 'No Clicks to Claim',
        description: 'Accumulate some clicks first!',
      });
      return;
    }

    const clicksToClaim = state.pendingClicks;
    setState((s) => ({
      ...s,
      pendingClicks: 0,
      totalClaimed: s.totalClaimed + clicksToClaim,
    }));

    toast({
      title: '🎉 Tokens Claimed!',
      description: `You have successfully claimed ${clicksToClaim} FLOW tokens.`,
    });
  };

  if (!isMounted) {
    return null; // or a loading spinner
  }

  return (
    <UserContext.Provider
      value={{ ...state, connectWallet, disconnectWallet, addClick, claimTokens }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
