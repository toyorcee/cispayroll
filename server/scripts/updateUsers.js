// migrations/updateUserStatus.js
import mongoose from "mongoose";
import User, { Permission } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function updateUserPermissions() {
  try {
    console.log("🔄 Starting permission update for all ADMIN users...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find all users with ADMIN role
    const adminUsers = await User.find({ role: "ADMIN" });
    console.log(`Found ${adminUsers.length} admin users`);

    // Get all available permissions from the Permission enum
    const allPermissions = Object.values(Permission);

    let updatedCount = 0;
    for (const admin of adminUsers) {
      console.log(`\nProcessing user: ${admin.fullName} (${admin.employeeId})`);
      console.log("Current permissions:", admin.permissions);

      // Add any missing permissions
      const missingPermissions = allPermissions.filter(
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
          updatedCount++;
        } else {
          console.log("❌ Failed to update permissions for user");
        }
      } else {
        console.log("ℹ️ User already has all permissions");
      }
    }

    console.log(
      `\n✨ Update completed successfully! Updated ${updatedCount} users`
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
