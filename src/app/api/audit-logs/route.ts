import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import AuditLog from "@/models/AuditLog";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  
  // SUPER_ADMIN, CO_FOUNDER, and LEADER can view audit logs
  if (!session || !["SUPER_ADMIN", "CO_FOUNDER", "LEADER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const actor = searchParams.get("actor");

    const query: any = {};
    if (action) query.action = action;
    if (actor) query.actor = actor;

    const logs = await AuditLog.find(query)
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);

    return NextResponse.json(logs);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
