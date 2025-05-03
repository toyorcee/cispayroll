// scripts/manualMarkUserEmbedded.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

// Load environment variables from .env
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not set in your .env file!");
  process.exit(1);
}

// === SET THESE VALUES ===
const userId = "67f29dccbcda1d7c2667ba7c"; // Tope's ID
const allowanceId = "6815d2acf11ccbf9af6e94dd"; // Tope's allowance ID
const bonusId = "6815d287f11ccbf9af6e949c"; // Tope's bonus ID
const payrollId = "6815dcf77c1a22133f815f8f"; // Current payroll ID
const month = 5;
const year = 2025;
// ========================

async function run() {
  await mongoose.connect(MONGO_URI);

  // Print BEFORE state
  const userBefore = await User.findById(userId).lean();
  const beforeAllowance = userBefore.personalAllowances?.find(
    (a) => a.allowanceId.toString() === allowanceId
  );
  const beforeBonus = userBefore.personalBonuses?.find(
    (b) => b.bonusId.toString() === bonusId
  );
  console.log("BEFORE update:");
  console.log("Personal Allowance:", beforeAllowance?.usedInPayroll);
  console.log("Personal Bonus:", beforeBonus?.usedInPayroll);

  // Update only the relevant embedded array elements using arrayFilters
  const update = {};
  const arrayFilters = [];

  if (allowanceId) {
    update["personalAllowances.$[a].usedInPayroll"] = {
      month,
      year,
      payrollId,
    };
    arrayFilters.push({
      "a.allowanceId": new mongoose.Types.ObjectId(allowanceId),
    });
  }
  if (bonusId) {
    update["personalBonuses.$[b].usedInPayroll"] = { month, year, payrollId };
    arrayFilters.push({
      "b.bonusId": new mongoose.Types.ObjectId(bonusId),
    });
  }

  const result = await User.updateOne(
    { _id: userId },
    { $set: update },
    { arrayFilters, strict: false }
  );
  console.log("Update result:", result);

  // Print AFTER state
  const userAfter = await User.findById(userId).lean();
  const afterAllowance = userAfter.personalAllowances?.find(
    (a) => a.allowanceId.toString() === allowanceId
  );
  const afterBonus = userAfter.personalBonuses?.find(
    (b) => b.bonusId.toString() === bonusId
  );
  console.log("AFTER update:");
  console.log("Personal Allowance:", afterAllowance?.usedInPayroll);
  console.log("Personal Bonus:", afterBonus?.usedInPayroll);

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
