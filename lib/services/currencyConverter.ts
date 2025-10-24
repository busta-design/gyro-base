/**
 * Service to convert BOB (Bolivianos) to USDC (USD Coin)
 * Uses separate exchange rates for deposits and withdrawals
 */

import { z } from "zod";

// Validate exchange rates from environment
const BOB_USDC_RATE_DEPOSIT = parseFloat(process.env.BOB_USDC_RATE_DEPOSIT || "12.60");
const BOB_USDC_RATE_WITHDRAWL = parseFloat(process.env.BOB_USDC_RATE_WITHDRAWL || "12.40");

if (isNaN(BOB_USDC_RATE_DEPOSIT) || BOB_USDC_RATE_DEPOSIT <= 0) {
  throw new Error(
    "BOB_USDC_RATE_DEPOSIT must be a valid positive number. Current value: " +
      process.env.BOB_USDC_RATE_DEPOSIT
  );
}

if (isNaN(BOB_USDC_RATE_WITHDRAWL) || BOB_USDC_RATE_WITHDRAWL <= 0) {
  throw new Error(
    "BOB_USDC_RATE_WITHDRAWL must be a valid positive number. Current value: " +
      process.env.BOB_USDC_RATE_WITHDRAWL
  );
}

/**
 * Validation schema for conversion amounts
 */
const ConversionAmountSchema = z.number().positive("Amount must be positive");

/**
 * Convert BOB amount to USDC (for deposits)
 * @param amountBob Amount in Bolivianos
 * @returns Amount in USDC (as a string for precision)
 */
export function convertBobToUsdc(amountBob: number): string {
  // Validate input
  const validatedAmount = ConversionAmountSchema.parse(amountBob);

  // Calculate USDC amount: BOB amount / deposit rate (bs per usdc)
  // If 1 USDC = 12.60 BS, then 1 BS = 1/12.60 USDC
  const amountUsdc = validatedAmount / BOB_USDC_RATE_DEPOSIT;

  // Return as string to preserve precision (6 decimals for USDC)
  return amountUsdc.toFixed(6);
}

/**
 * Convert USDC amount to BOB (for withdrawals)
 * @param amountUsdc Amount in USDC
 * @returns Amount in Bolivianos
 */
export function convertUsdcToBob(amountUsdc: number): number {
  // Validate input
  const validatedAmount = ConversionAmountSchema.parse(amountUsdc);

  // Calculate BOB amount: USDC amount * withdrawal rate (bs per usdc)
  const amountBob = validatedAmount * BOB_USDC_RATE_WITHDRAWL;

  return amountBob;
}

/**
 * Get current exchange rate for deposits
 */
export function getDepositExchangeRate(): {
  bobPerUsdc: number;
  rate: string;
} {
  return {
    bobPerUsdc: BOB_USDC_RATE_DEPOSIT,
    rate: `1 USDC = ${BOB_USDC_RATE_DEPOSIT} BS`,
  };
}

/**
 * Get current exchange rate for withdrawals
 */
export function getWithdrawalExchangeRate(): {
  bobPerUsdc: number;
  rate: string;
} {
  return {
    bobPerUsdc: BOB_USDC_RATE_WITHDRAWL,
    rate: `1 USDC = ${BOB_USDC_RATE_WITHDRAWL} BS`,
  };
}
