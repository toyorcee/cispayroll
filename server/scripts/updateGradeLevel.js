import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function updateGradeLevel() {
  try {
    console.log("🔄 Starting grade level update for Super Admin...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find Super Admin by email
    const user = await User.findOne({
      email: "superadmin@payrollcistechlab.com",
    });

    if (!user) {
      console.log("❌ Super Admin not found");
      return;
    }

    console.log(
      `\nProcessing user: ${user.firstName} ${user.lastName} (${user.employeeId})`
    );
    console.log("Current grade level:", user.gradeLevel);

    // Update grade level to correct format (GL-06)
    user.gradeLevel = "GL-06";

    // Save the changes
    await user.save();

    console.log("✅ Grade level updated successfully!");
    console.log("New grade level:", user.gradeLevel);
  } catch (error) {
    console.error("❌ Error updating grade level:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the update
updateGradeLevel().catch(console.error);
