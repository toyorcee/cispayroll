import mongoose from "mongoose";
import User from "../models/User.js";
import Bonus from "../models/Bonus.js";
import dotenv from "dotenv";

dotenv.config();

const fixBonusPersonalBonuses = async () => {
  try {
    console.log("🔧 Starting bonus personalBonuses fix...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find all users with personalBonuses that have null bonusId
    const usersWithNullBonusId = await User.find({
      "personalBonuses.bonusId": null,
    });

    console.log(
      `📊 Found ${usersWithNullBonusId.length} users with null bonusId`
    );

    let fixedCount = 0;
    let removedCount = 0;

    for (const user of usersWithNullBonusId) {
      console.log(
        `🔍 Processing user: ${user.firstName} ${user.lastName} (${user._id})`
      );

      // Get all approved bonuses for this user
      const approvedBonuses = await Bonus.find({
        employee: user._id,
        approvalStatus: "approved",
      });

      console.log(
        `📋 Found ${approvedBonuses.length} approved bonuses for user`
      );

      // Remove all personalBonuses entries with null bonusId
      const updateResult = await User.updateOne(
        { _id: user._id },
        { $pull: { personalBonuses: { bonusId: null } } }
      );

      if (updateResult.modifiedCount > 0) {
        removedCount += updateResult.modifiedCount;
        console.log(
          `🗑️ Removed ${updateResult.modifiedCount} null bonusId entries`
        );
      }

      // Add correct personalBonuses entries for each approved bonus
      for (const bonus of approvedBonuses) {
        const personalBonus = {
          bonusId: bonus._id,
          status: "APPROVED",
          usedInPayroll: {
            month: null,
            year: null,
            payrollId: null,
          },
        };

        // Check if this bonus is already in personalBonuses
        const existingEntry = user.personalBonuses.find(
          (pb) => pb.bonusId && pb.bonusId.toString() === bonus._id.toString()
        );

        if (!existingEntry) {
          await User.updateOne(
            { _id: user._id },
            { $push: { personalBonuses: personalBonus } }
          );
          fixedCount++;
          console.log(`✅ Added bonus ${bonus._id} to personalBonuses`);
        } else {
          console.log(
            `ℹ️ Bonus ${bonus._id} already exists in personalBonuses`
          );
        }
      }
    }

    console.log("\n🎉 Fix completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Users processed: ${usersWithNullBonusId.length}`);
    console.log(`   - Null entries removed: ${removedCount}`);
    console.log(`   - Correct entries added: ${fixedCount}`);
  } catch (error) {
    console.error("❌ Error fixing bonus personalBonuses:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
};

// Run the fix
fixBonusPersonalBonuses();
