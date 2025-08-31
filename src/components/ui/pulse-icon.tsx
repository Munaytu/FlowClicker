import { Zap } from 'lucide-react';

export function PulseIcon() {
  return (
    <div className="relative flex h-24 w-24 items-center justify-center">
      {/* Animated rings */}
      <div className="absolute inline-flex h-full w-full rounded-full bg-primary/80 opacity-75 pulse-ring"></div>
      <div
        className="absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75 pulse-ring"
        style={{ animationDelay: '0.5s' }}
      ></div>
      
      {/* Central static icon */}
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/30">
        <img src="/flow-logo.png" alt="FlowClicker Logo" className="h-10 w-10 text-primary" />
      </div>
    </div>
  );
}
