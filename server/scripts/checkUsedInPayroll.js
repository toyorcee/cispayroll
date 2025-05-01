import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
import Allowance from "../models/Allowance.js";
import Bonus from "../models/Bonus.js";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function getUserPersonalComponents() {
  try {
    const userId = "67e9e81ebb907e1d9a25e806";

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

    // Format the output
    const formattedAllowances = userData.personalAllowances.map(
      (allowance) => ({
        name: allowance.allowanceId.name,
        type: allowance.allowanceId.type,
        value: allowance.allowanceId.value,
        amount: allowance.allowanceId.amount,
        frequency: allowance.allowanceId.frequency,
        status: allowance.status,
        usedInPayroll: allowance.usedInPayroll,
      })
    );

    const formattedBonuses = userData.personalBonuses.map((bonus) => ({
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
