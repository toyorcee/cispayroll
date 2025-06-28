import mongoose from "mongoose";
import dotenv from "dotenv";
import PayrollModel from "../models/Payroll.js";
import BonusModel from "../models/Bonus.js";
import AllowanceModel from "../models/Allowance.js";
import LeaveModel from "../models/Leave.js";

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/cispayroll";

async function flushAllPayrolls() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");

    // Payrolls
    const countPayrolls = await PayrollModel.countDocuments();
    console.log(`📊 Found ${countPayrolls} payrolls in database`);
    if (countPayrolls > 0) {
      const result = await PayrollModel.deleteMany({});
      console.log(`🗑️  Deleted ${result.deletedCount} payrolls from database`);
    }

    // Bonuses
    const countBonuses = await BonusModel.countDocuments();
    console.log(`📊 Found ${countBonuses} bonuses in database`);
    if (countBonuses > 0) {
      const result = await BonusModel.deleteMany({});
      console.log(`🗑️  Deleted ${result.deletedCount} bonuses from database`);
    }

    // Allowances
    const countAllowances = await AllowanceModel.countDocuments();
    console.log(`📊 Found ${countAllowances} allowances in database`);
    if (countAllowances > 0) {
      const result = await AllowanceModel.deleteMany({});
      console.log(
        `🗑️  Deleted ${result.deletedCount} allowances from database`
      );
    }

    // Leaves
    const countLeaves = await LeaveModel.countDocuments();
    console.log(`📊 Found ${countLeaves} leaves in database`);
    if (countLeaves > 0) {
      const result = await LeaveModel.deleteMany({});
      console.log(`🗑️  Deleted ${result.deletedCount} leaves from database`);
    }

    // Verification
    const countAfterPayrolls = await PayrollModel.countDocuments();
    const countAfterBonuses = await BonusModel.countDocuments();
    const countAfterAllowances = await AllowanceModel.countDocuments();
    const countAfterLeaves = await LeaveModel.countDocuments();
    console.log(`📊 Remaining payrolls: ${countAfterPayrolls}`);
    console.log(`📊 Remaining bonuses: ${countAfterBonuses}`);
    console.log(`📊 Remaining allowances: ${countAfterAllowances}`);
    console.log(`📊 Remaining leaves: ${countAfterLeaves}`);

    if (
      countAfterPayrolls === 0 &&
      countAfterBonuses === 0 &&
      countAfterAllowances === 0 &&
      countAfterLeaves === 0
    ) {
      console.log("✅ Verification successful - all records removed");
    } else {
      console.log("⚠️  Warning: Some records may still exist");
    }
  } catch (error) {
    console.error("❌ Error flushing records:", error);
    process.exit(1);
  } finally {
    console.log("🔌 Disconnecting from MongoDB...");
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
console.log("🚀 Starting payroll, bonus, allowance, and leave flush script...");
flushAllPayrolls();
