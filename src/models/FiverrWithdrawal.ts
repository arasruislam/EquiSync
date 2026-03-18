import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type WithdrawalMethod =
  | "PAYONEER"
  | "WISE"
  | "BKASH"
  | "BANK_TRANSFER"
  | "OTHER";

export interface IFiverrWithdrawal extends Document {
  amountUSD: number;
  amountBDT: number;
  exchangeRate: number;
  method: WithdrawalMethod;
  reference?: string;                // e.g. bank ref / Payoneer txn ID
  date: Date;
  note?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  transactionRef?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FiverrWithdrawalSchema = new Schema<IFiverrWithdrawal>(
  {
    amountUSD: { type: Number, required: true, min: 0 },
    amountBDT: { type: Number, required: true, min: 0 },
    exchangeRate: { type: Number, required: true, min: 0 },
    method: {
      type: String,
      enum: ["PAYONEER", "WISE", "BKASH", "BANK_TRANSFER", "OTHER"],
      required: true,
    },
    reference: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },
    note: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transactionRef: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true }
);

FiverrWithdrawalSchema.index({ isDeleted: 1 });
FiverrWithdrawalSchema.index({ date: -1 });

const FiverrWithdrawal: Model<IFiverrWithdrawal> =
  mongoose.models.FiverrWithdrawal ||
  mongoose.model<IFiverrWithdrawal>("FiverrWithdrawal", FiverrWithdrawalSchema);

export default FiverrWithdrawal;
