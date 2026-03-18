import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PayoutType = "SALARY" | "BONUS" | "COMMISSION" | "PROJECT_SHARE" | "OTHER";

export interface IPayout extends Document {
  recipient: Types.ObjectId;         // ref: User
  amountBDT: number;
  amountUSD: number;
  exchangeRate: number;
  type: PayoutType;
  project?: Types.ObjectId;          // ref: Project (optional, for project-based payouts)
  projectShare?: Types.ObjectId;     // ref: ProjectShare (optional)
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

const PayoutSchema = new Schema<IPayout>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountBDT: { type: Number, required: true, min: 0 },
    amountUSD: { type: Number, required: true, min: 0 },
    exchangeRate: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ["SALARY", "BONUS", "COMMISSION", "PROJECT_SHARE", "OTHER"],
      required: true,
    },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    projectShare: { type: Schema.Types.ObjectId, ref: "ProjectShare" },
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

PayoutSchema.index({ recipient: 1 });
PayoutSchema.index({ type: 1 });
PayoutSchema.index({ isDeleted: 1 });
PayoutSchema.index({ date: -1 });

const Payout: Model<IPayout> =
  mongoose.models.Payout ||
  mongoose.model<IPayout>("Payout", PayoutSchema);

export default Payout;
