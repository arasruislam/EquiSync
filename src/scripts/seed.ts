import dbConnect from "../lib/mongoose";
import User from "../models/User";
import Investment from "../models/Investment";
import FiverrIncome from "../models/FiverrIncome";
import Project from "../models/Project";
import ProjectShare from "../models/ProjectShare";
import Payout from "../models/Payout";
import Expense from "../models/Expense";
import Transaction from "../models/Transaction";
import bcrypt from "bcryptjs";
import { Types } from "mongoose";

export async function seed() {
  console.log("🌱 Starting deep database seeding...");
  
  try {
    await dbConnect();

    // 1. Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Investment.deleteMany({}),
      FiverrIncome.deleteMany({}),
      Project.deleteMany({}),
      ProjectShare.deleteMany({}),
      Payout.deleteMany({}),
      Expense.deleteMany({}),
      Transaction.deleteMany({}),
    ]);
    console.log("🧹 Cleared all existing collections");

    const defaultPasswordHash = await bcrypt.hash("12345678", 12);

    // 2. Create Users
    const usersData = [
      { name: "QuoteXStudio", email: "superadmin@gmail.com", role: "SUPER_ADMIN", isActive: true, image: "/logo.png" },
      { name: "Rahul Roy Nipon", email: "rahulroynipon@gmail.com", role: "CO_FOUNDER", isActive: true, image: "/rahul.jpg" },
      { name: "Ashraful Islam", email: "ashrafulislam@gmail.com", role: "CO_FOUNDER", isActive: true, image: "/ashraful.jpg" },
      { name: "Saifur Rahman", email: "saifurrahman@gmail.com", role: "CO_FOUNDER", isActive: true, image: "/saifur.jpg" },
      { name: "Tanvir Ahmed", email: "tanvir@quotexstudio.com", role: "PROJECT_MANAGER", isActive: true },
      { name: "Zubair Hasan", email: "zubair@quotexstudio.com", role: "LEADER", isActive: true },
      { name: "Ariful Shuvo", email: "shuvo@quotexstudio.com", role: "EMPLOYEE", isActive: true },
      { name: "Mehedi Hasan", email: "mehedi@quotexstudio.com", role: "EMPLOYEE", isActive: true },
    ];

    const users = await User.create(usersData.map(u => ({ ...u, passwordHash: defaultPasswordHash })));
    const [superAdmin, rahul, ashraful, saifur, tanvir, zubair, shuvo, mehedi] = users;
    console.log(`✅ Created ${users.length} users`);

    // 3. Create Investments (CREDIT) - Super Admin entry with Co-Owner Contributions
    const investments = await Investment.create([
      { 
        contributions: [
          { coOwner: rahul._id, amountUSD: 2000, amountBDT: 240000, status: "CLEARED" },
          { coOwner: ashraful._id, amountUSD: 2000, amountBDT: 240000, status: "CLEARED" },
          { coOwner: saifur._id, amountUSD: 1000, amountBDT: 120000, status: "PENDING" },
        ],
        amountUSD: 5000, 
        amountBDT: 600000, 
        exchangeRate: 120, 
        note: "Initial company setup fund", 
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 
        createdBy: superAdmin._id // Only Super Admin
      },
      { 
        contributions: [
          { coOwner: rahul._id, amountUSD: 1000, amountBDT: 120000, status: "CLEARED" },
          { coOwner: ashraful._id, amountUSD: 1000, amountBDT: 120000, status: "PENDING" },
          { coOwner: saifur._id, amountUSD: 1000, amountBDT: 120000, status: "PENDING" },
        ],
        amountUSD: 3000, 
        amountBDT: 360000, 
        exchangeRate: 120, 
        note: "Marketing capital", 
        date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), 
        createdBy: superAdmin._id 
      },
    ]);

    for (const inv of investments) {
      const tx = await Transaction.create({
        type: "INVESTMENT",
        direction: "CREDIT",
        amountUSD: inv.amountUSD,
        amountBDT: inv.amountBDT,
        exchangeRate: 120,
        sourceModel: "Investment",
        sourceId: inv._id,
        description: `Company Investment Entry: ${inv.note}`,
        createdBy: inv.createdBy,
        date: inv.date
      });
      inv.transactionRef = tx._id as any;
      await inv.save();
    }
    console.log("✅ Created Investments & Ledger Entries");

    // 4. Create Projects
    const projects = await Project.create([
      { 
        title: "SaaS CRM Platform", 
        clientName: "BlueHorizon Inc", 
        status: "ACTIVE", 
        totalValueUSD: 4500, 
        totalValueBDT: 540000, 
        exchangeRate: 120, 
        assignedTo: [tanvir._id, zubair._id, shuvo._id], 
        managedBy: tanvir._id,
        startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        createdBy: rahul._id
      },
      { 
        title: "Crypto Trading Dashboard", 
        clientName: "ChainX", 
        status: "ACTIVE", 
        totalValueUSD: 2800, 
        totalValueBDT: 336000, 
        exchangeRate: 120, 
        assignedTo: [zubair._id, mehedi._id], 
        managedBy: rahul._id,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        createdBy: ashraful._id
      }
    ]);
    const [crmProject, cryptoProject] = projects;
    console.log("✅ Created Projects");

    // 5. Create Project Shares
    await ProjectShare.create([
      { project: crmProject._id, member: tanvir._id, sharePercent: 10, shareAmountUSD: 450, shareAmountBDT: 54000, createdBy: superAdmin._id },
      { project: crmProject._id, member: zubair._id, sharePercent: 15, shareAmountUSD: 675, shareAmountBDT: 81000, createdBy: superAdmin._id },
      { project: crmProject._id, member: shuvo._id, sharePercent: 20, shareAmountUSD: 900, shareAmountBDT: 108000, createdBy: superAdmin._id },
    ]);
    console.log("✅ Created Project Shares");

    // 6. Create Fiverr Income (CREDIT)
    const incomeRecords = await FiverrIncome.create([
      { type: "GREEN", amountUSD: 1200, amountBDT: 144000, exchangeRate: 120, orderId: "FO-555ABC", clientName: "BlueHorizon", projectRef: crmProject._id, date: new Date(), createdBy: superAdmin._id },
      { type: "WITHDRAWN", amountUSD: 850, amountBDT: 102000, exchangeRate: 120, orderId: "FO-111XYZ", clientName: "Generic Client", date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), createdBy: superAdmin._id },
    ]);

    for (const inc of incomeRecords) {
      const tx = await Transaction.create({
        type: "FIVERR_INCOME",
        direction: "CREDIT",
        amountUSD: inc.amountUSD,
        amountBDT: inc.amountBDT,
        exchangeRate: 120,
        sourceModel: "FiverrIncome",
        sourceId: inc._id,
        description: `Fiverr ${inc.type} Income: ${inc.orderId}`,
        createdBy: rahul._id,
        date: inc.date
      });
      inc.transactionRef = tx._id as any;
      await inc.save();
    }
    console.log("✅ Created Fiverr Income Records");

    // 7. Create Payouts (DEBIT)
    const payout = await Payout.create({
      recipient: shuvo._id,
      amountUSD: 500,
      amountBDT: 60000,
      exchangeRate: 120,
      type: "SALARY",
      date: new Date(),
      note: "February Salary",
      createdBy: superAdmin._id
    });
    const payoutTx = await Transaction.create({
      type: "PAYOUT",
      direction: "DEBIT",
      amountUSD: 500,
      amountBDT: 60000,
      exchangeRate: 120,
      sourceModel: "Payout",
      sourceId: payout._id,
      description: "Member Payout: Feb Salary to Ariful Shuvo",
      createdBy: superAdmin._id,
      date: payout.date
    });
    payout.transactionRef = payoutTx._id as any;
    await payout.save();
    console.log("✅ Created Payout Record");

    // 8. Create Expenses (DEBIT) - Super Admin entry with Co-Owner Contributions
    const expense = await Expense.create({
      category: "SOFTWARE",
      contributions: [
        { coOwner: rahul._id, amountUSD: 50, amountBDT: 6000, status: "CLEARED" },
        { coOwner: ashraful._id, amountUSD: 50, amountBDT: 6000, status: "PENDING" },
        { coOwner: saifur._id, amountUSD: 50, amountBDT: 6000, status: "PENDING" },
      ],
      amountUSD: 150,
      amountBDT: 18000,
      exchangeRate: 120,
      description: "Adobe Creative Cloud Annual Subscription",
      vendor: "Adobe",
      date: new Date(),
      createdBy: superAdmin._id
    });
    const expenseTx = await Transaction.create({
      type: "EXPENSE",
      direction: "DEBIT",
      amountUSD: 150,
      amountBDT: 18000,
      exchangeRate: 120,
      sourceModel: "Expense",
      sourceId: expense._id,
      description: "Business Expense: Adobe Software License",
      createdBy: superAdmin._id,
      date: expense.date
    });
    expense.transactionRef = expenseTx._id as any;
    await expense.save();
    console.log("✅ Created Expense Record");

    console.log("✨ Deep seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Deep seeding failed:", error);
    process.exit(1);
  }
}
