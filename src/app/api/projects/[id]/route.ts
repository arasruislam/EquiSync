import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Project from "@/models/Project";
import ProjectShare from "@/models/ProjectShare";
import { logActivity } from "@/lib/audit";
import { cache } from "@/lib/cache";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const project = await Project.findById(params.id)
      .populate("managedBy", "name email")
      .populate("assignedTo", "name role email");

    if (!project || project.isDeleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const shares = await ProjectShare.find({ project: params.id, isDeleted: false })
      .populate("member", "name role");

    return NextResponse.json({ project, shares });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!["CO_FOUNDER", "PROJECT_MANAGER", "LEADER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    
    const preEditProject = await Project.findById(params.id);
    if (!preEditProject) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    const oldValue = preEditProject.toObject();

    const project = await Project.findByIdAndUpdate(params.id, body, { new: true });
    
    if (project) {
      await logActivity({
        actor: session.user.id,
        action: "UPDATE_PROJECT",
        targetModel: "Project",
        targetId: project._id.toString(),
        oldValue,
        newValue: project.toObject(),
      });
    }

    cache.flushAll(); // Purge reports memory cache forcing fresh read

    return NextResponse.json(project);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
