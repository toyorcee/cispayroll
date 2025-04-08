import mongoose from "mongoose";
import User, { Permission } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define the bonus permissions
const bonusPermissions = [
  Permission.VIEW_BONUSES,
  Permission.MANAGE_BONUSES,
  Permission.MANAGE_DEPARTMENT_BONUSES,
  Permission.VIEW_DEPARTMENT_BONUSES,
  Permission.CREATE_BONUSES,
  Permission.DELETE_BONUSES,
  Permission.EDIT_BONUSES,
];

async function checkAdminBonusPermissions() {
  try {
    console.log("🔄 Starting admin bonus permission check...");

    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/cispayroll"
    );
    console.log("📝 Connected to MongoDB");

    // Find all admin users
    const adminUsers = await User.find({ role: "ADMIN" });
    console.log(`Found ${adminUsers.length} ADMIN users to check`);

    for (const user of adminUsers) {
      console.log(
        `\nChecking permissions for ADMIN: ${user.fullName} (${user.employeeId})`
      );

      // Check which bonus permissions the user has
      const missingPermissions = bonusPermissions.filter(
        (permission) => !user.permissions.includes(permission)
      );

      if (missingPermissions.length > 0) {
        console.log(
          `❌ Missing bonus permissions: ${missingPermissions.join(", ")}`
        );

        // Add missing permissions
        const updatedPermissions = [...user.permissions, ...missingPermissions];

        // Update the user
        const updatedUser = await User.findByIdAndUpdate(
          user._id,
          {
            $set: {
              permissions: updatedPermissions,
            },
          },
          { new: true }
        );

        console.log(
          `✅ Added missing bonus permissions to ADMIN: ${updatedUser.fullName}`
        );
      } else {
        console.log(
          `✅ ADMIN ${user.fullName} already has all bonus permissions`
        );
      }
    }

    console.log("\n✨ Check completed successfully!");
  } catch (error) {
    console.error("❌ Error checking ADMIN bonus permissions:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the function
checkAdminBonusPermissions();
