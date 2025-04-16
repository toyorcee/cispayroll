import mongoose from "mongoose";
import User, { Permission, UserRole } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function addAuditLogsPermission() {
  try {
    console.log("🔄 Starting audit logs permission update for all users...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Process Super Admins
    const superAdminUsers = await User.find({ role: UserRole.SUPER_ADMIN });
    console.log(`Found ${superAdminUsers.length} super admin users`);

    let updatedSuperAdminCount = 0;
    for (const admin of superAdminUsers) {
      console.log(
        `\nProcessing super admin: ${admin.firstName} ${admin.lastName} (${admin.employeeId})`
      );

      // Check if VIEW_AUDIT_LOGS permission is missing
      if (!admin.permissions.includes(Permission.VIEW_AUDIT_LOGS)) {
        const updatedPermissions = [
          ...new Set([...admin.permissions, Permission.VIEW_AUDIT_LOGS]),
        ];

        // Use findOneAndUpdate to avoid password validation
        const result = await User.findOneAndUpdate(
          { _id: admin._id },
          { $set: { permissions: updatedPermissions } },
          { new: true }
        );

        if (result) {
          console.log("✅ Added VIEW_AUDIT_LOGS permission");
          console.log("Updated permissions:", result.permissions);
          updatedSuperAdminCount++;
        } else {
          console.log("❌ Failed to update permissions for super admin");
        }
      } else {
        console.log("ℹ️ Super admin already has VIEW_AUDIT_LOGS permission");
      }
    }

    // Process Admins
    const adminUsers = await User.find({ role: UserRole.ADMIN });
    console.log(`\nFound ${adminUsers.length} admin users`);

    let updatedAdminCount = 0;
    for (const admin of adminUsers) {
      console.log(
        `\nProcessing admin: ${admin.firstName} ${admin.lastName} (${admin.employeeId})`
      );

      // Check if VIEW_AUDIT_LOGS permission is missing
      if (!admin.permissions.includes(Permission.VIEW_AUDIT_LOGS)) {
        const updatedPermissions = [
          ...new Set([...admin.permissions, Permission.VIEW_AUDIT_LOGS]),
        ];

        // Use findOneAndUpdate to avoid password validation
        const result = await User.findOneAndUpdate(
          { _id: admin._id },
          { $set: { permissions: updatedPermissions } },
          { new: true }
        );

        if (result) {
          console.log("✅ Added VIEW_AUDIT_LOGS permission");
          console.log("Updated permissions:", result.permissions);
          updatedAdminCount++;
        } else {
          console.log("❌ Failed to update permissions for admin");
        }
      } else {
        console.log("ℹ️ Admin already has VIEW_AUDIT_LOGS permission");
      }
    }

    // Process Regular Users
    const regularUsers = await User.find({ role: UserRole.USER });
    console.log(`\nFound ${regularUsers.length} regular users`);

    let updatedUserCount = 0;
    for (const user of regularUsers) {
      console.log(
        `\nProcessing user: ${user.firstName} ${user.lastName} (${user.employeeId})`
      );

      // Check if VIEW_AUDIT_LOGS permission is missing
      if (!user.permissions.includes(Permission.VIEW_AUDIT_LOGS)) {
        const updatedPermissions = [
          ...new Set([...user.permissions, Permission.VIEW_AUDIT_LOGS]),
        ];

        // Use findOneAndUpdate to avoid password validation
        const result = await User.findOneAndUpdate(
          { _id: user._id },
          { $set: { permissions: updatedPermissions } },
          { new: true }
        );

        if (result) {
          console.log("✅ Added VIEW_AUDIT_LOGS permission");
          console.log("Updated permissions:", result.permissions);
          updatedUserCount++;
        } else {
          console.log("❌ Failed to update permissions for user");
        }
      } else {
        console.log("ℹ️ User already has VIEW_AUDIT_LOGS permission");
      }
    }

    console.log(
      `\n✨ Update completed successfully! Added VIEW_AUDIT_LOGS permission to ${updatedSuperAdminCount} super admins, ${updatedAdminCount} admins, and ${updatedUserCount} regular users`
    );
  } catch (error) {
    console.error("❌ Error updating users:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the update
addAuditLogsPermission().catch(console.error);
