import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currency = "USDC",
  decimals = 2
): string {
  return `${amount.toFixed(decimals)} ${currency}`;
}

export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function calculateMonthlyYield(amount: number, apy: number): number {
  // Convert APY to monthly rate
  const monthlyRate = apy / 100 / 12;
  return amount * monthlyRate;
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
