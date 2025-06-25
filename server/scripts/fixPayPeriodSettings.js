import mongoose from "mongoose";
import SystemSettings from "../models/SystemSettings.js";
import dotenv from "dotenv";

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function fixPayPeriodSettings() {
  try {
    console.log("🔧 Starting pay period settings fix...");

    // Find current system settings
    const settings = await SystemSettings.findOne();

    if (!settings) {
      console.log(
        "❌ No system settings found. Creating new settings with correct format..."
      );
      const newSettings = new SystemSettings({
        payrollSettings: {
          processingDay: 25,
          currency: "NGN",
          fiscalYear: "2024",
          payPeriod: "monthly", // Correct lowercase format
        },
        quickSettings: {
          notifications: true,
        },
      });
      await newSettings.save();
      console.log(
        "✅ Created new system settings with correct pay period format"
      );
      return;
    }

    console.log(
      "📋 Current pay period setting:",
      settings.payrollSettings.payPeriod
    );

    // Mapping for fixing capitalized values
    const payPeriodMapping = {
      Monthly: "monthly",
      Weekly: "weekly",
      "Bi-weekly": "biweekly",
      Quarterly: "quarterly",
      Annual: "annual",
    };

    const currentPayPeriod = settings.payrollSettings.payPeriod;
    const correctedPayPeriod =
      payPeriodMapping[currentPayPeriod] || currentPayPeriod;

    if (currentPayPeriod === correctedPayPeriod) {
      console.log(
        "✅ Pay period setting is already in correct format:",
        currentPayPeriod
      );
      return;
    }

    // Update the pay period to correct format
    settings.payrollSettings.payPeriod = correctedPayPeriod;
    await settings.save();

    console.log("✅ Successfully updated pay period setting:");
    console.log(`   From: "${currentPayPeriod}"`);
    console.log(`   To: "${correctedPayPeriod}"`);
    console.log(
      "✅ Pay period settings are now compatible with payroll service!"
    );
  } catch (error) {
    console.error("❌ Error fixing pay period settings:", error);
  } finally {
    mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

fixPayPeriodSettings();
