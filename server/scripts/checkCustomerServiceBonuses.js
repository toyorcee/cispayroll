import mongoose from "mongoose";
import User from "../models/User.js";
import Bonus from "../models/Bonus.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function checkCustomerServiceBonuses() {
  try {
    console.log("🔍 Checking Customer Service department bonuses...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find all customer service users with their personal bonuses
    const users = await User.find({
      department: "67e9dcc8c6a350a3b61a7327", // Customer Service department ID
    })
      .select("firstName lastName personalBonuses")
      .populate({
        path: "personalBonuses.bonusId",
        select: "type amount usedInPayroll",
      })
      .lean();

    console.log(`\n👥 Found ${users.length} Customer Service users\n`);

    // Process each user
    users.forEach((user) => {
      console.log(`📋 ${user.firstName} ${user.lastName}`);
      console.log("─".repeat(50));

      if (user.personalBonuses && user.personalBonuses.length > 0) {
        user.personalBonuses.forEach((pb) => {
          const bonus = pb.bonusId;
          console.log(`\nBonus ID: ${bonus._id}`);
          console.log(`Type: ${bonus.type}`);
          console.log(`Amount: ₦${bonus.amount.toLocaleString()}`);
          console.log(`Status: ${pb.status}`);

          if (pb.usedInPayroll) {
            console.log(
              `Used in: ${pb.usedInPayroll.month}/${pb.usedInPayroll.year}`
            );
            console.log(`Payroll ID: ${pb.usedInPayroll.payrollId}`);
          } else {
            console.log("Status: Not used in any payroll");
          }
          console.log("─".repeat(50));
        });
      } else {
        console.log("❌ No bonuses found for this user");
        console.log("─".repeat(50));
      }
    });
  } catch (error) {
    console.error("❌ Error checking customer service bonuses:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("\n📝 Database connection closed");
  }
}

// Run the check
checkCustomerServiceBonuses().catch(console.error);
