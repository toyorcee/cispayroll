import mongoose from "mongoose";
import User, { Permission, UserRole } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function updateUserPermissions() {
  try {
    console.log("🔄 Starting permission update for all users...");

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
      console.log("Current permissions:", admin.permissions);

      // Add required permissions if missing
      const requiredPermissions = [
        Permission.VIEW_ALL_PAYSLIPS,
        Permission.VIEW_DEPARTMENT_PAYSLIPS,
        Permission.VIEW_OWN_PAYSLIP,
      ];

      const missingPermissions = requiredPermissions.filter(
        (permission) => !admin.permissions.includes(permission)
      );

      if (missingPermissions.length > 0) {
        const updatedPermissions = [
          ...new Set([...admin.permissions, ...missingPermissions]),
        ];

        // Use findOneAndUpdate to avoid password validation
        const result = await User.findOneAndUpdate(
          { _id: admin._id },
          { $set: { permissions: updatedPermissions } },
          { new: true }
        );

        if (result) {
          console.log("✅ Added missing permissions:", missingPermissions);
          console.log("Updated permissions:", result.permissions);
          updatedSuperAdminCount++;
        } else {
          console.log("❌ Failed to update permissions for super admin");
        }
      } else {
        console.log("ℹ️ Super admin already has all required permissions");
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
      console.log("Current permissions:", admin.permissions);

      // Add required permissions if missing
      const requiredPermissions = [
        Permission.VIEW_DEPARTMENT_PAYSLIPS,
        Permission.VIEW_OWN_PAYSLIP,
      ];

      const missingPermissions = requiredPermissions.filter(
        (permission) => !admin.permissions.includes(permission)
      );

      if (missingPermissions.length > 0) {
        const updatedPermissions = [
          ...new Set([...admin.permissions, ...missingPermissions]),
        ];

        // Use findOneAndUpdate to avoid password validation
        const result = await User.findOneAndUpdate(
          { _id: admin._id },
          { $set: { permissions: updatedPermissions } },
          { new: true }
        );

        if (result) {
          console.log("✅ Added missing permissions:", missingPermissions);
          console.log("Updated permissions:", result.permissions);
          updatedAdminCount++;
        } else {
          console.log("❌ Failed to update permissions for admin");
        }
      } else {
        console.log("ℹ️ Admin already has all required permissions");
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
      console.log("Current permissions:", user.permissions);

      // Add required permissions if missing
      const requiredPermissions = [Permission.VIEW_OWN_PAYSLIP];

      const missingPermissions = requiredPermissions.filter(
        (permission) => !user.permissions.includes(permission)
      );

      if (missingPermissions.length > 0) {
        const updatedPermissions = [
          ...new Set([...user.permissions, ...missingPermissions]),
        ];

        // Use findOneAndUpdate to avoid password validation
        const result = await User.findOneAndUpdate(
          { _id: user._id },
          { $set: { permissions: updatedPermissions } },
          { new: true }
        );

        if (result) {
          console.log("✅ Added missing permissions:", missingPermissions);
          console.log("Updated permissions:", result.permissions);
          updatedUserCount++;
        } else {
          console.log("❌ Failed to update permissions for user");
        }
      } else {
        console.log("ℹ️ User already has all required permissions");
      }
    }

    console.log(
      `\n✨ Update completed successfully! Updated ${updatedSuperAdminCount} super admins, ${updatedAdminCount} admins, and ${updatedUserCount} regular users`
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
updateUserPermissions().catch(console.error);
