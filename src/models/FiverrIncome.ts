import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type FiverrIncomeType = "GREEN" | "WITHDRAWN";

export interface IFiverrIncome extends Document {
  type: FiverrIncomeType;            // GREEN = pending clearance, WITHDRAWN = cleared & available
  amountUSD: number;
  amountBDT: number;
  exchangeRate: number;
  orderId?: string;
  clientName?: string;
  projectRef?: Types.ObjectId;       // ref: Project
  date: Date;
  clearedAt?: Date;                  // when GREEN → WITHDRAWN transition happened
  note?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  transactionRef?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const FiverrIncomeSchema = new Schema<IFiverrIncome>(
  {
    type: {
      type: String,
      enum: ["GREEN", "WITHDRAWN"],
      required: true,
    },
    amountUSD: { type: Number, required: true, min: 0 },
    amountBDT: { type: Number, required: true, min: 0 },
    exchangeRate: { type: Number, required: true, min: 0 },
    orderId: { type: String, trim: true },
    clientName: { type: String, trim: true },
    projectRef: { type: Schema.Types.ObjectId, ref: "Project" },
    date: { type: Date, required: true, default: Date.now },
    clearedAt: { type: Date },
    note: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transactionRef: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true }
);
FiverrIncomeSchema.index({ type: 1 });
FiverrIncomeSchema.index({ isDeleted: 1, type: 1, date: -1 });
FiverrIncomeSchema.index({ orderId: 1 });

const FiverrIncome: Model<IFiverrIncome> =
  mongoose.models.FiverrIncome ||
  mongoose.model<IFiverrIncome>("FiverrIncome", FiverrIncomeSchema);

export default FiverrIncome;
