import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Notification from "@/models/Notification";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const id = params.id;

    if (id === "all") {
      await Notification.updateMany(
        { recipient: session.user.id, isRead: false },
        { $set: { isRead: true } }
      );
      return NextResponse.json({ message: "All marked read" });
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: id, recipient: session.user.id },
      { $set: { isRead: true } },
      { new: true }
    );

    if (!notif) return NextResponse.json({ error: "Notification not found" }, { status: 404 });

    return NextResponse.json(notif);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
  }
}
