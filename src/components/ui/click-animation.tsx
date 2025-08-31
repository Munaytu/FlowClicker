'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ClickAnimationProps {
  id: number;
  text: string;
  color: string; // Added color
  onComplete: (id: number) => void;
}

export function ClickAnimation({ id, text, color, onComplete }: ClickAnimationProps) { // Added color
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, scale: 0.8 }}
      animate={{ opacity: 1, y: -50, scale: 1 }}
      exit={{ opacity: 0, y: -100, scale: 1.2 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onAnimationComplete={() => onComplete(id)}
      className="absolute text-2xl font-bold text-primary-foreground pointer-events-none whitespace-nowrap"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10,
        textShadow: '0 0 8px rgba(255,255,255,0.5)',
        color: color // Used color
      }}
    >
      {text}
    </motion.div>
  );
}
