import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Investment from "@/models/Investment";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { createLedgerEntry } from "@/lib/ledger";
import { emitSocketEvent } from "@/lib/socket-emit";
import { cache } from "@/lib/cache";
import { logActivity } from "@/lib/audit";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !["SUPER_ADMIN", "CO_FOUNDER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  try {
    const investments = await Investment.find({ isDeleted: false })
      .populate("contributions.coOwner", "name email image")
      .sort({ date: -1 });

    return NextResponse.json(investments);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch investments" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Only Super Admin can add investments." }, { status: 403 });
  }

  await dbConnect();

  try {
    const body = await req.json();
    const { amountBDT, exchangeRate, note, date } = body;

    // Reject payload if missing essential fields
    if (!amountBDT || !exchangeRate) {
      return NextResponse.json({ error: "Missing required fields: amountBDT, exchangeRate" }, { status: 400 });
    }

    // Base is BDT. Calculate USD mathematically.
    const amountUSD = Number((amountBDT / exchangeRate).toFixed(2));

    // Mathematical Division: 3-way equal split for Founders
    const splitUSD = Number((amountUSD / 3).toFixed(2));
    const splitBDT = Number((amountBDT / 3).toFixed(2));

    // Fetch exactly the 3 Co-Founders (Rahul, Ashraful, Saifur) 
    const coFounders = await User.find({ role: "CO_FOUNDER" }).limit(3);
    
    if (coFounders.length !== 3) {
      return NextResponse.json({ error: `System requires exactly 3 CO_FOUNDER accounts to perform equal division. Found ${coFounders.length}` }, { status: 400 });
    }

    // Automatically generate the Pending contributions list
    const automatedContributions = coFounders.map(founder => ({
      coOwner: founder._id,
      amountUSD: splitUSD,
      amountBDT: splitBDT,
      status: "PENDING"
    }));

    // Create Investment
    const investment = await Investment.create({
      contributions: automatedContributions,
      amountUSD,
      amountBDT,
      exchangeRate,
      note,
      date: date || new Date(),
      createdBy: session.user.id,
    });

    // Create central ledger entry (CREDIT - increases company balance)
    const transaction = await createLedgerEntry({
      type: "INVESTMENT",
      direction: "CREDIT",
      amountUSD,
      amountBDT,
      exchangeRate,
      sourceModel: "Investment",
      sourceId: investment._id as any,
      description: `Company Investment Entry${note ? `: ${note}` : ""}`,
      createdBy: session.user.id,
      date: date,
    });

    // Link transaction back to investment
    investment.transactionRef = transaction._id as any;
    await investment.save();

    // Dispatch automated Notification to all 3 Co-Founders
    const notifications = coFounders.map(founder => ({
      recipient: founder._id,
      message: `A new investment of ${amountUSD} USD (split ${splitUSD} USD each) was created. Please check your Pending Dues.`,
      type: "FINANCE",
      url: "/dashboard/investments"
    }));
    await Notification.insertMany(notifications);

    await emitSocketEvent("invalidate-data");
    await emitSocketEvent("new-notification");

    await logActivity({
      actor: session.user.id,
      action: "CREATE_INVESTMENT",
      targetModel: "Investment",
      targetId: investment._id.toString(),
      newValue: investment.toObject(),
    });

    cache.flushAll(); // Purge reports memory cache forcing fresh read
    return NextResponse.json(investment, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
