'use client';

import Link from 'next/link';
import { MainNav, navItems } from './main-nav';
import { Button } from '../ui/button';
import { useUser } from '@/context/user-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ChevronDown, Menu, Wallet } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const { isConnected, walletAddress, connectWallet, disconnectWallet, isWrongNetwork, switchToSonicNetwork } = useUser();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-16 items-center">
        {/* Mobile Nav */}
        <div className="md:hidden">
          <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="flex flex-col gap-4 py-4">
                <div className="mb-4 flex items-center gap-2">
                  <img src="/flow-logo.png" alt="FlowClicker Logo" className="h-6 w-6 text-primary" />
                  <span className="font-bold text-xl">FlowClicker</span>
                </div>
                <nav className="flex flex-col gap-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSheetOpen(false)}
                      className={cn(
                        'rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent',
                        pathname === item.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-2">
          <img src="/flow-logo.png" alt="FlowClicker Logo" className="h-6 w-6 text-primary" />
          <Link href="/game" className="font-bold text-xl">
            FlowClicker
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <MainNav />
        </div>

        <div className="flex items-center justify-end space-x-2 md:space-x-4 ml-auto">
          {isConnected && walletAddress ? (
            isWrongNetwork ? (
              <Button onClick={switchToSonicNetwork} variant="destructive">
                <img src="/flow-logo.png" alt="FlowClicker Logo" className="mr-2 h-4 w-4" />
                Switch to Sonic
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary">
                    <Wallet className="mr-0 md:mr-2 h-4 w-4" />
                    <span className="hidden md:inline">
                      {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                    </span>
                    <span className="md:hidden">
                      {`${walletAddress.slice(0, 4)}...`}
                    </span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={disconnectWallet}>
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : (
            <Button onClick={connectWallet}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
