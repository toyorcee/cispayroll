import mongoose from "mongoose";
import Payroll from "../models/Payroll.js";
import Bonus from "../models/Bonus.js";
import Allowance from "../models/Allowance.js";
import User from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function wipePayrolls() {
  try {
    console.log("🔄 Starting payroll wipe...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Delete all payrolls
    const payrollResult = await Payroll.deleteMany({});
    console.log(`🗑️ Deleted ${payrollResult.deletedCount} payroll records`);

    // Delete all bonuses
    const bonusDeleteResult = await Bonus.deleteMany({});
    console.log(`🗑️ Deleted ${bonusDeleteResult.deletedCount} bonus records`);

    // Delete all allowances
    const allowanceDeleteResult = await Allowance.deleteMany({});
    console.log(
      `🗑️ Deleted ${allowanceDeleteResult.deletedCount} allowance records`
    );

    // Remove all personalAllowances and personalBonuses from all users
    const userResult = await User.updateMany(
      {},
      {
        $set: {
          personalAllowances: [],
          personalBonuses: [],
        },
      }
    );
    console.log(
      `🧹 Cleared personalAllowances and personalBonuses for all users`
    );

    console.log("\n✨ Payroll wipe completed successfully!");
  } catch (error) {
    console.error("❌ Error during wipe:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the wipe
wipePayrolls().catch(console.error);
