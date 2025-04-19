import mongoose from "mongoose";
import UserModel from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function updateGradeLevel() {
  try {
    console.log("🔄 Starting grade level update for Joe Onyilo...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find Joe Onyilo by ID
    const employeeId = "67ee6184efab52dd05a4ab47";

    // First find the employee to display current info
    const employee = await UserModel.findById(employeeId);

    if (!employee) {
      console.log("❌ Employee not found");
      return;
    }

    console.log(
      `\nProcessing employee: ${employee.firstName} ${employee.lastName} (${employee.employeeId})`
    );
    console.log("Current grade level:", employee.gradeLevel);

    // Update grade level using findByIdAndUpdate to bypass validation
    const updatedEmployee = await UserModel.findByIdAndUpdate(
      employeeId,
      { gradeLevel: "GL-06" },
      { new: true }
    );

    console.log("✅ Grade level updated successfully!");
    console.log("Updated grade level:", updatedEmployee.gradeLevel);
  } catch (error) {
    console.error("❌ Error updating grade level:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the update
updateGradeLevel().catch(console.error);
