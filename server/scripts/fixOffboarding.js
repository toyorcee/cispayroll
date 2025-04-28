import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const userId = "67ea37740650f1e5725db550"; // Your user's ID

async function inspectOffboardingTasks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findById(userId).lean();
    if (!user) {
      console.log("User not found!");
      return;
    }

    if (!user.offboarding || !user.offboarding.tasks) {
      console.log("No offboarding tasks found for this user.");
      return;
    }

    console.log(`\nOffboarding tasks for ${user.email}:\n`);
    user.offboarding.tasks.forEach((task) => {
      const isExitInterview = task.name === "exit_interview";
      console.log(
        `${isExitInterview ? "👉 " : "   "}${task.name}: completed = ${
          task.completed
        }, completedAt = ${task.completedAt}`
      );
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    console.log("\n📝 Database connection closed");
  }
}

inspectOffboardingTasks();
