import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../../models/User.js";
import { UserRole } from "../../models/User.js";

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

async function flushUsers() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    // Delete all users except this specific super admin
    const result = await User.deleteMany({
      _id: { $ne: "67d7d55acccafb0fc97432ec" }, // Your ID
    });
    console.log(
      `🧹 Deleted ${result.deletedCount} users (preserved your super admin account)`
    );

    console.log("✨ Database cleaned successfully");
  } catch (error) {
    console.error("❌ Error flushing database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("📡 Disconnected from MongoDB");
  }
}

// Run the flush script
flushUsers();
