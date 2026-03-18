import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IAuditLog extends Document {
  actor: Types.ObjectId;             // ref: User who performed the action
  action: string;                    // e.g. 'CREATE_INVESTMENT', 'DELETE_USER', 'LOGIN'
  targetModel?: string;              // e.g. 'Investment', 'User'
  targetId?: Types.ObjectId;         // ID of the affected record
  oldValue?: Record<string, unknown>; // snapshot before change
  newValue?: Record<string, unknown>; // snapshot after change
  ip?: string;
  userAgent?: string;
  status: "SUCCESS" | "FAILURE";
  errorMessage?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true, trim: true },
    targetModel: { type: String, trim: true },
    targetId: { type: Schema.Types.ObjectId },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILURE"],
      default: "SUCCESS",
    },
    errorMessage: { type: String },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // audit logs are immutable
  }
);

AuditLogSchema.index({ actor: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ targetModel: 1, targetId: 1 });
AuditLogSchema.index({ createdAt: -1 });
// TTL: auto-delete logs older than 2 years (optional — comment out if you want permanent logs)
// AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog ||
  mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
