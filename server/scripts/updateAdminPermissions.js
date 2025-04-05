import mongoose from "mongoose";
import User, { Permission } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define the missing permissions
const missingPermissions = [
  // Report permissions
  Permission.VIEW_PAYROLL_REPORTS,
  Permission.VIEW_EMPLOYEE_REPORTS,
  Permission.VIEW_TAX_REPORTS,

  // Bonus permissions
  Permission.MANAGE_BONUSES,
  Permission.VIEW_BONUSES,
  Permission.EDIT_BONUSES,
  Permission.CREATE_BONUSES,
  Permission.DELETE_BONUSES,
  Permission.MANAGE_OVERTIME,
  Permission.MANAGE_DEPARTMENT_BONUSES,
  Permission.VIEW_DEPARTMENT_BONUSES,

  // Settings permissions
  Permission.MANAGE_DEPARTMENT_SETTINGS,
  Permission.MANAGE_USER_SETTINGS,
  Permission.MANAGE_NOTIFICATION_SETTINGS,
  Permission.MANAGE_LEAVE_SETTINGS,
  Permission.MANAGE_PAYROLL_SETTINGS,
  Permission.MANAGE_DOCUMENT_SETTINGS,
  Permission.MANAGE_SYSTEM_SETTINGS,
  Permission.MANAGE_COMPANY_PROFILE,
  Permission.MANAGE_TAX_SETTINGS,
  Permission.MANAGE_COMPLIANCE_SETTINGS,
  Permission.MANAGE_INTEGRATION_SETTINGS,

  // Personal bonus view permission for SUPER_ADMIN
  Permission.VIEW_OWN_BONUS,
];

async function updateAdminPermissions() {
  try {
    console.log("🔄 Starting SUPER_ADMIN bonus permission update...");

    // Find all super admin users
    const superAdminUsers = await User.find({ role: "SUPER_ADMIN" });
    console.log(`Found ${superAdminUsers.length} SUPER_ADMIN users to update`);

    for (const user of superAdminUsers) {
      // Add VIEW_OWN_BONUS permission if they don't already have it
      if (!user.permissions.includes(Permission.VIEW_OWN_BONUS)) {
        const updatedPermissions = [
          ...user.permissions,
          Permission.VIEW_OWN_BONUS,
        ];

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
          `✅ Added VIEW_OWN_BONUS permission to SUPER_ADMIN: ${updatedUser.fullName} (${updatedUser.employeeId})`
        );
      } else {
        console.log(
          `ℹ️ SUPER_ADMIN ${user.fullName} (${user.employeeId}) already has VIEW_OWN_BONUS permission`
        );
      }
    }

    console.log("✨ Update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating SUPER_ADMIN permissions:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Connect to MongoDB and run the update
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("📡 Connected to MongoDB");
    return updateAdminPermissions();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  });
