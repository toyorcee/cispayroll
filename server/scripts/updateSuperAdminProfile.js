import mongoose from "mongoose";
import UserModel from "../models/User.js";
import dotenv from "dotenv";

dotenv.config();

async function updateSuperAdminProfile() {
  try {
    console.log("🔄 Starting super admin profile update...");

    const superAdminId = "67d7d55acccafb0fc97432ec";
    const profileImage =
      "uploads\\profiles\\profile-1743379455710-320318529.jpeg";

    // Find and update the super admin, bypassing the getter
    const updatedUser = await UserModel.findByIdAndUpdate(
      superAdminId,
      { $set: { profileImage } },
      { new: true, runValidators: false }
    );

    if (updatedUser) {
      console.log("✅ Successfully updated super admin profile image");
      console.log("Updated user:", {
        id: updatedUser._id,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        profileImage: updatedUser.profileImage,
      });
    } else {
      console.log("❌ Super admin not found");
    }

    console.log("✨ Update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating super admin profile:", error);
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
    return updateSuperAdminProfile();
  })
  .catch((error) => {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  });
