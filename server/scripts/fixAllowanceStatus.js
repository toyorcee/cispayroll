import mongoose from "mongoose";
import Allowance from "../models/Allowance.js";
import User from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function fixAllowanceStatus() {
  try {
    console.log("🔄 Starting allowance status check...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find the allowance by ID
    const allowanceId = "68120b2a83bf0537c4119770";
    const allowance = await Allowance.findById(allowanceId);

    if (!allowance) {
      console.error("❌ Allowance not found in Allowance collection");
      return;
    }

    console.log("\n📝 Allowance in main collection:", {
      id: allowance._id,
      status: allowance.approvalStatus,
      employee: allowance.employee,
      amount: allowance.amount,
      type: allowance.type,
      reason: allowance.reason,
    });

    // Find the user
    const user = await User.findById(allowance.employee);
    if (!user) {
      console.error("❌ User not found");
      return;
    }

    console.log("\n👤 User details:", {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`,
    });

    // Find the allowance in personalAllowances array
    const personalAllowance = user.personalAllowances.find(
      (a) => a._id.toString() === allowanceId
    );

    if (personalAllowance) {
      console.log("\n📝 Allowance in personalAllowances array:", {
        id: personalAllowance._id,
        status: personalAllowance.approvalStatus,
        amount: personalAllowance.amount,
        type: personalAllowance.type,
        reason: personalAllowance.reason,
      });
    } else {
      console.log("\n❌ Allowance not found in personalAllowances array");
    }
  } catch (error) {
    console.error("❌ Error during check:", error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("\n📝 Database connection closed");
  }
}

// Run the check
fixAllowanceStatus().catch(console.error);
