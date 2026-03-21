import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { logActivity } from "@/lib/audit";

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const body = await req.json();
    const { name, image } = body;

    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const previousData = { name: user.name, image: user.image };
    
    if (name) user.name = name;
    if (image) user.image = image;

    await user.save();

    await logActivity({
      actor: session.user.id,
      action: "UPDATE_PROFILE",
      targetModel: "User",
      targetId: user._id.toString(),
      oldValue: previousData,
      newValue: { name: user.name, image: user.image },
    });

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        image: user.image,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
