'use client';

import Link from 'next/link';
import { MainNav } from './main-nav';
import { Button } from '../ui/button';
import { useUser } from '@/context/user-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ChevronDown, Coins, Wallet } from 'lucide-react';

export function Header() {
  const { isConnected, walletAddress, connectWallet, disconnectWallet } = useUser();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex items-center gap-2">
          <Coins className="h-6 w-6 text-primary" />
          <Link href="/game" className="font-bold text-xl">
            FlowClicker
          </Link>
        </div>
        <MainNav />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {isConnected && walletAddress ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">
                    <Wallet className="mr-2 h-4 w-4" />
                    {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={disconnectWallet}>
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button onClick={connectWallet}>
                <Wallet className="mr-2 h-4 w-4" />
                Connect Wallet
              </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
