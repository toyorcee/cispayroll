import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

const updateUserPermissions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // User ID from the log you provided
    const userId = "67f16ccbda7c4fbfd3755e11";

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("👤 Found user:", user.firstName, user.lastName);
    console.log("📋 Current permissions:", user.permissions);

    // Add VIEW_ALL_DEPARTMENTS permission if not already present
    if (!user.permissions.includes("VIEW_ALL_DEPARTMENTS")) {
      // Use findByIdAndUpdate to avoid validation issues
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { permissions: "VIEW_ALL_DEPARTMENTS" } },
        { new: true, runValidators: false }
      );
      console.log("✅ Added VIEW_ALL_DEPARTMENTS permission");
      console.log("📋 Updated permissions:", updatedUser.permissions);
    } else {
      console.log("ℹ️ VIEW_ALL_DEPARTMENTS permission already exists");
    }

    console.log("🎉 User permissions updated successfully!");
  } catch (error) {
    console.error("❌ Error updating user permissions:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the script
updateUserPermissions();
