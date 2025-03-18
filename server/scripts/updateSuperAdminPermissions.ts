import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";
import { Permission, UserRole } from "../models/User.js";

dotenv.config();

async function updateSuperAdminPermissions() {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log("Connected to MongoDB");

    const superAdmin = await User.findOne({
      _id: "67d0102d3d228e99d6650da5",
      role: UserRole.SUPER_ADMIN,
    });

    if (!superAdmin) {
      console.error("Super admin not found");
      return;
    }

    // Get all existing permissions
    const existingPermissions = new Set(superAdmin.permissions);

    // Add new permissions
    const newPermissions = [
      Permission.MANAGE_SALARY_STRUCTURE,
      Permission.VIEW_SALARY_STRUCTURE,
      Permission.EDIT_SALARY_STRUCTURE,
      Permission.MANAGE_DEDUCTIONS,
      Permission.VIEW_DEDUCTIONS,
      Permission.EDIT_DEDUCTIONS,
      Permission.MANAGE_ALLOWANCES,
      Permission.VIEW_ALLOWANCES,
      Permission.EDIT_ALLOWANCES,
      Permission.MANAGE_BONUSES,
      Permission.VIEW_BONUSES,
      Permission.EDIT_BONUSES,
      Permission.MANAGE_OVERTIME,
      Permission.VIEW_PAYROLL_STATS,
      Permission.MANAGE_SYSTEM,
      Permission.VIEW_SYSTEM_HEALTH,
      Permission.VIEW_AUDIT_LOGS,
      Permission.VIEW_PAYROLL_REPORTS,
      Permission.VIEW_EMPLOYEE_REPORTS,
      Permission.VIEW_TAX_REPORTS,
      Permission.MANAGE_TAX_CONFIG,
      Permission.MANAGE_COMPLIANCE,
      Permission.MANAGE_NOTIFICATIONS,
      Permission.MANAGE_INTEGRATIONS,
      Permission.MANAGE_DOCUMENTS,
      Permission.EDIT_PERSONAL_INFO,
    ];

    // Combine existing and new permissions, removing duplicates
    const updatedPermissions = [
      ...new Set([...existingPermissions, ...newPermissions]),
    ];

    // Update the user
    superAdmin.permissions = updatedPermissions;
    await superAdmin.save();

    console.log("Before update permissions count:", existingPermissions.size);
    console.log("After update permissions count:", updatedPermissions.length);
    console.log("Updated permissions:", updatedPermissions);
  } catch (error) {
    console.error("Error updating super admin permissions:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

updateSuperAdminPermissions();
