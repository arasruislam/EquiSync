import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import ProjectShare from "@/models/ProjectShare";
import Project from "@/models/Project";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { memberId, sharePercent } = await req.json();
    const project = await Project.findById(params.id);

    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const shareAmountUSD = (project.totalValueUSD * sharePercent) / 100;
    const shareAmountBDT = (project.totalValueBDT * sharePercent) / 100;

    const share = await ProjectShare.findOneAndUpdate(
      { project: params.id, member: memberId },
      {
        sharePercent,
        shareAmountUSD,
        shareAmountBDT,
        isDeleted: false,
        createdBy: session.user.id,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(share);
  } catch (error) {
    return NextResponse.json({ error: "Failed to save share" }, { status: 500 });
  }
}
