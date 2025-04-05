import mongoose from "mongoose";
import User, { Permission } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define the missing permissions for USER role
const missingPermissions = [
  // Dashboard Access
  Permission.VIEW_DASHBOARD,

  // Personal Information
  Permission.VIEW_PERSONAL_INFO,
  Permission.EDIT_PERSONAL_INFO,

  // Leave Management
  Permission.REQUEST_LEAVE,
  Permission.VIEW_OWN_LEAVE,
  Permission.CANCEL_OWN_LEAVE,

  // Payroll Access
  Permission.VIEW_OWN_PAYSLIP,
  Permission.VIEW_OWN_ALLOWANCES,
  Permission.REQUEST_ALLOWANCES,
  Permission.VIEW_OWN_DEDUCTIONS,
  Permission.VIEW_OWN_BONUS,

  // Document Management
  Permission.VIEW_OWN_DOCUMENTS,
  Permission.UPLOAD_DOCUMENTS,

  // Notifications
  Permission.VIEW_NOTIFICATIONS,
  Permission.MARK_NOTIFICATIONS_READ,

  // Profile Management
  Permission.UPDATE_PROFILE,
  Permission.CHANGE_PASSWORD,

  // Feedback
  Permission.MANAGE_FEEDBACK,
];

async function updateUserPermissions() {
  try {
    console.log("🔄 Starting user permissions update...");

    // Find all users with USER role
    const users = await User.find({ role: "USER" });
    console.log(`Found ${users.length} users to update`);

    for (const user of users) {
      // Add missing permissions if they don't already have them
      const updatedPermissions = [
        ...new Set([...user.permissions, ...missingPermissions]),
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
        `✅ Updated user: ${updatedUser.fullName} (${updatedUser.employeeId})`
      );
    }

    console.log("✨ Update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating user permissions:", error);
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
    return updateUserPermissions();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  });
