import mongoose from "mongoose";
import dotenv from "dotenv";
import PayrollModel from "../models/Payroll.js";

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/cispayroll";

async function flushAllPayrolls() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");

    // Get count before deletion
    const countBefore = await PayrollModel.countDocuments();
    console.log(`📊 Found ${countBefore} payrolls in database`);

    if (countBefore === 0) {
      console.log("ℹ️  No payrolls found to delete");
      return;
    }

    // Delete all payrolls regardless of status
    const result = await PayrollModel.deleteMany({});

    console.log(`🗑️  Deleted ${result.deletedCount} payrolls from database`);
    console.log("✅ All payrolls flushed successfully");

    // Verify deletion
    const countAfter = await PayrollModel.countDocuments();
    console.log(`📊 Remaining payrolls: ${countAfter}`);

    if (countAfter === 0) {
      console.log("✅ Verification successful - all payrolls removed");
    } else {
      console.log("⚠️  Warning: Some payrolls may still exist");
    }
  } catch (error) {
    console.error("❌ Error flushing payrolls:", error);
    process.exit(1);
  } finally {
    console.log("🔌 Disconnecting from MongoDB...");
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
console.log("🚀 Starting payroll flush script...");
flushAllPayrolls();
