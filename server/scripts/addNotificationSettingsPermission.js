import mongoose from "mongoose";
import User, { Permission } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function addNotificationSettingsPermission() {
  try {
    console.log("🔄 Starting to add notification settings permission...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find the user by email
    const userEmail = "payroldcistechuser@gmail.com"; // Replace with the user's email
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log(`❌ User with email ${userEmail} not found`);
      return;
    }

    console.log(
      `Found user: ${user.firstName} ${user.lastName} (${user.employeeId})`
    );
    console.log("Current permissions:", user.permissions);

    // Check if the user already has the permission
    if (user.permissions.includes(Permission.MANAGE_NOTIFICATION_SETTINGS)) {
      console.log(
        "ℹ️ User already has the MANAGE_NOTIFICATION_SETTINGS permission"
      );
      return;
    }

    // Add the permission
    const updatedPermissions = [
      ...new Set([
        ...user.permissions,
        Permission.MANAGE_NOTIFICATION_SETTINGS,
      ]),
    ];

    // Update the user
    const result = await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { permissions: updatedPermissions } },
      { new: true }
    );

    if (result) {
      console.log("✅ Added MANAGE_NOTIFICATION_SETTINGS permission");
      console.log("Updated permissions:", result.permissions);
    } else {
      console.log("❌ Failed to update permissions for user");
    }

    console.log("\n✨ Update completed successfully!");
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
addNotificationSettingsPermission().catch(console.error);
