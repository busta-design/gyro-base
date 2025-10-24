/**
 * Bank Webhook Endpoint for Withdrawal Processing
 * Receives USDC from user and processes withdrawal to BOB
 *
 * POST /api/webhook/bank/withdraw
 * Body: { 
 *   amountUsdc: string, 
 *   senderAddress: string (Ethereum address),
 *   recipientBankAccount: string,
 *   recipientName: string
 * }
 */

import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";
import { convertUsdcToBob, getWithdrawalExchangeRate } from "@/lib/services/currencyConverter";

/**
 * Validation schemas using Zod
 */
const WithdrawRequestSchema = z.object({
  amountUsdc: z
    .string()
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "amountUsdc must be a positive number",
    })
    .describe("Amount in USDC to withdraw"),
  senderAddress: z
    .string()
    .refine((address) => isAddress(address), {
      message: "senderAddress must be a valid Ethereum address",
    })
    .describe("Ethereum address sending USDC"),
  recipientBankAccount: z
    .string()
    .min(1, "recipientBankAccount is required")
    .describe("Bank account number to receive BOB"),
  recipientName: z
    .string()
    .min(1, "recipientName is required")
    .describe("Name of the bank account holder"),
  txHash: z
    .string()
    .optional()
    .describe("Transaction hash of the USDC transfer"),
});

type WithdrawRequest = z.infer<typeof WithdrawRequestSchema>;

interface WithdrawResponse {
  success: boolean;
  data?: {
    withdrawalId: string;
    amountUsdc: string;
    amountBob: string;
    exchangeRate: string;
    recipientBankAccount: string;
    recipientName: string;
    senderAddress: string;
    status: "pending" | "processing" | "completed";
    timestamp: string;
  };
  error?: string;
  statusCode: number;
}

/**
 * POST /api/webhook/bank/withdraw
 * Process a withdrawal from USDC to BOB
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<WithdrawResponse>> {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
          statusCode: 400,
        },
        { status: 400 }
      );
    }

    // Validate request with Zod
    let validatedData: WithdrawRequest;
    try {
      validatedData = WithdrawRequestSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues
          .map((err) => `${err.path.join(".")}: ${err.message}`)
          .join(", ");
        return NextResponse.json(
          {
            success: false,
            error: `Validation error: ${errorMessages}`,
            statusCode: 400,
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const {
      amountUsdc,
      senderAddress,
      recipientBankAccount,
      recipientName,
      txHash,
    } = validatedData;

    console.log(
      `[WITHDRAW WEBHOOK] Processing withdrawal: ${amountUsdc} USDC from ${senderAddress} to ${recipientBankAccount}`
    );

    // Convert USDC to BOB
    const amountBob = convertUsdcToBob(parseFloat(amountUsdc));
    const exchangeRate = getWithdrawalExchangeRate();
    console.log(
      `[WITHDRAW WEBHOOK] Converted to ${amountBob} BOB (rate: ${exchangeRate.rate})`
    );

    // Generate withdrawal ID
    const withdrawalId = `WD${Date.now().toString().slice(-8)}`;

    // In production, here you would:
    // 1. Verify the USDC transaction on-chain (using txHash)
    // 2. Initiate bank transfer to recipientBankAccount
    // 3. Store withdrawal record in database
    // 4. Send confirmation to user

    console.log(
      `[WITHDRAW WEBHOOK] Withdrawal ${withdrawalId} created successfully`
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          withdrawalId,
          amountUsdc,
          amountBob: amountBob.toFixed(2),
          exchangeRate: exchangeRate.rate,
          recipientBankAccount,
          recipientName,
          senderAddress,
          status: "processing",
          timestamp: new Date().toISOString(),
        },
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[WITHDRAW WEBHOOK] Error:", errorMessage);

    // Determine appropriate status code based on error type
    let statusCode = 500;
    let responseError = "Internal server error";

    if (
      errorMessage.includes("Invalid") ||
      errorMessage.includes("Validation error")
    ) {
      statusCode = 400;
      responseError = errorMessage;
    } else if (errorMessage.includes("network")) {
      statusCode = 503;
      responseError = "Network error";
    }

    return NextResponse.json(
      {
        success: false,
        error: responseError,
        statusCode,
      },
      { status: statusCode }
    );
  }
}
