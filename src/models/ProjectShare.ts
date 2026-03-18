import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IProjectShare extends Document {
  project: Types.ObjectId;           // ref: Project
  member: Types.ObjectId;            // ref: User
  sharePercent: number;              // 0–100
  shareAmountUSD: number;            // calculated: project.totalValueUSD * sharePercent / 100
  shareAmountBDT: number;
  note?: string;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectShareSchema = new Schema<IProjectShare>(
  {
    project: { type: Schema.Types.ObjectId, ref: "Project", required: true },
    member: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sharePercent: { type: Number, required: true, min: 0, max: 100 },
    shareAmountUSD: { type: Number, required: true, min: 0 },
    shareAmountBDT: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// One share record per member per project
ProjectShareSchema.index({ project: 1, member: 1 }, { unique: true, sparse: true });
ProjectShareSchema.index({ isDeleted: 1 });
ProjectShareSchema.index({ member: 1 });

const ProjectShare: Model<IProjectShare> =
  mongoose.models.ProjectShare ||
  mongoose.model<IProjectShare>("ProjectShare", ProjectShareSchema);

export default ProjectShare;
