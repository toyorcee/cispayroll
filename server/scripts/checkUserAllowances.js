import mongoose from "mongoose";
import User from "../models/User.js";
import Payroll from "../models/Payroll.js";
import dotenv from "dotenv";

dotenv.config();

async function checkUserAllowances() {
  try {
    console.log("🔄 Starting check...");
    await mongoose.connect(process.env.MONGO_URI);

    // Get all CS payrolls for May 2025
    const payrolls = await Payroll.find({
      department: "67e9dcc8c6a350a3b61a7327",
      month: 5,
      year: 2025,
    });

    console.log("\n📊 Payroll Records Found:");
    payrolls.forEach((p) => {
      console.log(`- ID: ${p._id}`);
      console.log(
        `  Employee: ${p.employee.firstName} ${p.employee.lastName} (${p.employee.employeeId})`
      );
      console.log(`  Allowances: ${p.allowances.totalAllowances}`);
      console.log(`  Bonuses: ${p.bonuses.totalBonuses}`);
    });

    // Get all CS users
    const users = await User.find({
      department: "67e9dcc8c6a350a3b61a7327",
    }).select(
      "firstName lastName employeeId personalAllowances personalBonuses"
    );

    console.log(`\n📊 Found ${users.length} users:`);

    users.forEach((user) => {
      console.log(
        `\n👤 ${user.firstName} ${user.lastName} (${user.employeeId})`
      );

      // Check Allowances
      console.log("\nAllowances:");
      if (user.personalAllowances.length === 0) {
        console.log("  No allowances");
      } else {
        user.personalAllowances.forEach((allowance) => {
          console.log(`  - ID: ${allowance.allowanceId}`);
          console.log(`    Status: ${allowance.status}`);
          console.log(
            `    Used in Payroll:`,
            allowance.usedInPayroll || "Not used"
          );
        });
      }

      // Check Bonuses
      console.log("\nBonuses:");
      if (user.personalBonuses.length === 0) {
        console.log("  No bonuses");
      } else {
        user.personalBonuses.forEach((bonus) => {
          console.log(`  - ID: ${bonus.bonusId}`);
          console.log(`    Status: ${bonus.status}`);
          console.log(
            `    Used in Payroll:`,
            bonus.usedInPayroll || "Not used"
          );
        });
      }
    });
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📝 Done!");
  }
}

checkUserAllowances();
