// scripts/cleanPayrolls.js
import mongoose from "mongoose";
import PayrollModel from "../models/Payroll.js";
import NotificationModel from "../models/Notification.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function cleanPayrollsAndNotifications() {
  try {
    console.log("🔄 Starting cleanup process...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Delete all payrolls
    const payrollResult = await PayrollModel.deleteMany({});
    console.log(`✅ Deleted ${payrollResult.deletedCount} payrolls`);

    // Delete all notifications
    const notificationResult = await NotificationModel.deleteMany({});
    console.log(`✅ Deleted ${notificationResult.deletedCount} notifications`);

    console.log("✨ Cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the cleanup
cleanPayrollsAndNotifications().catch(console.error);
