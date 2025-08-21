'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/context/user-provider';
import { Coins, Gift, Hand, HelpCircle, Loader2, TrendingDown, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function GamePage() {
  const { 
    pendingClicks, 
    addClick, 
    claimTokens, 
    isConnected, 
    isClaiming, 
    claimableTokens,
    currentRewardPerClick
  } = useUser();

  const claimTooltipText = "The claimable token amount changes in real-time based on a decay mechanism. The earlier you click, the more you earn!";

  return (
    <div className="container flex flex-col items-center justify-center py-10">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl md:text-3xl font-headline">
            <Zap className="h-8 w-8 text-primary" />
            SONIC-FLOW
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <button
              onClick={addClick}
              disabled={!isConnected}
              className="group relative h-64 w-64 rounded-full border-8 border-primary bg-primary/10 transition-transform duration-150 ease-in-out active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Click to earn"
            >
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/20 transition-colors group-hover:bg-primary/30">
                <Hand className="h-24 w-24 text-primary transition-transform group-hover:scale-110" />
              </div>
            </button>
            {!isConnected && (
              <p className="text-sm text-destructive">Connect wallet to play!</p>
            )}
          </div>

          <Card className="border-primary/50 bg-primary/10">
            <CardContent className="p-4">
              <p className="text-sm text-center text-primary font-semibold flex items-center justify-center gap-1.5">
                <TrendingDown className="h-4 w-4 animate-pulse" />
                Current Reward Rate
              </p>
              <p className="text-center text-2xl font-bold text-primary">{parseFloat(currentRewardPerClick).toLocaleString(undefined, { maximumFractionDigits: 6 })}</p>
              <p className="text-center text-xs text-primary/80">tokens / click</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Clicks</p>
              <p className="text-3xl font-bold flex items-center justify-center gap-2">
                {pendingClicks.toLocaleString()} <span className="text-2xl">💫</span>
              </p>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center justify-center text-sm text-muted-foreground">
                Ready to claim
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-3.5 w-3.5 ml-1.5 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{claimTooltipText}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-3xl font-bold text-primary flex items-center justify-center gap-2">
                {parseFloat(claimableTokens).toLocaleString(undefined, { maximumFractionDigits: 2 })} <Coins className="h-7 w-7" />
              </p>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full text-lg font-bold"
            onClick={claimTokens}
            disabled={pendingClicks <= 0 || !isConnected || isClaiming}
            variant="default"
          >
            {isClaiming ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Gift className="mr-2 h-5 w-5" />
            )}
            {isClaiming ? 'CLAIMING...' : 'CLAIM TOKENS'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}