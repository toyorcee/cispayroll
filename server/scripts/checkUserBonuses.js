import mongoose from "mongoose";
import User from "../models/User.js";
import Department from "../models/Department.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function checkUserBonuses() {
  try {
    console.log("🔄 Starting user bonus check...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find Customer Service department by ID
    const customerServiceDept = await Department.findById(
      "67e9dcc8c6a350a3b61a7327"
    );
    if (!customerServiceDept) {
      console.log("❌ Customer Service department not found");
      return;
    }

    console.log(`\n🔍 Checking users in Customer Service department...`);

    // Find all users in Customer Service department
    const users = await User.find({
      department: customerServiceDept._id,
    }).select("firstName lastName employeeId personalBonuses");

    if (users.length === 0) {
      console.log("❌ No users found in Customer Service department");
      return;
    }

    console.log(
      `\n📊 Found ${users.length} users in Customer Service department:`
    );

    // Display each user's personal bonuses
    users.forEach((user) => {
      console.log(
        `\n👤 User: ${user.firstName} ${user.lastName} (${user.employeeId})`
      );
      console.log("Personal Bonuses:");

      if (user.personalBonuses.length === 0) {
        console.log("  No personal bonuses assigned");
      } else {
        user.personalBonuses.forEach((bonus) => {
          console.log(`  - Bonus ID: ${bonus.bonusId}`);
          console.log(`    Status: ${bonus.status}`);
          if (bonus.usedInPayroll) {
            console.log(
              `    Used in Payroll: ${bonus.usedInPayroll.month}/${bonus.usedInPayroll.year}`
            );
          }
        });
      }
    });

    console.log("\n✨ Check completed successfully!");
  } catch (error) {
    console.error("❌ Error during check:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the check
checkUserBonuses().catch(console.error);
