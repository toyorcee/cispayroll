import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function getUserDetails() {
  try {
    console.log("🔄 Starting...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find the user by ID
    const userId = "67e9e7a8bb907e1d9a25e7ed"; // Mohammed's ID
    const user = await User.findById(userId);

    if (!user) {
      console.error("❌ User not found");
      return;
    }

    // Just show the raw data
    console.log("\n👤 User Data:");
    console.log(JSON.stringify(user, null, 2));
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n📝 Done");
  }
}

// Run the fetch
getUserDetails().catch(console.error);
