import mongoose, { Schema, Document, Model, Types } from "mongoose";

/**
 * Central Transaction Ledger
 * Every financial event creates one Transaction record.
 *
 * CREDIT events (increase company balance):
 *   - INVESTMENT    → co-founder adds money
 *   - FIVERR_INCOME → income received on Fiverr
 *
 * DEBIT events (decrease company balance):
 *   - WITHDRAWAL    → Fiverr balance withdrawn to bank
 *   - PAYOUT        → member/employee is paid
 *   - EXPENSE       → business expense recorded
 */
export type TransactionType =
  | "INVESTMENT"
  | "FIVERR_INCOME"
  | "WITHDRAWAL"
  | "PAYOUT"
  | "EXPENSE";

export type TransactionDirection = "CREDIT" | "DEBIT";

export interface ITransaction extends Document {
  type: TransactionType;
  direction: TransactionDirection;
  amountUSD: number;
  amountBDT: number;
  exchangeRate: number;
  sourceModel: string;               // 'Investment' | 'FiverrIncome' | etc.
  sourceId: Types.ObjectId;          // ref to the source document
  description: string;
  date: Date;
  balanceAfterUSD?: number;          // running balance snapshot (optional)
  balanceAfterBDT?: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
  {
    type: {
      type: String,
      enum: ["INVESTMENT", "FIVERR_INCOME", "WITHDRAWAL", "PAYOUT", "EXPENSE"],
      required: true,
    },
    direction: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    amountUSD: { type: Number, required: true, min: 0 },
    amountBDT: { type: Number, required: true, min: 0 },
    exchangeRate: { type: Number, required: true, min: 0 },
    sourceModel: { type: String, required: true },
    sourceId: { type: Schema.Types.ObjectId, required: true, refPath: "sourceModel" },
    description: { type: String, required: true, trim: true },
    date: { type: Date, required: true, default: Date.now },
    balanceAfterUSD: { type: Number },
    balanceAfterBDT: { type: Number },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);
TransactionSchema.index({ type: 1, direction: 1, date: -1 });
TransactionSchema.index({ sourceModel: 1, sourceId: 1 });
TransactionSchema.index({ createdBy: 1 });

const Transaction: Model<ITransaction> =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>("Transaction", TransactionSchema);

export default Transaction;
