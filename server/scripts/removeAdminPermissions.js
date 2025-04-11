import mongoose from "mongoose";
import User from "../models/User.js";
import { UserRole, Permission } from "../models/User.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Define the correct permissions for ADMIN role
const correctAdminPermissions = [
  // Dashboard Access
  Permission.VIEW_DASHBOARD,

  // User Management (User-level only)
  Permission.CREATE_USER,
  Permission.EDIT_USER,
  Permission.DELETE_USER,
  Permission.VIEW_ALL_USERS,

  // Department Management
  Permission.VIEW_ALL_DEPARTMENTS,
  Permission.MANAGE_DEPARTMENT_USERS,
  Permission.VIEW_DEPARTMENT_STATS,

  // Payroll Management
  Permission.CREATE_PAYROLL,
  Permission.EDIT_PAYROLL,
  Permission.DELETE_PAYROLL,
  Permission.SUBMIT_PAYROLL,
  Permission.APPROVE_PAYROLL,
  Permission.VIEW_DEPARTMENT_PAYROLL,
  Permission.GENERATE_PAYSLIP,
  Permission.VIEW_REPORTS,
  Permission.VIEW_DEPARTMENT_PAYSLIPS,
  Permission.PROCESS_PAYMENT,
  Permission.MARK_PAYMENT_FAILED,
  Permission.VIEW_PAYMENT_HISTORY,
  Permission.MANAGE_PAYMENT_METHODS,

  // Leave Management
  Permission.APPROVE_LEAVE,
  Permission.VIEW_TEAM_LEAVE,

  // Basic Permissions
  Permission.VIEW_PERSONAL_INFO,
  Permission.EDIT_PERSONAL_INFO,
  Permission.REQUEST_LEAVE,
  Permission.VIEW_OWN_LEAVE,
  Permission.CANCEL_OWN_LEAVE,

  // Employee Lifecycle Management
  Permission.VIEW_ONBOARDING,
  Permission.MANAGE_ONBOARDING,
  Permission.VIEW_OFFBOARDING,
  Permission.MANAGE_OFFBOARDING,

  // Salary Structure Management
  Permission.VIEW_SALARY_STRUCTURE,
  Permission.EDIT_SALARY_STRUCTURE,

  // Allowances Management
  Permission.VIEW_ALLOWANCES,
  Permission.EDIT_ALLOWANCES,
  Permission.CREATE_ALLOWANCES,
  Permission.DELETE_ALLOWANCES,
  Permission.APPROVE_ALLOWANCES,
  Permission.VIEW_OWN_ALLOWANCES,
  Permission.REQUEST_ALLOWANCES,

  // Deductions Management
  Permission.VIEW_DEDUCTIONS,
  Permission.EDIT_DEDUCTIONS,

  // Bonuses Management
  Permission.MANAGE_BONUSES,
  Permission.VIEW_BONUSES,
  Permission.EDIT_BONUSES,
  Permission.CREATE_BONUSES,
  Permission.DELETE_BONUSES,
  Permission.MANAGE_OVERTIME,
  Permission.VIEW_OWN_BONUS,

  // Reports & Analytics
  Permission.VIEW_PAYROLL_REPORTS,
  Permission.VIEW_EMPLOYEE_REPORTS,
  Permission.VIEW_TAX_REPORTS,

  // Settings Management (Limited)
  Permission.MANAGE_DEPARTMENT_SETTINGS,
  Permission.MANAGE_USER_SETTINGS,
  Permission.MANAGE_NOTIFICATION_SETTINGS,
  Permission.MANAGE_LEAVE_SETTINGS,
  Permission.MANAGE_SYSTEM_SETTINGS,
  Permission.MANAGE_PAYROLL_SETTINGS,
  Permission.MANAGE_DOCUMENT_SETTINGS,

  // New permissions
  Permission.MANAGE_DEPARTMENT_DEDUCTIONS,
  Permission.VIEW_DEPARTMENT_DEDUCTIONS,

  // Add the new department-specific permissions
  Permission.MANAGE_DEPARTMENT_ALLOWANCES,
  Permission.VIEW_DEPARTMENT_ALLOWANCES,
  Permission.MANAGE_DEPARTMENT_BONUSES,
  Permission.VIEW_DEPARTMENT_BONUSES,
];

async function updateAdminPermissions() {
  try {
    console.log("🔄 Starting admin permissions update...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("📡 Connected to MongoDB");

    // Find all ADMIN users
    const adminUsers = await User.find({ role: UserRole.ADMIN });
    console.log(`Found ${adminUsers.length} ADMIN users`);

    // Update each admin's permissions
    for (const admin of adminUsers) {
      console.log(
        `\nProcessing admin: ${admin.firstName} ${admin.lastName} (${admin.employeeId})`
      );
      console.log("Current permissions:", admin.permissions);

      // Store original permissions for backup
      const originalPermissions = [...admin.permissions];

      // Update permissions using findByIdAndUpdate to avoid validation
      const updatedAdmin = await User.findByIdAndUpdate(
        admin._id,
        { $set: { permissions: correctAdminPermissions } },
        { new: true }
      );

      console.log("✅ Updated permissions successfully");
      console.log("New permissions:", updatedAdmin.permissions);

      // Save backup
      const fs = await import("fs");
      const backupDir = "./backups";
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
      }
      fs.writeFileSync(
        `${backupDir}/admin_${admin._id}_backup.json`,
        JSON.stringify(
          {
            userId: admin._id,
            employeeId: admin.employeeId,
            originalPermissions,
            timestamp: new Date().toISOString(),
          },
          null,
          2
        )
      );
      console.log(`💾 Backup saved for ${admin.employeeId}`);
    }

    console.log("\n✨ Admin permissions update completed successfully!");
  } catch (error) {
    console.error("❌ Error updating admin permissions:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📝 Database connection closed");
  }
}

// Run the update
updateAdminPermissions().catch(console.error);
