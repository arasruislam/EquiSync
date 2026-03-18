import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Investment from "@/models/Investment";
import FiverrIncome from "@/models/FiverrIncome";
import Expense from "@/models/Expense";
import { startOfDay, subDays, startOfMonth, subMonths, format, endOfDay } from "date-fns";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "CO_FOUNDER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") || "month"; // today, week, month, 3month, year

  await dbConnect();

  try {
    const now = new Date();
    let startDate: Date;
    let groupingFormat: string;

    switch (range) {
      case "today":
        startDate = startOfDay(now);
        groupingFormat = "%Y-%m-%dT%H:00:00.000Z"; // Group by hour
        break;
      case "week":
        startDate = startOfDay(subDays(now, 7));
        groupingFormat = "%Y-%m-%d";
        break;
      case "3month":
        startDate = startOfMonth(subMonths(now, 3));
        groupingFormat = "%Y-%m-%d"; // Still group by day but maybe client-side adjust
        break;
      case "year":
        startDate = startOfMonth(subMonths(now, 12));
        groupingFormat = "%Y-%m";
        break;
      case "month":
      default:
        startDate = startOfMonth(now);
        groupingFormat = "%Y-%m-%d";
        break;
    }

    const commonMatch = {
      isDeleted: false,
      date: { $gte: startDate, $lte: now }
    };

    // Aggregate Income (Fiverr Green)
    const incomeData = await FiverrIncome.aggregate([
      { $match: { ...commonMatch, type: "GREEN" } },
      {
        $group: {
          _id: { $dateToString: { format: groupingFormat, date: "$date" } },
          amount: { $sum: "$amountUSD" }
        }
      }
    ]);

    // Aggregate Expenses
    const expenseData = await Expense.aggregate([
      { $match: commonMatch },
      {
        $group: {
          _id: { $dateToString: { format: groupingFormat, date: "$date" } },
          amount: { $sum: "$amountUSD" }
        }
      }
    ]);

    // Join User collection to get names/images and aggregate inflow by co-founder
    const finalInflowData = await Investment.aggregate([
      { $match: commonMatch },
      { $unwind: "$contributions" },
      { $match: { "contributions.status": "CLEARED" } },
      {
        $group: {
          _id: { 
            date: { $dateToString: { format: groupingFormat, date: "$date" } },
            actor: "$contributions.coOwner"
          },
          amount: { $sum: "$contributions.paidAmountUSD" }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id.actor",
          foreignField: "_id",
          as: "actorInfo"
        }
      },
      { $unwind: { path: "$actorInfo", preserveNullAndEmptyArrays: true } }
    ]);

    // Merge data into a unified time-series format
    const mergedMap: Record<string, any> = {};

    incomeData.forEach(d => {
      if (!mergedMap[d._id]) mergedMap[d._id] = { date: d._id, income: 0, expense: 0, inflows: {} };
      mergedMap[d._id].income += d.amount;
    });

    expenseData.forEach(d => {
      if (!mergedMap[d._id]) mergedMap[d._id] = { date: d._id, income: 0, expense: 0, inflows: {} };
      mergedMap[d._id].expense += d.amount;
    });

    finalInflowData.forEach(d => {
      const dateKey = d._id.date;
      if (!mergedMap[dateKey]) mergedMap[dateKey] = { date: dateKey, income: 0, expense: 0, inflows: {} };
      
      mergedMap[dateKey].inflows[d._id.actor] = {
        amount: d.amount,
        name: d.actorInfo?.name || "Unknown",
        image: d.actorInfo?.image || null
      };
    });

    // Sort by date
    const sortedData = Object.values(mergedMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(sortedData);
  } catch (error) {
    console.error("Analytics Error:", error);
    return NextResponse.json({ error: "Aggregation failed" }, { status: 500 });
  }
}
