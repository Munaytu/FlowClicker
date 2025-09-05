import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// This is a utility function to merge class names.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a token amount to a string with a specified number of decimal places.
 * @param amount The amount to format.
 * @param options The formatting options.
 * @returns The formatted amount as a string.
 */
export function formatTokenAmount(
  amount: number | string | undefined | null,
  options: Intl.NumberFormatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }
): string {
  if (amount === null || amount === undefined) {
    return '0';
  }
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) {
    return '0';
  }
  return num.toLocaleString(undefined, options);
}
