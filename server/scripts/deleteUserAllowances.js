import mongoose from "mongoose";
import dotenv from "dotenv";
import AllowanceModel from "../models/Allowance.js";

// Load environment variables
dotenv.config();

const MONGODB_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/cispayroll";

console.log("🌐 Using MongoDB URI:", MONGODB_URI);

// ====== CHANGE THIS TO YOUR USER ID ======
const USER_ID = "67f16ccbda7c4fbfd3755e11"; // e.g. "67f16ccbda7c4fbfd3755e11"

async function deleteUserAllowances() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB successfully");

    const count = await AllowanceModel.countDocuments({ employee: USER_ID });
    console.log(`📊 Found ${count} allowances for user ${USER_ID}`);

    if (count > 0) {
      const result = await AllowanceModel.deleteMany({ employee: USER_ID });
      console.log(
        `🗑️  Deleted ${result.deletedCount} allowances for user ${USER_ID}`
      );
    } else {
      console.log("ℹ️  No allowances found for this user.");
    }

    // Verification
    const countAfter = await AllowanceModel.countDocuments({
      employee: USER_ID,
    });
    console.log(`📊 Remaining allowances for user: ${countAfter}`);

    if (countAfter === 0) {
      console.log("✅ All user allowances removed successfully.");
    } else {
      console.log("⚠️  Some user allowances may still exist.");
    }
  } catch (error) {
    console.error("❌ Error deleting user allowances:", error);
    process.exit(1);
  } finally {
    console.log("🔌 Disconnecting from MongoDB...");
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
console.log("🚀 Starting user allowance delete script...");
deleteUserAllowances();
