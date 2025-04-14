import mongoose from "mongoose";
import User, { Permission } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function addSuperAdminPermissions() {
  try {
    console.log("🔄 Starting Super Admin permission update...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find the Super Admin user
    const superAdmin = await User.findOne({ role: "SUPER_ADMIN" });

    if (!superAdmin) {
      console.log("❌ Super Admin user not found");
      return;
    }

    console.log(
      `Found user: ${superAdmin.fullName} (${superAdmin.employeeId})`
    );
    console.log("Current permissions:", superAdmin.permissions);

    // Permissions to add
    const permissionsToAdd = [
      Permission.VIEW_DEPARTMENT_PAYROLL,
      Permission.SUBMIT_PAYROLL,
    ];

    // Check if permissions already exist
    const existingPermissions = superAdmin.permissions || [];
    const newPermissions = permissionsToAdd.filter(
      (p) => !existingPermissions.includes(p)
    );

    if (newPermissions.length === 0) {
      console.log("ℹ️ All permissions already exist for Super Admin");
      return;
    }

    // Add new permissions
    superAdmin.permissions = [...existingPermissions, ...newPermissions];
    await superAdmin.save();

    console.log(
      `✅ Added ${newPermissions.length} new permissions to Super Admin:`
    );
    console.log(newPermissions);
    console.log("✨ Update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating permissions:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the update
addSuperAdminPermissions().catch(console.error);
