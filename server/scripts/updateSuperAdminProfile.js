import mongoose from "mongoose";
import UserModel from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function updateSuperAdminProfile() {
  try {
    console.log("🔄 Starting super admin profile update...");

    const superAdminId = "67d7d55acccafb0fc97432ec";

    // Only update the profile image path
    const updateData = {
      profileImage: "uploads/profiles/profile-1743379455710-320318529.jpeg",
    };

    const updatedUser = await UserModel.findByIdAndUpdate(
      superAdminId,
      { $set: updateData },
      { new: true, runValidators: false }
    );

    if (updatedUser) {
      console.log("✅ Successfully updated super admin profile image path");
      console.log("Updated profile image:", updatedUser.profileImage);
    } else {
      console.log("❌ Super admin not found");
    }

    console.log("✨ Update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating super admin profile:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Connect to MongoDB and run the update
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("📡 Connected to MongoDB");
    return updateSuperAdminProfile();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  });
