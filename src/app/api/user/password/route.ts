import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/audit";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const body = await req.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const user = await User.findById(session.user.id).select("+passwordHash");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    await logActivity({
      actor: session.user.id,
      action: "UPDATE_PASSWORD",
      targetModel: "User",
      targetId: user._id.toString(),
      oldValue: { action: "CREDENTIAL_MODIFICATION" },
      newValue: { status: "COMPLETED" },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
