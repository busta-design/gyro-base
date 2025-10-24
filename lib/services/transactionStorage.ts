/**
 * In-memory transaction storage service
 * Stores transaction records for later retrieval
 */

export interface StoredTransaction {
  transactionId: string;
  withdrawalId: string;
  amountUsdc: string;
  amountBob: string;
  exchangeRate: string;
  senderAddress: string;
  recipientBankAccount: string;
  recipientName: string;
  status: "pending" | "processing" | "completed" | "failed";
  txHash?: string;
  timestamp: string;
  errorMessage?: string;
}

// In-memory storage
let transactions: Map<string, StoredTransaction> = new Map();

/**
 * Save a transaction to memory
 */
export function saveTransaction(transaction: StoredTransaction): void {
  transactions.set(transaction.transactionId, transaction);
  console.log(`[TRANSACTION STORAGE] Saved transaction: ${transaction.transactionId}`);
}

/**
 * Get a transaction by ID
 */
export function getTransaction(transactionId: string): StoredTransaction | null {
  return transactions.get(transactionId) || null;
}

/**
 * Get all transactions
 */
export function getAllTransactions(): StoredTransaction[] {
  return Array.from(transactions.values());
}

/**
 * Get transactions by sender address
 */
export function getTransactionsByAddress(address: string): StoredTransaction[] {
  return Array.from(transactions.values()).filter(
    (tx) => tx.senderAddress.toLowerCase() === address.toLowerCase()
  );
}

/**
 * Update transaction status
 */
export function updateTransactionStatus(
  transactionId: string,
  status: StoredTransaction["status"],
  txHash?: string,
  errorMessage?: string
): StoredTransaction | null {
  const transaction = transactions.get(transactionId);
  if (!transaction) return null;

  transaction.status = status;
  if (txHash) transaction.txHash = txHash;
  if (errorMessage) transaction.errorMessage = errorMessage;

  transactions.set(transactionId, transaction);
  console.log(`[TRANSACTION STORAGE] Updated transaction ${transactionId} status to ${status}`);
  return transaction;
}

/**
 * Delete a transaction (optional)
 */
export function deleteTransaction(transactionId: string): boolean {
  return transactions.delete(transactionId);
}

/**
 * Clear all transactions (useful for testing)
 */
export function clearAllTransactions(): void {
  transactions.clear();
  console.log("[TRANSACTION STORAGE] Cleared all transactions");
}
