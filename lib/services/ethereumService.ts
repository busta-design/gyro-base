/**
 * Service to handle USDC transactions on BaseSepolia
 * Uses viem for type-safe blockchain interactions
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  isAddress,
  Address,
  TransactionReceipt,
  encodeFunctionData,
} from "viem";
import { baseSepolia } from "viem/chains";
import { z } from "zod";
import { USDC_ABI } from "@/lib/constants/abi/usdcAbi";
import { SEPOLIA_BASE_USDC } from "@/lib/constants/contractAddresses";
import { privateKeyToAccount } from "viem/accounts";

const PRIVATE_KEY = process.env.PRIVATE_KEY;
if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY environment variable is not set");
}

// Create public client for reading blockchain data
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

// Create wallet client for sending transactions
const walletClient = createWalletClient({
  chain: baseSepolia,
  account: privateKeyToAccount(`0x${PRIVATE_KEY}`),
  transport: http("https://sepolia.base.org"),
});

/**
 * Validation schemas
 */
const AddressSchema = z
  .string()
  .refine((addr) => isAddress(addr), "Invalid Ethereum address");

const AmountSchema = z
  .string()
  .refine((amount) => !isNaN(parseFloat(amount)), "Invalid amount")
  .refine((amount) => parseFloat(amount) > 0, "Amount must be positive");

interface TransactionResult {
  hash: string;
  recipient: Address;
  amountUsdc: string;
  status: "pending" | "confirmed" | "failed";
}

/**
 * Send USDC from the bank wallet to a recipient
 * @param recipientAddress Ethereum address to send USDC to
 * @param amountUsdc Amount of USDC to send (as string for precision)
 * @returns Transaction hash and details
 */
export async function sendUsdcToRecipient(
  recipientAddress: string,
  amountUsdc: string
): Promise<TransactionResult> {
  // Validate inputs with Zod
  const validatedAddress = AddressSchema.parse(recipientAddress);
  const validatedAmount = AmountSchema.parse(amountUsdc);

  try {
    // USDC uses 6 decimals
    const amount = parseFloat(validatedAmount);
    const amountInSmallestUnit = BigInt(Math.floor(amount * 1e6));

    // Encode USDC transfer function call
    const data = encodeFunctionData({
      abi: USDC_ABI,
      functionName: "transfer",
      args: [validatedAddress as Address, amountInSmallestUnit],
    });

    // Send transaction to USDC contract
    const hash = await walletClient.sendTransaction({
      to: SEPOLIA_BASE_USDC,
      data,
      chain: baseSepolia,
    });

    console.log(
      `Transaction sent: ${hash} - Sending ${validatedAmount} USDC to ${validatedAddress}`
    );

    return {
      hash,
      recipient: validatedAddress as Address,
      amountUsdc: validatedAmount,
      status: "pending",
    };
  } catch (error) {
    console.error("Error sending transaction:", error);
    throw new Error(
      `Failed to send transaction: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * Get transaction receipt to check transaction status
 * @param hash Transaction hash
 * @returns Transaction receipt or null if not yet mined
 */
export async function getTransactionReceipt(
  hash: string
): Promise<TransactionReceipt | null> {
  try {
    return await publicClient.getTransactionReceipt({
      hash: hash as `0x${string}`,
    });
  } catch (error) {
    console.error("Error fetching transaction receipt:", error);
    throw new Error(
      `Failed to get transaction receipt: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
