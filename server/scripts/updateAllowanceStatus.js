import mongoose from "mongoose";
import Allowance from "../models/Allowance.js";
import User from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function updateAllowanceStatus() {
  try {
    console.log("🔄 Starting allowance status update...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find the allowance by ID
    const allowanceId = "68120b2a83bf0537c4119770"; // The ID from your JSON
    const allowance = await Allowance.findById(allowanceId);

    if (!allowance) {
      console.error("❌ Allowance not found");
      return;
    }

    console.log("📝 Found allowance:", {
      id: allowance._id,
      status: allowance.approvalStatus,
      employee: allowance.employee,
    });

    // Update the allowance status
    allowance.approvalStatus = "approved";
    allowance.approvedAt = new Date();
    await allowance.save();

    console.log("✅ Updated allowance status to approved");

    // Find the user and update their personalAllowances array
    const user = await User.findById(allowance.employee);
    if (!user) {
      console.error("❌ User not found");
      return;
    }

    // Find the allowance in personalAllowances array and update its status
    const allowanceIndex = user.personalAllowances.findIndex(
      (a) => a._id.toString() === allowanceId
    );

    if (allowanceIndex !== -1) {
      user.personalAllowances[allowanceIndex].approvalStatus = "approved";
      user.personalAllowances[allowanceIndex].approvedAt = new Date();
      await user.save();
      console.log("✅ Updated user's personalAllowances array");
    } else {
      console.log("⚠️ Allowance not found in user's personalAllowances array");
    }

    console.log("\n✨ Update completed successfully!");
  } catch (error) {
    console.error("❌ Error during update:", error);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the update
updateAllowanceStatus().catch(console.error);
