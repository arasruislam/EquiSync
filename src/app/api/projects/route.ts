import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Project from "@/models/Project";
import User from "@/models/User";
import { logActivity } from "@/lib/audit";
import { cache } from "@/lib/cache";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const projects = await Project.find({ isDeleted: false })
      .populate("managedBy", "name email image")
      .populate("assignedTo", "name role image")
      .sort({ createdAt: -1 });

    return NextResponse.json(projects);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only SUPER_ADMIN, PROJECT_MANAGER, or LEADER can create projects
  if (!["SUPER_ADMIN", "PROJECT_MANAGER", "LEADER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { title, description, clientName, totalValueUSD, totalValueBDT, exchangeRate, assignedTo, managedBy, startDate, endDate, tags } = body;

    if (!title || !totalValueUSD || !totalValueBDT || !exchangeRate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const project = await Project.create({
      title,
      description,
      clientName,
      totalValueUSD,
      totalValueBDT,
      exchangeRate,
      assignedTo: assignedTo || [],
      managedBy: managedBy || session.user.id,
      startDate: startDate || new Date(),
      endDate,
      tags: tags || [],
      createdBy: session.user.id,
    });

    await logActivity({
      actor: session.user.id,
      action: "CREATE_PROJECT",
      targetModel: "Project",
      targetId: project._id.toString(),
      newValue: project.toObject(),
    });

    cache.flushAll(); // Purge reports memory cache forcing fresh read

    return NextResponse.json(project, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
