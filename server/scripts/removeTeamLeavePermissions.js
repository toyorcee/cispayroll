import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
import { UserRole, Permission } from "../models/User.js";

// Load environment variables
dotenv.config();

async function removeTeamLeavePermissions() {
  try {
    console.log("🔄 Starting team leave permission removal...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find all users with USER role
    const users = await User.find({ role: UserRole.USER });
    console.log(`Found ${users.length} users with USER role`);

    let updatedCount = 0;
    for (const user of users) {
      console.log(
        `\nProcessing user: ${user.firstName} ${user.lastName} (${user.employeeId})`
      );

      // Filter out the permissions we want to remove
      const updatedPermissions = user.permissions.filter(
        (p) =>
          p !== Permission.VIEW_TEAM_LEAVE && p !== Permission.APPROVE_LEAVE
      );

      // Update the user's permissions
      const result = await User.findOneAndUpdate(
        { _id: user._id },
        { $set: { permissions: updatedPermissions } },
        { new: true }
      );

      if (result) {
        console.log("✅ Updated permissions:", result.permissions);
        updatedCount++;
      }
    }

    console.log(
      `\n✨ Update completed successfully! Updated ${updatedCount} users`
    );
  } catch (error) {
    console.error("❌ Error updating users:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the update
removeTeamLeavePermissions().catch(console.error);
