// migrations/updateDeductionPreferences.js
import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
import { CoreStatutoryDeduction } from "../models/Deduction.js";

// Load environment variables
dotenv.config();

async function updateDeductionPreferences() {
  try {
    console.log("🔄 Starting deduction preferences update...");

    const users = await User.find({});
    console.log(`Found ${users.length} users to update`);

    for (const user of users) {
      // Get super admin ID for initial setup
      const superAdminId = user.createdBy || user._id;

      // Update default statutory with complete structure
      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            "deductionPreferences.statutory.defaultStatutory": {
              "paye tax": {
                opted: true,
                optedAt: user.createdAt,
                optedBy: superAdminId,
                reason: "MANDATORY",
                notes: "Core statutory deduction - Cannot be opted out",
              },
              pension: {
                opted: true,
                optedAt: user.createdAt,
                optedBy: superAdminId,
                reason: "MANDATORY",
                notes: "Core statutory deduction - Cannot be opted out",
              },
              nhf: {
                opted: true,
                optedAt: user.createdAt,
                optedBy: superAdminId,
                reason: "MANDATORY",
                notes: "Core statutory deduction - Cannot be opted out",
              },
            },
            // Ensure arrays are initialized properly
            "deductionPreferences.statutory.customStatutory": [],
            "deductionPreferences.voluntary.standardVoluntary": [],
            "deductionPreferences.voluntary.customVoluntary": [],
          },
        },
        { new: true }
      );

      console.log(
        `✅ Updated user: ${updatedUser.fullName} (${updatedUser.employeeId})`
      );
    }

    console.log("✨ Update completed successfully!");
  } catch (error) {
    console.error("❌ Update failed:", error);
    console.error("Error details:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Connect to MongoDB before running the update
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("📡 Connected to MongoDB");
    return updateDeductionPreferences();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  });
