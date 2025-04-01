import mongoose from "mongoose";
import Deduction, {
  DeductionType,
  ApplicabilityType,
  DeductionCategory,
  DeductionScope,
} from "../models/Deduction.js";
import dotenv from "dotenv";

dotenv.config();

const migrationScript = async () => {
  try {
    console.log("🔄 Starting deduction migration...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Get all existing deductions
    const deductions = await Deduction.find({});
    console.log(`📋 Found ${deductions.length} deductions to migrate`);

    for (const deduction of deductions) {
      console.log(`\n🔄 Migrating deduction: ${deduction.name}`);

      // Determine category based on name and type
      let category = DeductionCategory.GENERAL;

      // Statutory Deductions Categorization
      if (deduction.type === DeductionType.STATUTORY) {
        switch (deduction.name.toLowerCase()) {
          case "paye tax":
            category = DeductionCategory.TAX;
            break;
          case "pension":
            category = DeductionCategory.PENSION;
            break;
          case "nhf":
            category = DeductionCategory.HOUSING;
            break;
          case "professional development tax":
            category = DeductionCategory.OTHER;
            break;
        }
      }
      // Voluntary Deductions Categorization
      else if (deduction.type === DeductionType.VOLUNTARY) {
        const name = deduction.name.toLowerCase();
        if (name.includes("loan") || name.includes("car loan")) {
          category = DeductionCategory.LOAN;
        } else if (name.includes("housing") || name.includes("housing fund")) {
          category = DeductionCategory.HOUSING;
        } else if (name.includes("union")) {
          category = DeductionCategory.COOPERATIVE;
        } else if (name.includes("insurance")) {
          category = DeductionCategory.OTHER;
        } else if (name.includes("gym")) {
          category = DeductionCategory.GENERAL;
        }
      }

      // Determine if it's a custom statutory deduction
      const isCustom =
        deduction.type === DeductionType.STATUTORY &&
        !["paye tax", "pension", "nhf"].includes(deduction.name.toLowerCase());

      // Set appropriate scope
      let scope = DeductionScope.COMPANY_WIDE;
      if (deduction.type === DeductionType.VOLUNTARY) {
        scope = DeductionScope.INDIVIDUAL;
      }

      const updates = {
        category,
        isCustom,
        scope,
        applicability:
          deduction.type === DeductionType.STATUTORY
            ? ApplicabilityType.GLOBAL
            : ApplicabilityType.INDIVIDUAL,
        assignedEmployees:
          deduction.type === DeductionType.VOLUNTARY ? [] : undefined,
      };

      await Deduction.findByIdAndUpdate(deduction._id, updates);
      console.log(`✅ Updated ${deduction.name} with:`, updates);
    }

    // Generate summary after migration
    const finalDeductions = await Deduction.find({});
    const summary = {
      statutory: {
        total: finalDeductions.filter((d) => d.type === DeductionType.STATUTORY)
          .length,
        default: finalDeductions.filter(
          (d) => d.type === DeductionType.STATUTORY && !d.isCustom
        ).length,
        custom: finalDeductions.filter(
          (d) => d.type === DeductionType.STATUTORY && d.isCustom
        ).length,
        categories: finalDeductions
          .filter((d) => d.type === DeductionType.STATUTORY)
          .reduce((acc, d) => {
            acc[d.category] = (acc[d.category] || 0) + 1;
            return acc;
          }, {}),
      },
      voluntary: {
        total: finalDeductions.filter((d) => d.type === DeductionType.VOLUNTARY)
          .length,
        categories: finalDeductions
          .filter((d) => d.type === DeductionType.VOLUNTARY)
          .reduce((acc, d) => {
            acc[d.category] = (acc[d.category] || 0) + 1;
            return acc;
          }, {}),
      },
    };

    console.log("\n📊 Migration Summary:", JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log("👋 MongoDB connection closed");
  }
};

// Run the migration
migrationScript()
  .then(() => {
    console.log("🏁 Migration script finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Migration script failed:", error);
    process.exit(1);
  });
