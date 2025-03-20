import mongoose from "mongoose";
import dotenv from "dotenv";
import SalaryGrade from "../../models/SalaryStructure.js";

dotenv.config();

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/payroll"
    );
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

async function flushSalaryGrades() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    const result = await SalaryGrade.deleteMany({});
    console.log(`🧹 Deleted ${result.deletedCount} salary grades`);

    console.log("✨ Salary grades cleaned successfully");
  } catch (error) {
    console.error("❌ Error flushing salary grades:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
  }
}

// Run the flush script
flushSalaryGrades();
