import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Expense from "@/models/Expense";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { createLedgerEntry } from "@/lib/ledger";
import { emitSocketEvent } from "@/lib/socket-emit";
import { cache } from "@/lib/cache";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  try {
    const expenses = await Expense.find({ isDeleted: false })
      .populate("project", "title")
      .sort({ date: -1, createdAt: -1 });

    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Only Super Admin can add expenses." }, { status: 403 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { category, amountBDT, exchangeRate, description, vendor, project, date } = body;

    // Reject payload if missing essential fields (BDT is SSOT)
    if (!amountBDT || !exchangeRate) {
      return NextResponse.json({ error: "Missing required fields: amountBDT, exchangeRate" }, { status: 400 });
    }

    // Fetch all Co-Founders to notify them functionally
    const coFounders = await User.find({ role: "CO_FOUNDER" });

    const expense = await Expense.create({
      category,
      amountBDT,
      exchangeRate,
      description,
      vendor,
      project,
      date: date || new Date(),
      createdBy: session.user.id,
    });

    // Create central ledger entry (DEBIT)
    const transaction = await createLedgerEntry({
      type: "EXPENSE",
      direction: "DEBIT",
      amountUSD: Number((amountBDT / exchangeRate).toFixed(2)),
      amountBDT,
      exchangeRate,
      sourceModel: "Expense",
      sourceId: expense._id as any,
      description: `Expense [${category}]: ${description}${vendor ? ` via ${vendor}` : ""}`,
      createdBy: session.user.id,
      date: date,
    });

    expense.transactionRef = transaction._id as any;
    await expense.save();

    // Dispatch automated Notification to all 3 Co-Founders
    const notifications = coFounders.map((founder: any) => ({
      recipient: founder._id,
      message: `A new company expense of ${amountBDT} BDT (${category}) was logged.`,
      type: "FINANCE",
      url: "/dashboard/expenses"
    }));
    await Notification.insertMany(notifications);

    await emitSocketEvent("invalidate-data");
    await emitSocketEvent("new-notification");

    await logActivity({
      actor: session.user.id,
      action: "CREATE_EXPENSE",
      targetModel: "Expense",
      targetId: expense._id.toString(),
      newValue: expense.toObject(),
    });

    cache.flushAll(); // Purge reports memory cache to force fresh Dashboard calculations

    // Purge Next.js Data Cache for all relevant routes
    revalidatePath("/dashboard");
    revalidatePath("/api/reports");
    revalidatePath("/dashboard/expenses");

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
