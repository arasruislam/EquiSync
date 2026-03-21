import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ExpenseCategory =
  | "SOFTWARE"
  | "TOOLS"
  | "MARKETING"
  | "OFFICE"
  | "SALARY"
  | "FREELANCER"
  | "MISC";

export interface IExpense extends Document {
  category: ExpenseCategory;
  amountBDT: number;
  exchangeRate: number;
  description: string;
  vendor?: string;
  date: Date;
  receiptUrl?: string;
  project?: Types.ObjectId;          // ref: Project (if project-specific)
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  transactionRef?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    category: {
      type: String,
      enum: ["SOFTWARE", "TOOLS", "MARKETING", "OFFICE", "SALARY", "FREELANCER", "MISC"],
      required: true,
    },
    amountBDT: { type: Number, required: true, min: 0 },
    exchangeRate: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true },
    vendor: { type: String, trim: true },
    date: { type: Date, required: true, default: Date.now },
    receiptUrl: { type: String, trim: true },
    project: { type: Schema.Types.ObjectId, ref: "Project" },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    transactionRef: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for Expense in USD
ExpenseSchema.virtual("amountUSD").get(function() {
  return Number((this.amountBDT / this.exchangeRate).toFixed(2));
});
ExpenseSchema.index({ category: 1 });
ExpenseSchema.index({ isDeleted: 1, date: -1 });

const Expense: Model<IExpense> =
  mongoose.models.Expense ||
  mongoose.model<IExpense>("Expense", ExpenseSchema);

export default Expense;
