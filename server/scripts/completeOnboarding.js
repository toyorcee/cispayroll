import mongoose from "mongoose";
import User, { UserLifecycleState, OnboardingStatus } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function completeOnboarding() {
  try {
    console.log("🔄 Starting onboarding completion for Super Admin...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find Super Admin by email
    const user = await User.findOne({
      email: "superadmin@payrollcistechlab.com",
    });

    if (!user) {
      console.log("❌ Super Admin not found");
      return;
    }

    console.log(
      `\nProcessing user: ${user.firstName} ${user.lastName} (${user.employeeId})`
    );
    console.log("Current onboarding status:", user.onboarding.status);

    // Complete all remaining onboarding tasks
    const remainingTasks = [
      "Department Introduction",
      "System Access Setup",
      "Policy Documentation Review",
      "Initial Training Session",
    ];

    // Update each task to completed
    user.onboarding.tasks = user.onboarding.tasks.map((task) => {
      if (remainingTasks.includes(task.name)) {
        return {
          ...task,
          completed: true,
          completedAt: new Date(),
          completedBy: user._id, // Self-completed
        };
      }
      return task;
    });

    // Update onboarding status
    user.onboarding.status = OnboardingStatus.COMPLETED;
    user.onboarding.completedAt = new Date();
    user.onboarding.progress = 100;

    // Update lifecycle state
    user.lifecycle.currentState = UserLifecycleState.ACTIVE;
    user.lifecycle.history.push({
      state: UserLifecycleState.ACTIVE,
      timestamp: new Date(),
      updatedBy: user._id,
      notes: "Onboarding completed via script",
    });

    // Save the changes
    await user.save();

    console.log("✅ Onboarding tasks completed successfully!");
    console.log("Updated onboarding status:", user.onboarding.status);
    console.log("Updated lifecycle state:", user.lifecycle.currentState);
  } catch (error) {
    console.error("❌ Error completing onboarding:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the update
completeOnboarding().catch(console.error);
