/**
 * Service to convert BOB (Bolivianos) to USDC (USD Coin)
 * Uses a fixed exchange rate of 12.60 BS per USDC
 */

import { z } from "zod";

// Validate exchange rate from environment
const BOB_USDC_RATE = parseFloat(process.env.BOB_USDC_RATE || "12.60");

if (isNaN(BOB_USDC_RATE) || BOB_USDC_RATE <= 0) {
  throw new Error(
    "BOB_USDC_RATE must be a valid positive number. Current value: " +
      process.env.BOB_USDC_RATE
  );
}

/**
 * Validation schema for conversion amounts
 */
const ConversionAmountSchema = z.number().positive("Amount must be positive");

/**
 * Convert BOB amount to USDC
 * @param amountBob Amount in Bolivianos
 * @returns Amount in USDC (as a string for precision)
 */
export function convertBobToUsdc(amountBob: number): string {
  // Validate input
  const validatedAmount = ConversionAmountSchema.parse(amountBob);

  // Calculate USDC amount: BOB amount / rate (bs per usdc)
  // If 1 USDC = 12.60 BS, then 1 BS = 1/12.60 USDC
  const amountUsdc = validatedAmount / BOB_USDC_RATE;

  // Return as string to preserve precision (6 decimals for USDC)
  return amountUsdc.toFixed(6);
}

/**
 * Get current exchange rate
 */
export function getExchangeRate(): {
  bobPerUsdc: number;
  rate: string;
} {
  return {
    bobPerUsdc: BOB_USDC_RATE,
    rate: `1 USDC = ${BOB_USDC_RATE} BS`,
  };
}
