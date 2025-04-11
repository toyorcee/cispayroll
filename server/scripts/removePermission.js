import mongoose from "mongoose";
import User from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function removePermission() {
  try {
    console.log("🔄 Starting permission removal...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find the super admin account
    const superAdmin = await User.findById("67d7d55acccafb0fc97432ec");

    if (!superAdmin) {
      console.log("❌ Super admin user not found");
      return;
    }

    console.log(
      `Found user: ${superAdmin.firstName} ${superAdmin.lastName} (${superAdmin.employeeId})`
    );
    console.log("Current permissions:", superAdmin.permissions);

    // Store original permissions for potential rollback
    const originalPermissions = [...superAdmin.permissions];

    // Remove the specific permission
    const permissionToRemove = "VIEW_OWN_PAYSLIP"; // Replace with the permission you want to remove
    superAdmin.permissions = superAdmin.permissions.filter(
      (p) => p !== permissionToRemove
    );

    await superAdmin.save();
    console.log(`✅ Removed ${permissionToRemove} permission`);
    console.log("Updated permissions:", superAdmin.permissions);

    // Save the original permissions to a file for potential rollback
    const fs = await import("fs");
    fs.writeFileSync(
      "permission_backup.json",
      JSON.stringify(
        {
          userId: superAdmin._id,
          originalPermissions,
          timestamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
    console.log("💾 Backup saved to permission_backup.json");

    console.log("✨ Update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating user:", error);
    process.exit(1);
  } finally {
    // Close the MongoDB connection
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the update
removePermission().catch(console.error);
