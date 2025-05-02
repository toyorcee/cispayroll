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
const userId = "67e9e73fbb907e1d9a25e7de";
const allowanceId = "6814ce2037b884abff1a35ae";
const bonusId = "6814ce4a37b884abff1a35f2";
const payrollId = "6814cf4437b884abff1a36ba"; // Use the correct payroll _id for the period you want
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
