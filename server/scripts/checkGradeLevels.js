import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function checkGradeLevels() {
  try {
    console.log("🔍 Checking all grade levels in the database...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find all users
    const users = await User.find(
      {},
      { firstName: 1, lastName: 1, employeeId: 1, gradeLevel: 1 }
    );

    console.log(`Found ${users.length} users in total`);

    // Group users by grade level
    const gradeLevelGroups = {};
    users.forEach((user) => {
      if (!gradeLevelGroups[user.gradeLevel]) {
        gradeLevelGroups[user.gradeLevel] = [];
      }
      gradeLevelGroups[user.gradeLevel].push(
        `${user.firstName} ${user.lastName} (${user.employeeId})`
      );
    });

    // Display results
    console.log("\nGrade Level Distribution:");
    Object.keys(gradeLevelGroups)
      .sort()
      .forEach((gradeLevel) => {
        console.log(
          `\n${gradeLevel}: ${gradeLevelGroups[gradeLevel].length} users`
        );
        gradeLevelGroups[gradeLevel].forEach((user) => {
          console.log(`  - ${user}`);
        });
      });

    console.log("\n✅ Grade level check completed successfully!");
  } catch (error) {
    console.error("❌ Error checking grade levels:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the check
checkGradeLevels().catch(console.error);
