/**
 * Bank Webhook Endpoint for Deposit Processing
 * Receives BOB deposits and converts them to USDC on BaseSepolia
 *
 * POST /api/bank/webhook/deposit
 * Body: { amount: number (in BOB), recipientAddress: string (Ethereum address) }
 */

import {
  convertBobToUsdc,
  getExchangeRate,
} from "@/lib/services/currencyConverter";
import { sendUsdcToRecipient } from "@/lib/services/ethereumService";
import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";

/**
 * Validation schemas using Zod
 */
const DepositRequestSchema = z.object({
  amount: z
    .number()
    .positive("amount must be a positive number")
    .describe("Amount in Bolivianos (BOB)"),
  recipientAddress: z
    .string()
    .refine((address) => isAddress(address), {
      message: "RecipientAddress must be a valid Ethereum address",
    })
    .describe("Ethereum address to receive USDC"),
});

type DepositRequest = z.infer<typeof DepositRequestSchema>;

interface DepositResponse {
  success: boolean;
  data?: {
    transactionHash: string;
    amountBob: number;
    amountUsdc: string;
    exchangeRate: string;
    recipientAddress: string;
    timestamp: string;
  };
  error?: string;
  statusCode: number;
}

/**
 * POST /api/bank/webhook/deposit
 * Process a deposit in BOB and send equivalent USDC
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<DepositResponse>> {
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
    let validatedData: DepositRequest;
    try {
      validatedData = DepositRequestSchema.parse(body);
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

    const { amount: amountBob, recipientAddress } = validatedData;

    console.log(
      `[DEPOSIT WEBHOOK] Processing deposit: ${amountBob} BOB to ${recipientAddress}`
    );

    // Convert BOB to USDC
    const amountUsdc = convertBobToUsdc(amountBob);
    const exchangeRate = getExchangeRate();
    console.log(
      `[DEPOSIT WEBHOOK] Converted to ${amountUsdc} USDC (${exchangeRate.rate})`
    );

    // Send USDC to recipient
    const result = await sendUsdcToRecipient(recipientAddress, amountUsdc);
    console.log(`[DEPOSIT WEBHOOK] Transaction sent: ${result.hash}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          transactionHash: result.hash,
          amountBob,
          amountUsdc,
          exchangeRate: exchangeRate.rate,
          recipientAddress,
          timestamp: new Date().toISOString(),
        },
        statusCode: 200,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[DEPOSIT WEBHOOK] Error:", errorMessage);

    // Determine appropriate status code based on error type
    let statusCode = 500;
    let responseError = "Internal server error";

    if (errorMessage.includes("Insufficient balance")) {
      statusCode = 402;
      responseError = "Insufficient USDC balance in bank account";
    } else if (
      errorMessage.includes("Invalid") ||
      errorMessage.includes("Validation error")
    ) {
      statusCode = 400;
      responseError = errorMessage;
    } else if (errorMessage.includes("network")) {
      statusCode = 503;
      responseError = "Blockchain network error";
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
