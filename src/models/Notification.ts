import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface INotification extends Document {
  recipient: Types.ObjectId;
  message: string;
  type: "FINANCE" | "PROJECT" | "SYSTEM";
  isRead: boolean;
  url?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["FINANCE", "PROJECT", "SYSTEM"], default: "SYSTEM" },
    isRead: { type: Boolean, default: false },
    url: { type: String },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, isRead: 1 });
NotificationSchema.index({ createdAt: -1 });

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>("Notification", NotificationSchema);

export default Notification;
