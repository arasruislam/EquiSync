import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import mongoose from "mongoose";
import Expense from "@/models/Expense";
import User from "@/models/User";
import Notification from "@/models/Notification";
import { emitSocketEvent } from "@/lib/socket-emit";
import { cache } from "@/lib/cache";
import { logActivity } from "@/lib/audit";
import { revalidatePath } from "next/cache";


export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Only Super Admin can edit expenses." }, { status: 403 });
  }

  await dbConnect();

  try {
    const { category, amountBDT, exchangeRate, description, vendor, project, date } = await req.json();

    const expense = await Expense.findById(params.id);
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    
    const oldValue = expense.toObject();

    expense.category = category;
    expense.amountBDT = amountBDT;
    expense.exchangeRate = exchangeRate;
    expense.description = description;
    expense.vendor = vendor;
    if (project) expense.project = project;
    if (date) expense.date = date;

    await expense.save();

    const notifications = (await User.find({ role: "CO_FOUNDER" })).map((founder: any) => ({
      recipient: founder._id,
      message: `An expense (${category}) has been updated. Total is now ${amountBDT} BDT.`,
      type: "FINANCE",
      url: "/dashboard/expenses"
    }));
    await Notification.insertMany(notifications);

    await emitSocketEvent("invalidate-data");
    await emitSocketEvent("new-notification");

    await logActivity({
      actor: session.user.id,
      action: "UPDATE_EXPENSE",
      targetModel: "Expense",
      targetId: expense._id.toString(),
      oldValue,
      newValue: expense.toObject(),
    });

    cache.flushAll();

    // Purge Next.js Data Cache for all relevant routes
    revalidatePath("/dashboard");
    revalidatePath("/api/reports");
    revalidatePath("/dashboard/expenses");

    return NextResponse.json(expense);
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
    const expense = await Expense.findById(params.id);
    if (!expense) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const oldValue = expense.toObject();

    expense.isDeleted = true;
    expense.deletedAt = new Date();
    expense.deletedBy = new mongoose.Types.ObjectId(session.user.id);
    await expense.save();

    const notifications = (await User.find({ role: "CO_FOUNDER" })).map((founder: any) => ({
      recipient: founder._id,
      message: `An expense for ${expense.amountBDT} BDT (${expense.category}) has been permanently deleted.`,
      type: "SYSTEM",
      url: "/dashboard/expenses"
    }));
    await Notification.insertMany(notifications);

    await emitSocketEvent("invalidate-data");
    await emitSocketEvent("new-notification");

    await logActivity({
      actor: session.user.id,
      action: "DELETE_EXPENSE",
      targetModel: "Expense",
      targetId: expense._id.toString(),
      oldValue,
      newValue: expense.toObject(),
    });

    cache.flushAll();

    // Purge Next.js Data Cache for all relevant routes
    revalidatePath("/dashboard");
    revalidatePath("/api/reports");
    revalidatePath("/dashboard/expenses");

    return NextResponse.json({ message: "Expense deleted safely" });
  } catch (error) {
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
