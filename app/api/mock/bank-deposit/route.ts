/**
 * Mock Bank Deposit Endpoint
 * Simulates a bank sending a deposit request to the webhook
 *
 * POST /api/mock/bank-deposit
 * Body: { amount: number (in BOB), recipientAddress: string (Ethereum address) }
 */

import { NextRequest, NextResponse } from "next/server";
import { isAddress } from "viem";
import { z } from "zod";

/**
 * Validation schemas using Zod (matches webhook validation)
 */
const MockBankDepositSchema = z.object({
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

type MockBankDepositRequest = z.infer<typeof MockBankDepositSchema>;

/**
 * POST /api/mock/bank-deposit
 * Simulate a bank deposit request and forward to the webhook
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse> {
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
    let validatedData: MockBankDepositRequest;
    try {
      validatedData = MockBankDepositSchema.parse(body);
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

    const { amount, recipientAddress } = validatedData;

    console.log(
      `[MOCK BANK] Simulating deposit: ${amount} BOB to ${recipientAddress}`
    );

    // Get the base URL for the webhook
    const baseUrl = request.headers.get("x-forwarded-proto")
      ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get(
          "x-forwarded-host"
        )}`
      : `http://localhost:3000`;

    const webhookUrl = `${baseUrl}/api/webhook/bank/deposit`;

    // Forward request to the actual webhook
    console.log(`[MOCK BANK] Forwarding to webhook: ${webhookUrl}`);

    const webhookResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Bank-Source": "mock-bank", // Add header to identify mock requests
      },
      body: JSON.stringify({
        amount,
        recipientAddress,
      }),
    });

    const webhookData = await webhookResponse.json();

    console.log(
      `[MOCK BANK] Webhook response status: ${webhookResponse.status}`
    );

    // Return the webhook response to the client
    return NextResponse.json(webhookData, { status: webhookResponse.status });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MOCK BANK] Error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        statusCode: 500,
      },
      { status: 500 }
    );
  }
}
