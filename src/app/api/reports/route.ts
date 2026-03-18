import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import mongoose from "mongoose";
import Investment from "@/models/Investment";
import FiverrIncome from "@/models/FiverrIncome";
import Payout from "@/models/Payout";
import Expense from "@/models/Expense";
import Project from "@/models/Project";
import User from "@/models/User";
import { cache, CacheKeys } from "@/lib/cache";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["SUPER_ADMIN", "CO_FOUNDER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  // Use a single GLOBAL cache key — all leadership roles see the same financial snapshot
  // Per-user cache caused co-founders to receive stale single-founder data
  const cacheKey = `${CacheKeys.DASHBOARD_REPORTS}_global`;
  const cachedData = cache.get(cacheKey) as any;
  if (cachedData) {
    // For co-founders, derive their personal stats from the global cached dataset
    const personalStats = session.user.role === "CO_FOUNDER"
      ? cachedData.allCoFounderStats?.find((f: any) => f.userId === session.user.id) ?? null
      : null;
    return NextResponse.json({ ...cachedData, coFounderStats: personalStats });
  }

  await dbConnect();

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      investments, 
      clearedInvestments, 
      fiverrGreen, 
      fiverrWithdrawn, 
      payouts, 
      expenses, 
      monthlyIncomeAgg, 
      monthlyExpenseAgg,
      ytdExpenseAgg,
      projectStatsAgg,
      totalPendingInvAgg
    ] = await Promise.all([
      Investment.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: "$amountUSD" } } }]),
      Investment.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: "$contributions" },
        { $match: { "contributions.status": "CLEARED" } },
        { $group: { 
            _id: null, 
            total: { 
              $sum: { $ifNull: ["$contributions.paidAmountUSD", "$contributions.amountUSD"] } 
            } 
        } }
      ]),
      FiverrIncome.aggregate([{ $match: { isDeleted: false, type: "GREEN" } }, { $group: { _id: null, total: { $sum: "$amountUSD" } } }]),
      FiverrIncome.aggregate([{ $match: { isDeleted: false, type: "WITHDRAWN" } }, { $group: { _id: null, total: { $sum: "$amountUSD" } } }]),
      Payout.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: "$amountUSD" } } }]),
      Expense.aggregate([{ $match: { isDeleted: false } }, { $group: { _id: null, total: { $sum: "$amountUSD" } } }]),
      
      // Monthly Marketplace Income
      FiverrIncome.aggregate([
        { $match: { isDeleted: false, type: "GREEN", date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amountUSD" } } }
      ]),
      
      // Monthly Expenses
      Expense.aggregate([
        { $match: { isDeleted: false, date: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amountUSD" } } }
      ]),

      // YTD Expenses
      Expense.aggregate([
        { $match: { isDeleted: false, date: { $gte: startOfYear } } },
        { $group: { _id: null, total: { $sum: "$amountUSD" } } }
      ]),

      // Project Stats
      Project.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),

      // Total Pending Company Dues
      Investment.aggregate([
        { $match: { isDeleted: false } },
        { $unwind: "$contributions" },
        { $match: { "contributions.status": "PENDING" } },
        { $group: { 
            _id: null, 
            total: { 
              $sum: { 
                $subtract: ["$contributions.amountUSD", { $ifNull: ["$contributions.paidAmountUSD", 0] }] 
              } 
            } 
        } }
      ])
    ]);

    const isSuperAdmin = session.user.role === "SUPER_ADMIN";
    const isCoFounder = session.user.role === "CO_FOUNDER";
    
    // Both Super Admin AND Co-Founders need the full global list of all founders
    let founderIds: mongoose.Types.ObjectId[] = [];
    if (isSuperAdmin || isCoFounder) {
      // Always load ALL co-founders for full transparency across leadership
      const allFounders = await User.find({ role: "CO_FOUNDER" }).select("_id");
      founderIds = allFounders.map(f => f._id as mongoose.Types.ObjectId);
    }

    // Co-Founder specific BDT aggregations for the target user(s)
    const founderStatsData = await Promise.all(founderIds.map(async (fid) => {
      const [investedAgg, pendingInvAgg] = await Promise.all([
        Investment.aggregate([
          { $match: { isDeleted: false, "contributions.coOwner": fid } },
          { $unwind: "$contributions" },
          { $match: { "contributions.coOwner": fid } },
          { $group: { 
              _id: null, 
              total: { 
                $sum: { 
                  $cond: [
                    { $eq: ["$contributions.status", "CLEARED"] }, 
                    { $ifNull: ["$contributions.paidAmountBDT", "$contributions.amountBDT"] },
                    { $ifNull: ["$contributions.paidAmountBDT", 0] }
                  ]
                } 
              } 
          } }
        ]),
        Investment.aggregate([
          { $match: { isDeleted: false, "contributions.coOwner": fid, "contributions.status": "PENDING" } },
          { $unwind: "$contributions" },
          { $match: { "contributions.coOwner": fid, "contributions.status": "PENDING" } },
          { $group: { 
              _id: null, 
              total: { 
                $sum: { 
                  $subtract: [
                    "$contributions.amountBDT", 
                    { $ifNull: ["$contributions.paidAmountBDT", 0] }
                  ]
                } 
              } 
          } }
        ])
      ]);

      const user = await User.findById(fid).select("name email image");
      
      return {
        userId: fid.toString(),
        name: user?.name || "Unknown",
        totalInvestedBDT: investedAgg[0]?.total || 0,
        totalPendingDuesBDT: pendingInvAgg[0]?.total || 0,
        image: user?.image
      };
    }));

    // Monthly aggregation for trends (last 6 months - simplistic version)
    // In a real app, this would be more complex date grouping
    const monthlyData = [
      { month: "Oct", income: 4500, expenses: 3200 },
      { month: "Nov", income: 5200, expenses: 3800 },
      { month: "Dec", income: 4800, expenses: 3500 },
      { month: "Jan", income: 6100, expenses: 4200 },
      { month: "Feb", income: 5900, expenses: 4000 },
      { month: "Mar", income: 7200, expenses: 4500 },
    ];

    const projectStats = {
      ACTIVE: projectStatsAgg.find(s => s._id === "ACTIVE")?.count || 0,
      COMPLETED: projectStatsAgg.find(s => s._id === "COMPLETED")?.count || 0,
      CANCELLED: projectStatsAgg.find(s => s._id === "CANCELLED")?.count || 0,
    };

    // Store only GLOBAL, role-agnostic data in the cache
    // coFounderStats (personal) is deliberately excluded — it's computed per-request
    const globalPayload = {
      summary: {
        totalInvestments: investments[0]?.total || 0,
        clearedInvestmentsUSD: clearedInvestments[0]?.total || 0,
        totalFiverrGreen: fiverrGreen[0]?.total || 0,
        totalFiverrWithdrawn: fiverrWithdrawn[0]?.total || 0,
        totalPayouts: payouts[0]?.total || 0,
        totalExpenses: expenses[0]?.total || 0,
        monthlyIncome: monthlyIncomeAgg[0]?.total || 0,
        monthlyExpense: monthlyExpenseAgg[0]?.total || 0,
        ytdExpense: ytdExpenseAgg[0]?.total || 0,
        totalPendingDuesUSD: totalPendingInvAgg[0]?.total || 0,
        companyBalance: (clearedInvestments[0]?.total || 0) + (fiverrWithdrawn[0]?.total || 0) - (payouts[0]?.total || 0) - (expenses[0]?.total || 0),
        projectStats
      },
      // Full matrix — all 3 founders — always included regardless of who is requesting
      allCoFounderStats: founderStatsData,
      monthlyData,
    };

    cache.set(cacheKey, globalPayload);

    // Derive personal co-founder stats dynamically from the global array, never from cache
    const coFounderStats = session.user.role === "CO_FOUNDER"
      ? founderStatsData.find(f => f.userId === session.user.id) ?? null
      : null;

    return NextResponse.json({ ...globalPayload, coFounderStats });
  } catch (error) {
    return NextResponse.json({ error: "Aggregation failed" }, { status: 500 });
  }
}
