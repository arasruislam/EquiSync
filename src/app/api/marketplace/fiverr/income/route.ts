import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import FiverrIncome from "@/models/FiverrIncome";
import { createLedgerEntry } from "@/lib/ledger";
import { cache } from "@/lib/cache";
import { logActivity } from "@/lib/audit";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();

  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // GREEN or WITHDRAWN
    
    const query: any = { isDeleted: false };
    if (type) query.type = type;

    const income = await FiverrIncome.find(query)
      .populate("projectRef", "title")
      .sort({ date: -1 });

    return NextResponse.json(income);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch income" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only SUPER_ADMIN, PM, or LEADER can record income
  if (!["SUPER_ADMIN", "PROJECT_MANAGER", "LEADER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { type, amountUSD, amountBDT, exchangeRate, orderId, clientName, projectRef, date, note } = body;

    if (!type || !amountUSD || !amountBDT || !exchangeRate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const income = await FiverrIncome.create({
      type,
      amountUSD,
      amountBDT,
      exchangeRate,
      orderId,
      clientName,
      projectRef,
      date: date || new Date(),
      note,
      createdBy: session.user.id,
    });

    // Create central ledger entry (CREDIT)
    const transaction = await createLedgerEntry({
      type: "FIVERR_INCOME",
      direction: "CREDIT",
      amountUSD,
      amountBDT,
      exchangeRate,
      sourceModel: "FiverrIncome",
      sourceId: income._id as any,
      description: `Fiverr ${type} Income: ${orderId || "Direct"}${clientName ? ` (${clientName})` : ""}`,
      createdBy: session.user.id,
      date: date,
    });

    income.transactionRef = transaction._id as any;
    await income.save();

    await logActivity({
      actor: session.user.id,
      action: "CREATE_FIVERR_INCOME",
      targetModel: "FiverrIncome",
      targetId: income._id.toString(),
      newValue: income.toObject(),
    });

    cache.flushAll(); // Purge reports memory cache forcing fresh read
    return NextResponse.json(income, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
