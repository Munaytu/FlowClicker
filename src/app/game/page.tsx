'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useUser } from '@/context/user-provider';
import { AnimatePresence, motion } from 'framer-motion';
import { Coins, Gift, Hand, HelpCircle, Loader2, TrendingDown, Zap } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PulseIcon } from '@/components/ui/pulse-icon';
import { ClickAnimation } from '@/components/ui/click-animation';
import { useState } from 'react';

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

  const [animations, setAnimations] = useState<{ id: number; text: string; color: string }[]>([]); // New state
  const [animationIdCounter, setAnimationIdCounter] = useState(0); // New state

  const handleAnimationComplete = (id: number) => {
    setAnimations(prev => prev.filter(anim => anim.id !== id));
  };

  const claimTooltipText = "The claimable token amount changes in real-time based on a decay mechanism. The earlier you click, the more you earn!";

  return (
    <div className="container flex flex-col items-center justify-center py-10">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2 text-2xl md:text-3xl font-headline">
            <img src="/flow-logo.png" alt="FlowClicker Logo" className="h-24 w-24" />
            SONIC-FLOW
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <motion.button
              onClick={() => {
                addClick();
                setAnimationIdCounter(prev => prev + 1);
                const colors = ["#FFD700", "#ADFF2F", "#00FFFF", "#FF69B4", "#8A2BE2"]; // Gold, GreenYellow, Cyan, HotPink, BlueViolet
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                setAnimations(prev => [...prev, { id: animationIdCounter, text: "BUY $FLOW", color: randomColor }]);
              }}
              disabled={!isConnected}
              className="group relative h-48 w-48 md:h-64 md:w-64 rounded-full border-8 border-primary bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60 overflow-hidden"
              aria-label="Click to earn"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-primary/20 transition-colors group-hover:bg-primary/30">
                <PulseIcon />
              </div>
              <AnimatePresence>
                {animations.map(anim => (
                  <ClickAnimation key={anim.id} id={anim.id} text={anim.text} color={anim.color} onComplete={handleAnimationComplete} />
                ))}
              </AnimatePresence>
            </motion.button>
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
              <p className="text-center text-2xl font-bold text-primary">{currentRewardPerClick ? parseFloat(currentRewardPerClick).toLocaleString(undefined, { maximumFractionDigits: 6 }) : '0'}</p>
              <p className="text-center text-xs text-primary/80">tokens / click</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border bg-card p-4">
              <p className="text-sm text-muted-foreground">Clicks</p>
              <p className="text-3xl font-bold flex items-center justify-center gap-2">
                {pendingClicks ? pendingClicks.toLocaleString() : '0'} <span className="text-2xl">💫</span>
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
                {claimableTokens ? parseFloat(claimableTokens).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'} <Coins className="h-7 w-7" />
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
            <AnimatePresence mode="wait" initial={false}>
              {isClaiming ? (
                <motion.span
                  key="claiming"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  CLAIMING...
                </motion.span>
              ) : (
                <motion.span
                  key="claim"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <Gift className="mr-2 h-5 w-5" />
                  CLAIM TOKENS
                </motion.span>
              )}
            </AnimatePresence>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}