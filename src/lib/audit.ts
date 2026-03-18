import AuditLog from "@/models/AuditLog";
import dbConnect from "./mongoose";

interface LogPayload {
  actor: string;
  action: string;
  targetModel?: string;
  targetId?: string;
  oldValue?: any;
  newValue?: any;
  status?: "SUCCESS" | "FAILURE";
  errorMessage?: string;
}

/**
 * Generic Fire-and-Forget Audit Logger
 * Intercepts mutating JSON payloads directly inside API routes.
 */
export async function logActivity(payload: LogPayload) {
  try {
    await dbConnect();
    await AuditLog.create({
      ...payload,
      createdAt: new Date(),
    });
  } catch (error) {
    // We intentionally catch this blindly. Audit failures should not crash Core transactions.
    console.error("Critical Audit Logging Failure: ", error);
  }
}
