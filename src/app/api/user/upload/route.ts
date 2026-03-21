import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import cloudinary from "@/lib/cloudinary";
import { logActivity } from "@/lib/audit";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size (2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (Max 2MB)" }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Cloudinary using upload_stream
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "profile_pics",
          transformation: [
            { width: 256, height: 256, crop: "fill", gravity: "face" },
            { radius: "max" }
          ]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    }) as any;

    const secureUrl = uploadResult.secure_url;

    // Update Database
    await dbConnect();
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const previousImage = user.image;
    user.image = secureUrl;
    await user.save();

    // Log Activity
    await logActivity({
      actor: session.user.id,
      action: "UPDATE_AVATAR",
      targetModel: "User",
      targetId: user._id.toString(),
      oldValue: { image: previousImage },
      newValue: { image: secureUrl },
    });

    return NextResponse.json({
      message: "Avatar updated successfully",
      url: secureUrl
    });

  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { error: "Upload failed: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
}
