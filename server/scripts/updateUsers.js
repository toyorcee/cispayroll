// migrations/updateUserStatus.js
import mongoose from "mongoose";
import User, { Permission } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function updateUserPermissions() {
  try {
    console.log("🔄 Starting permission update for specific user...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find the specific user by email
    const user = await User.findOne({ email: "payroldcistechuser@gmail.com" });
    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log(`\nProcessing user: ${user.fullName} (${user.employeeId})`);
    console.log("Current permissions:", user.permissions);

    // Remove only VIEW_ALL_USERS permission while keeping all others
    const updatedPermissions = user.permissions.filter(
      (permission) => permission !== Permission.VIEW_ALL_USERS
    );

    // Make sure we have all the leave-related permissions
    const leavePermissions = [
      Permission.REQUEST_LEAVE,
      Permission.VIEW_OWN_LEAVE,
      Permission.CANCEL_OWN_LEAVE,
      Permission.APPROVE_LEAVE,
      Permission.VIEW_TEAM_LEAVE,
    ];

    // Add any missing leave permissions
    leavePermissions.forEach((permission) => {
      if (!updatedPermissions.includes(permission)) {
        updatedPermissions.push(permission);
      }
    });

    // Use findOneAndUpdate to avoid password validation
    const result = await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { permissions: updatedPermissions } },
      { new: true }
    );

    if (result) {
      console.log(
        "✅ Removed VIEW_ALL_USERS permission and ensured leave permissions"
      );
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
updateUserPermissions().catch(console.error);
