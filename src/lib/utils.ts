import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { CSSProperties } from 'react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shape of a react-syntax-highlighter Prism style (e.g. oneDark/oneLight). */
export type PrismStyle = Record<string, CSSProperties>;
