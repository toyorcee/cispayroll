import mongoose from "mongoose";
import User from "../models/User";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI as string);
    console.log("MongoDB Connected");

    // Drop the problematic index
    try {
      await User.collection.dropIndex("bankDetails.accountNumber_1");
      console.log("Dropped bankDetails.accountNumber index");
    } catch (error) {
      // It's okay if the index doesn't exist
      console.log("Index might not exist, continuing...");
    }

    return conn;
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export default connectDB;
