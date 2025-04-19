import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function fixGradeLevels() {
  try {
    console.log("🔄 Starting grade level fixes for all employees...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find all users with incorrect grade level format
    const users = await User.find({
      $or: [
        { gradeLevel: { $regex: /^L\d+$/ } }, // Matches L6, L7, etc.
        { gradeLevel: { $regex: /^\d+$/ } }, // Matches just numbers like 6, 7, etc.
      ],
    });

    console.log(
      `Found ${users.length} users with incorrect grade level format`
    );

    // Update each user's grade level
    for (const user of users) {
      console.log(
        `\nProcessing user: ${user.firstName} ${user.lastName} (${user.employeeId})`
      );
      console.log("Current grade level:", user.gradeLevel);

      // Extract the number from L6 format or just number format
      const levelNumber = user.gradeLevel.replace("L", "");
      const newGradeLevel = `GL-${levelNumber.padStart(2, "0")}`;

      // Update the grade level
      user.gradeLevel = newGradeLevel;
      await user.save();

      console.log("Updated grade level:", user.gradeLevel);
    }

    console.log("\n✅ Grade level fixes completed successfully!");
  } catch (error) {
    console.error("❌ Error fixing grade levels:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the fix
fixGradeLevels().catch(console.error);
