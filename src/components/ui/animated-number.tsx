'use client';

import { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  localeOptions?: Intl.NumberFormatOptions;
}

const AnimatedNumber = ({ value, className, localeOptions }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const startValue = prevValueRef.current;
    const endValue = value;
    const duration = 1500; // Animate over 1.5 seconds
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }

      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);

      const animatedValue = startValue + (endValue - startValue) * percentage;
      setDisplayValue(animatedValue);

      if (progress < duration) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure the final value is exactly the target value
        setDisplayValue(endValue);
        prevValueRef.current = endValue;
      }
    };

    // Cancel any previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value]);

  return (
    <span className={className}>
      {displayValue.toLocaleString(undefined, localeOptions)}
    </span>
  );
};

export default AnimatedNumber;
