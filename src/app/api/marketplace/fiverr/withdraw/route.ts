import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import FiverrWithdrawal from "@/models/FiverrWithdrawal";
import { createLedgerEntry } from "@/lib/ledger";
import { cache } from "@/lib/cache";
import { logActivity } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !["SUPER_ADMIN", "CO_FOUNDER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  try {
    const withdrawals = await FiverrWithdrawal.find({ isDeleted: false })
      .sort({ date: -1 });

    return NextResponse.json(withdrawals);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 });
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
    const { amountUSD, amountBDT, exchangeRate, method, reference, date, note } = body;

    if (!amountUSD || !amountBDT || !exchangeRate || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const withdrawal = await FiverrWithdrawal.create({
      amountUSD,
      amountBDT,
      exchangeRate,
      method,
      reference,
      date: date || new Date(),
      note,
      createdBy: session.user.id,
    });

    // Create central ledger entry (DEBIT - reducing the Fiverr specific pooled balance)
    // Note: In some accounting models, this is a transfer. 
    // Here we treat it as a movement out of the 'unwithdrawn' pool.
    const transaction = await createLedgerEntry({
      type: "WITHDRAWAL",
      direction: "DEBIT",
      amountUSD,
      amountBDT,
      exchangeRate,
      sourceModel: "FiverrWithdrawal",
      sourceId: withdrawal._id as any,
      description: `Fiverr Withdrawal via ${method}${reference ? ` [${reference}]` : ""}`,
      createdBy: session.user.id,
      date: date,
    });

    withdrawal.transactionRef = transaction._id as any;
    await withdrawal.save();

    await logActivity({
      actor: session.user.id,
      action: "CREATE_FIVERR_WITHDRAWAL",
      targetModel: "FiverrWithdrawal",
      targetId: withdrawal._id.toString(),
      newValue: withdrawal.toObject(),
    });

    cache.flushAll(); // Purge reports memory cache forcing fresh read
    return NextResponse.json(withdrawal, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
