import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import mongoose from "mongoose";
import Investment from "@/models/Investment";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { emitSocketEvent } from "@/lib/socket-emit";
import { cache } from "@/lib/cache";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  try {
    const { coOwnerId, status } = await req.json();

    const investment = await Investment.findOne({ _id: params.id, "contributions.coOwner": coOwnerId });
    if (!investment) return NextResponse.json({ error: "Investment or contribution not found" }, { status: 404 });

    const oldValue = investment.toObject();

    const contribution = investment.contributions.find(c => c.coOwner.toString() === coOwnerId);
    if (!contribution) return NextResponse.json({ error: "Contribution not found" }, { status: 404 });

    contribution.status = status;
    if (status === "CLEARED") {
      contribution.paidAmountBDT = contribution.amountBDT;
    } else {
      contribution.paidAmountBDT = 0;
    }
    await investment.save();



    // Notify the specific Co-Founder that their status changed
    const amountUSD_Display = Number((investment.amountBDT / investment.exchangeRate).toFixed(2));
    await Notification.create({
      recipient: coOwnerId,
      message: `Your investment share for ${amountUSD_Display} USD has been marked as ${status} by the Super Admin.`,
      type: "FINANCE",
      url: "/dashboard/investments"
    });

    await emitSocketEvent("invalidate-data");
    await emitSocketEvent("new-notification");

    await logActivity({
      actor: session.user.id,
      action: "UPDATE_INVESTMENT_STATUS",
      targetModel: "Investment",
      targetId: investment._id.toString(),
      oldValue,
      newValue: investment.toObject(),
    });

    cache.flushAll();

    // Purge Next.js Data Cache for all relevant routes
    revalidatePath("/dashboard/investments");
    revalidatePath("/api/reports");
    revalidatePath("/dashboard");

    return NextResponse.json(investment);
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Only Super Admin can edit investments." }, { status: 403 });
  }

  await dbConnect();

  try {
    const { amountBDT, exchangeRate, note, date } = await req.json();

    // Re-calculate the mathematical equal split (BDT SSOT)
    const splitBDT = Number((amountBDT / 3).toFixed(2));

    const investment = await Investment.findById(params.id);
    if (!investment) return NextResponse.json({ error: "Investment not found" }, { status: 404 });

    const oldValue = investment.toObject();

    // Complex mathematical recalculation retaining historical paid amounts (BDT SSOT)
    investment.contributions.forEach((c: any) => {
      const actualPaidBDT = (c.status === "CLEARED" && !c.paidAmountBDT) ? c.amountBDT : (c.paidAmountBDT || 0);

      c.amountBDT = splitBDT;
      c.paidAmountBDT = actualPaidBDT;
      
      if (splitBDT > actualPaidBDT) {
         c.status = "PENDING";
      } else {
         c.status = "CLEARED";
      }
    });
    
    investment.amountBDT = amountBDT;
    investment.exchangeRate = exchangeRate;
    investment.note = note;
    if (date) investment.date = date;

    await investment.save();

    // Alert all 3
    const notifications = investment.contributions.map((c: any) => ({
      recipient: c.coOwner,
      message: `An investment has been modified to ${amountBDT} BDT. Your new target share is ${splitBDT} BDT.`,
      type: "FINANCE",
      url: "/dashboard/investments"
    }));
    await Notification.insertMany(notifications);

    await emitSocketEvent("invalidate-data");
    await emitSocketEvent("new-notification");

    await logActivity({
      actor: session.user.id,
      action: "UPDATE_INVESTMENT",
      targetModel: "Investment",
      targetId: investment._id.toString(),
      oldValue,
      newValue: investment.toObject(),
    });

    cache.flushAll();
    return NextResponse.json(investment);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  await dbConnect();

  try {
    const investment = await Investment.findById(params.id);
    if (!investment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const hasCleared = investment.contributions.some(c => c.status === "CLEARED" || c.paidAmountBDT > 0);
    if (hasCleared) {
      return NextResponse.json({ error: "Cannot delete investment because funds have already been partially or fully cleared." }, { status: 400 });
    }

    const oldValue = investment.toObject();

    investment.isDeleted = true;
    investment.deletedAt = new Date();
    investment.deletedBy = new mongoose.Types.ObjectId(session.user.id);
    await investment.save();

    if (!investment) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const amountUSD_Display = Number((investment.amountBDT / investment.exchangeRate).toFixed(2));
    const notifications = investment.contributions.map((c: any) => ({
      recipient: c.coOwner,
      message: `An investment (${amountUSD_Display} USD) has been permanently deleted by the Super Admin.`,
      type: "SYSTEM",
      url: "/dashboard/investments"
    }));
    await Notification.insertMany(notifications);

    await emitSocketEvent("invalidate-data");
    await emitSocketEvent("new-notification");

    await logActivity({
      actor: session.user.id,
      action: "DELETE_INVESTMENT",
      targetModel: "Investment",
      targetId: investment._id.toString(),
      oldValue,
      newValue: investment.toObject(),
    });

    cache.flushAll();

    // Purge Next.js Data Cache for all relevant routes
    revalidatePath("/dashboard/investments");
    revalidatePath("/api/reports");
    revalidatePath("/dashboard");

    return NextResponse.json({ message: "Investment deleted safely" });
  } catch (error) {
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
