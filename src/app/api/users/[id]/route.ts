import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  // Only SUPER_ADMIN can update other users
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { name, email, role, isActive } = await req.json();
    
    // Prevent deactivating own account
    if (params.id === session.user.id && isActive === false) {
      return NextResponse.json({ error: "Cannot deactivate your own account" }, { status: 400 });
    }

    const user = await User.findById(params.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (typeof isActive !== "undefined") user.isActive = isActive;

    await user.save();

    return NextResponse.json({ message: "User updated successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
