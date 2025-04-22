// scripts/cleanNotifications.js
import mongoose from "mongoose";
import NotificationModel from "../models/Notification.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function cleanNotifications() {
  try {
    console.log("🔄 Starting notification cleanup process...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Delete all notifications
    const notificationResult = await NotificationModel.deleteMany({});
    console.log(`✅ Deleted ${notificationResult.deletedCount} notifications`);

    console.log("✨ Notification cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error during notification cleanup:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the cleanup
cleanNotifications().catch(console.error);
