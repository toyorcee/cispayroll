import mongoose from "mongoose";
import Allowance from "../models/Allowance.js";
import Bonus from "../models/Bonus.js";
import User from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function cleanup() {
  try {
    console.log("🔄 Starting database cleanup...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Clean up allowances
    console.log("🧹 Cleaning up allowances collection...");
    const allowanceResult = await Allowance.deleteMany({});
    console.log(
      `✅ Deleted ${allowanceResult.deletedCount} allowances from collection`
    );

    // Clean up bonuses
    console.log("🧹 Cleaning up bonuses collection...");
    const bonusResult = await Bonus.deleteMany({});
    console.log(
      `✅ Deleted ${bonusResult.deletedCount} bonuses from collection`
    );

    // Reset personal allowances and bonuses in user documents
    console.log("🔄 Resetting user personal allowances and bonuses...");
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
      `✅ Reset personal allowances and bonuses for ${userResult.modifiedCount} users`
    );

    // Verify cleanup
    const remainingAllowances = await Allowance.countDocuments({});
    const remainingBonuses = await Bonus.countDocuments({});
    const usersWithAllowances = await User.countDocuments({
      personalAllowances: { $exists: true, $ne: [] },
    });
    const usersWithBonuses = await User.countDocuments({
      personalBonuses: { $exists: true, $ne: [] },
    });

    console.log("\n📊 Cleanup Verification:");
    console.log(`- Remaining allowances in collection: ${remainingAllowances}`);
    console.log(`- Remaining bonuses in collection: ${remainingBonuses}`);
    console.log(`- Users with personal allowances: ${usersWithAllowances}`);
    console.log(`- Users with personal bonuses: ${usersWithBonuses}`);

    console.log("\n✨ Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the cleanup
cleanup().catch(console.error);
