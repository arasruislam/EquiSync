import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Payout from "@/models/Payout";
import { createLedgerEntry } from "@/lib/ledger";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const payouts = await Payout.find({ isDeleted: false })
      .populate("recipient", "name email role image")
      .populate("project", "title")
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json(payouts);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { recipientId, amountBDT, amountUSD, exchangeRate, type, project, note, date } = body;

    const payout = await Payout.create({
      recipient: recipientId,
      amountBDT,
      amountUSD,
      exchangeRate,
      type,
      project,
      note,
      date: date || new Date(),
      createdBy: session.user.id,
    });

    // Create central ledger entry (DEBIT)
    const transaction = await createLedgerEntry({
      type: "PAYOUT",
      direction: "DEBIT",
      amountUSD,
      amountBDT,
      exchangeRate,
      sourceModel: "Payout",
      sourceId: payout._id as any,
      description: `Payout to ${recipientId}: ${type}${note ? ` (${note})` : ""}`,
      createdBy: session.user.id,
      date: date,
    });

    payout.transactionRef = transaction._id as any;
    await payout.save();

    return NextResponse.json(payout, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
