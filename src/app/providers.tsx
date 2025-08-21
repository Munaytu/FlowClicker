'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProvider } from '@/context/user-provider';
import { WagmiProvider } from 'wagmi';
import { config } from '../lib/wagmi';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <UserProvider>{children}</UserProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
