import mongoose from "mongoose";
import User from "../models/User.js";
import "../models/Allowance.js";
import "../models/Bonus.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function getUserPersonalComponents() {
  try {
    const userId = "67f29dccbcda1d7c2667ba7c";

    const userData = await User.findById(userId)
      .select("personalAllowances personalBonuses")
      .populate({
        path: "personalAllowances.allowanceId",
        model: "Allowance",
        select: "name type value amount frequency",
      })
      .populate({
        path: "personalBonuses.bonusId",
        model: "Bonus",
        select: "type description amount",
      })
      .lean();

    if (!userData) {
      console.error("User not found!");
      return;
    }

    // Format the output
    const formattedAllowances = (userData.personalAllowances || [])
      .filter((a) => a.allowanceId)
      .map((allowance) => ({
        name: allowance.allowanceId.name,
        type: allowance.allowanceId.type,
        value: allowance.allowanceId.value,
        amount: allowance.allowanceId.amount,
        frequency: allowance.allowanceId.frequency,
        status: allowance.status,
        usedInPayroll: allowance.usedInPayroll,
      }));

    const formattedBonuses = (userData.personalBonuses || [])
      .filter((b) => b.bonusId)
      .map((bonus) => ({
        type: bonus.bonusId.type,
        description: bonus.bonusId.description,
        amount: bonus.bonusId.amount,
        status: bonus.status,
        usedInPayroll: bonus.usedInPayroll,
      }));

    console.log(
      "Personal Allowances:",
      JSON.stringify(formattedAllowances, null, 2)
    );
    console.log("Personal Bonuses:", JSON.stringify(formattedBonuses, null, 2));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.disconnect();
  }
}

getUserPersonalComponents();
