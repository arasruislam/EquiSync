import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Transaction from "@/models/Transaction";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const direction = searchParams.get("direction");

    const query: any = { isDeleted: false };
    if (type) query.type = type;
    if (direction) query.direction = direction;

    const transactions = await Transaction.find(query)
      .populate("createdBy", "name")
      .sort({ date: -1, createdAt: -1 })
      .limit(100);

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}
