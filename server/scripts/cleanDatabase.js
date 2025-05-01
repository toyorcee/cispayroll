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

    // Reset usedInPayroll for all bonuses
    const bonusResult = await Bonus.updateMany(
      { usedInPayroll: { $exists: true } },
      { $unset: { usedInPayroll: "" } }
    );
    console.log(`🔄 Reset ${bonusResult.modifiedCount} bonus records`);

    // Reset usedInPayroll for all allowances
    const allowanceResult = await Allowance.updateMany(
      { usedInPayroll: { $exists: true } },
      { $unset: { usedInPayroll: "" } }
    );
    console.log(`🔄 Reset ${allowanceResult.modifiedCount} allowance records`);

    // Reset usedInPayroll in user's personal allowances and bonuses
    const userResult = await User.updateMany(
      {
        $or: [
          { "personalAllowances.usedInPayroll": { $exists: true } },
          { "personalBonuses.usedInPayroll": { $exists: true } },
        ],
      },
      {
        $set: {
          "personalAllowances.$[].usedInPayroll": null,
          "personalBonuses.$[].usedInPayroll": null,
        },
      }
    );
    console.log(`🔄 Reset user personal records`);

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
