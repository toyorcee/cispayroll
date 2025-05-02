import mongoose from "mongoose";
import User from "../models/User.js";
import Payroll from "../models/Payroll.js";
import dotenv from "dotenv";

dotenv.config();

async function setHeadOfHR() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const hrDeptId = "67e9bb7445f1b853da500821";
    const yourUserId = "67ee91aa24f31a737df7c1ef";

    const result = await mongoose.connection.db
      .collection("departments")
      .updateOne(
        { _id: new mongoose.Types.ObjectId(hrDeptId) },
        { $set: { headOfDepartment: new mongoose.Types.ObjectId(yourUserId) } }
      );

    if (result.modifiedCount === 1) {
      console.log("✅ You are now set as Head of HR!");
    } else {
      console.log("⚠️ Department not found or already set.");
    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

setHeadOfHR();
