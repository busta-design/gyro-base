/**
 * Endpoint to retrieve transaction data
 * GET /api/transactions/get?id=<transactionId>
 * GET /api/transactions/get?address=<senderAddress>
 * GET /api/transactions/get (get all transactions)
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getTransaction,
  getAllTransactions,
  getTransactionsByAddress,
  StoredTransaction,
} from "@/lib/services/transactionStorage";

interface GetTransactionsResponse {
  success: boolean;
  data?: StoredTransaction | StoredTransaction[];
  error?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<GetTransactionsResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("id");
    const senderAddress = searchParams.get("address");

    if (transactionId) {
      // Get specific transaction by ID
      const transaction = getTransaction(transactionId);
      if (!transaction) {
        return NextResponse.json(
          { success: false, error: "Transaction not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        data: transaction,
      });
    } else if (senderAddress) {
      // Get transactions by sender address
      const transactions = getTransactionsByAddress(senderAddress);
      return NextResponse.json({
        success: true,
        data: transactions,
      });
    } else {
      // Get all transactions
      const transactions = getAllTransactions();
      return NextResponse.json({
        success: true,
        data: transactions,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[GET TRANSACTIONS] Error:", errorMessage);

    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
