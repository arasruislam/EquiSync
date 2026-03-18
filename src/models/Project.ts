import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ProjectStatus = "ACTIVE" | "COMPLETED" | "ON_HOLD" | "CANCELLED";

export interface IProject extends Document {
  title: string;
  description?: string;
  clientName?: string;
  status: ProjectStatus;
  totalValueUSD: number;
  totalValueBDT: number;
  exchangeRate: number;
  assignedTo: Types.ObjectId[];      // ref: User[]
  managedBy?: Types.ObjectId;        // ref: User (PROJECT_MANAGER or LEADER)
  startDate: Date;
  endDate?: Date;
  tags?: string[];
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    clientName: { type: String, trim: true },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "ON_HOLD", "CANCELLED"],
      default: "ACTIVE",
    },
    totalValueUSD: { type: Number, required: true, min: 0 },
    totalValueBDT: { type: Number, required: true, min: 0 },
    exchangeRate: { type: Number, required: true, min: 0 },
    assignedTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
    managedBy: { type: Schema.Types.ObjectId, ref: "User" },
    startDate: { type: Date, required: true, default: Date.now },
    endDate: { type: Date },
    tags: [{ type: String, trim: true }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ProjectSchema.index({ status: 1 });
ProjectSchema.index({ isDeleted: 1 });
ProjectSchema.index({ assignedTo: 1 });
ProjectSchema.index({ managedBy: 1 });
ProjectSchema.index({ createdAt: -1 });

const Project: Model<IProject> =
  mongoose.models.Project ||
  mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
