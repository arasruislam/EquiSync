import dbConnect from "@/lib/mongoose";
import Transaction, { TransactionType, TransactionDirection } from "@/models/Transaction";
import { Types } from "mongoose";

interface CreateTransactionParams {
  type: TransactionType;
  direction: TransactionDirection;
  amountUSD: number;
  amountBDT: number;
  exchangeRate: number;
  sourceModel: string;
  sourceId: Types.ObjectId | string;
  description: string;
  createdBy: Types.ObjectId | string;
  date?: Date;
}

/**
 * Creates a central transaction ledger entry.
 * Business Rule: Every financial movement MUST create a transaction record.
 */
export async function createLedgerEntry(params: CreateTransactionParams) {
  await dbConnect();

  const transaction = await Transaction.create({
    ...params,
    date: params.date || new Date(),
  });

  return transaction;
}
