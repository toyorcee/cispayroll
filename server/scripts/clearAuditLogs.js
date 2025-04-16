import mongoose from "mongoose";
import Audit from "../models/Audit.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function clearAuditLogs() {
  try {
    console.log("🔄 Starting audit logs cleanup...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Get count of audit logs before deletion
    const countBefore = await Audit.countDocuments();
    console.log(`Found ${countBefore} audit logs to delete`);

    // Delete all audit logs
    const result = await Audit.deleteMany({});
    console.log(`✅ Deleted ${result.deletedCount} audit logs`);

    console.log("✨ Audit logs cleanup completed successfully!");
  } catch (error) {
    console.error("❌ Error clearing audit logs:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the cleanup
clearAuditLogs().catch(console.error);
