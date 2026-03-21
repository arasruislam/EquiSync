import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IContribution {
  coOwner: Types.ObjectId;
  amountBDT: number;
  paidAmountBDT: number;
  status: "PENDING" | "CLEARED";
  // amountUSD and paidAmountUSD are derived virtuals
}

export interface IInvestment extends Document {
  contributions: IContribution[];
  amountBDT: number;
  exchangeRate: number;              // 1 USD = X BDT at time of entry
  note?: string;
  date: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  transactionRef?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  // amountUSD is a derived virtual
}

const ContributionSchema = new Schema<IContribution>(
  {
    coOwner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    amountBDT: { type: Number, required: true, min: 0 },
    paidAmountBDT: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["PENDING", "CLEARED"], default: "PENDING" },
  },
  { 
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// USD Virtuals for Each Contribution
ContributionSchema.virtual("amountUSD").get(function(this: any) {
  const parent = this.ownerDocument();
  if (!parent || !parent.exchangeRate) return 0;
  return Number((this.amountBDT / parent.exchangeRate).toFixed(2));
});

ContributionSchema.virtual("paidAmountUSD").get(function(this: any) {
  const parent = this.ownerDocument();
  if (!parent || !parent.exchangeRate) return 0;
  return Number((this.paidAmountBDT / parent.exchangeRate).toFixed(2));
});

const InvestmentSchema = new Schema<IInvestment>(
  {
    contributions: [ContributionSchema],
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
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for Total Investment in USD
InvestmentSchema.virtual("amountUSD").get(function() {
  return Number((this.amountBDT / this.exchangeRate).toFixed(2));
});

InvestmentSchema.index({ "contributions.coOwner": 1 });
InvestmentSchema.index({ "contributions.status": 1 });
InvestmentSchema.index({ isDeleted: 1, date: -1 });

const Investment: Model<IInvestment> =
  mongoose.models.Investment ||
  mongoose.model<IInvestment>("Investment", InvestmentSchema);

export default Investment;
