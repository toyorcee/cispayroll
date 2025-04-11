// migrations/updateUserStatus.js
import mongoose from "mongoose";
import User, { Permission } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function updateUserPermissions() {
  try {
    console.log("🔄 Starting permission update...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find the super admin account
    const superAdmin = await User.findById("67ee91aa24f31a737df7c1ef");

    if (!superAdmin) {
      console.log("❌ Super Admin user not found");
      return;
    }

    console.log(
      `Found user: ${superAdmin.fullName} (${superAdmin.employeeId})`
    );
    console.log("Current permissions:", superAdmin.permissions);

    // Get all available permissions from the Permission enum
    const allPermissions = Object.values(Permission);

    // Add any missing permissions
    const missingPermissions = allPermissions.filter(
      (permission) => !superAdmin.permissions.includes(permission)
    );

    if (missingPermissions.length > 0) {
      superAdmin.permissions = [
        ...new Set([...superAdmin.permissions, ...missingPermissions]),
      ];
      await superAdmin.save();
      console.log("✅ Added missing permissions:", missingPermissions);
    } else {
      console.log("ℹ️ Super Admin already has all permissions");
    }

    console.log("Updated permissions:", superAdmin.permissions);
    console.log("✨ Update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating user:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the update
updateUserPermissions().catch(console.error);
