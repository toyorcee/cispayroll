import mongoose from "mongoose";
import SalaryGrade from "../models/SalaryStructure.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function checkSalaryGrades() {
  try {
    console.log("🔍 Checking all salary grades in the database...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find all salary grades
    const salaryGrades = await SalaryGrade.find(
      {},
      { level: 1, basicSalary: 1, isActive: 1, department: 1 }
    );

    console.log(`Found ${salaryGrades.length} salary grades in total`);

    // Display results
    console.log("\nSalary Grade Distribution:");
    salaryGrades.forEach((grade) => {
      console.log(`\n${grade.level}:`);
      console.log(`  - Basic Salary: ₦${grade.basicSalary.toLocaleString()}`);
      console.log(`  - Active: ${grade.isActive}`);
      console.log(`  - Department: ${grade.department || "All Departments"}`);
    });

    console.log("\n✅ Salary grade check completed successfully!");
  } catch (error) {
    console.error("❌ Error checking salary grades:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the check
checkSalaryGrades().catch(console.error);
