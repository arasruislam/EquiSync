import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IContribution {
  coOwner: Types.ObjectId;
  amountUSD: number;
  amountBDT: number;
  paidAmountUSD: number;
  paidAmountBDT: number;
  status: "PENDING" | "CLEARED";
}

export interface IInvestment extends Document {
  contributions: IContribution[];    // replaces single investor ref
  amountUSD: number;                 // Total required
  amountBDT: number;                 // Total required
  exchangeRate: number;              // 1 USD = X BDT at time of entry
  note?: string;
  date: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;         // Must be SUPER_ADMIN
  transactionRef?: Types.ObjectId;   // ref: Transaction
  createdAt: Date;
  updatedAt: Date;
}

const InvestmentSchema = new Schema<IInvestment>(
  {
    contributions: [
      {
        coOwner: { type: Schema.Types.ObjectId, ref: "User", required: true },
        amountUSD: { type: Number, required: true, min: 0 },
        amountBDT: { type: Number, required: true, min: 0 },
        paidAmountUSD: { type: Number, default: 0, min: 0 },
        paidAmountBDT: { type: Number, default: 0, min: 0 },
        status: { type: String, enum: ["PENDING", "CLEARED"], default: "PENDING" },
      }
    ],
    amountUSD: { type: Number, required: true, min: 0 },
    amountBDT: { type: Number, required: true, min: 0 },
    exchangeRate: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transactionRef: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true }
);
InvestmentSchema.index({ "contributions.coOwner": 1 });
InvestmentSchema.index({ "contributions.status": 1 });
InvestmentSchema.index({ isDeleted: 1, date: -1 });

const Investment: Model<IInvestment> =
  mongoose.models.Investment ||
  mongoose.model<IInvestment>("Investment", InvestmentSchema);

export default Investment;
