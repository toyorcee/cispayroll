// This script will:
// 1. Create regular employees and additional admins
// 2. Set up proper onboarding states
// 3. Handle invitation tokens

import mongoose from "mongoose";
import UserModel, { UserRole, Permission } from "../models/User.js";
import Department from "../models/Department.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { generateInvitationToken } from "../utils/tokenUtils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
};

const setupEmployees = async () => {
  try {
    await connectDB();
    console.log("🚀 Starting Employees setup...");

    // 1. Get departments first
    const departments = await Department.find({});
    if (departments.length === 0) {
      throw new Error("No departments found. Please run setup-hods first.");
    }

    // 2. Create employees
    const defaultPassword = "Sbpdojddme4*";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Additional Admins (non-HODs)
    const adminEmployees = [
      {
        firstName: "Taiwo",
        lastName: "Oluwaseyi",
        email: "taiwo.oluwaseyi@company.com",
        phone: "08087654321",
        role: UserRole.ADMIN,
        department: departments.find((d) => d.code === "OPS")._id,
        employeeId: "ADM2503008",
        position: "Operations Manager",
        gradeLevel: "GL-06",
        workLocation: "HQ Floor 2",
        permissions: [
          Permission.CREATE_USER,
          Permission.EDIT_USER,
          Permission.VIEW_ALL_USERS,
          Permission.VIEW_ALL_DEPARTMENTS,
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.GENERATE_PAYSLIP,
          Permission.VIEW_REPORTS,
          Permission.APPROVE_LEAVE,
          Permission.VIEW_TEAM_LEAVE,
        ],
      },
      {
        firstName: "Chinua",
        lastName: "Achebe",
        email: "chinua.achebe@company.com",
        phone: "08076543210",
        role: UserRole.ADMIN,
        department: departments.find((d) => d.code === "SLS")._id,
        employeeId: "ADM2503009",
        position: "Sales Manager",
        gradeLevel: "GL-06",
        workLocation: "Lagos",
        permissions: [
          Permission.CREATE_USER,
          Permission.EDIT_USER,
          Permission.VIEW_ALL_USERS,
          Permission.VIEW_ALL_DEPARTMENTS,
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.GENERATE_PAYSLIP,
          Permission.VIEW_REPORTS,
          Permission.APPROVE_LEAVE,
          Permission.VIEW_TEAM_LEAVE,
        ],
      },
      // Add one admin for each remaining department...
    ];

    // Regular Employees
    const regularEmployees = [
      {
        firstName: "Amina",
        lastName: "Bello",
        email: "amina.bello@company.com",
        phone: "08012345608",
        role: UserRole.USER,
        department: departments.find((d) => d.code === "OPS")._id,
        employeeId: "EMP2503001",
        position: "Operations Analyst",
        gradeLevel: "GL-04",
        workLocation: "Lagos",
        permissions: [
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.VIEW_TEAM_LEAVE,
        ],
      },
      {
        firstName: "Olayinka",
        lastName: "Adeniyi",
        email: "olayinka.adeniyi@company.com",
        phone: "08023456709",
        role: UserRole.USER,
        department: departments.find((d) => d.code === "OPS")._id,
        employeeId: "EMP2503002",
        position: "Operations Associate",
        gradeLevel: "GL-03",
        workLocation: "Lagos",
        permissions: [
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.VIEW_TEAM_LEAVE,
        ],
      },
      {
        firstName: "Chioma",
        lastName: "Nnamdi",
        email: "chioma.nnamdi@company.com",
        phone: "08034567801",
        role: UserRole.USER,
        department: departments.find((d) => d.code === "SLS")._id,
        employeeId: "EMP2503003",
        position: "Sales Executive",
        gradeLevel: "GL-04",
        workLocation: "Lagos",
        permissions: [
          Permission.VIEW_DEPARTMENT_PAYROLL,
          Permission.VIEW_TEAM_LEAVE,
        ],
      },
      // Continue with 2-3 employees for each department...
    ];

    // Common properties for all employees
    const commonProps = {
      status: "pending",
      isEmailVerified: false,
      password: hashedPassword,
      dateJoined: new Date(),
      invitationToken: generateInvitationToken(),
      invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      emergencyContact: {
        name: "Emergency Contact",
        relationship: "Not Specified",
        phone: "00000000000",
      },
      bankDetails: {
        bankName: "Not Specified",
        accountNumber: "0000000000",
        accountName: "Not Specified",
      },
      onboarding: {
        status: "not_started",
        tasks: [
          { name: "Welcome Meeting", completed: false },
          { name: "Department Introduction", completed: false },
          { name: "System Access Setup", completed: false },
          { name: "Policy Documentation Review", completed: false },
          { name: "Initial Training Session", completed: false },
        ],
        progress: 0,
        startedAt: new Date(),
      },
    };

    // Create all employees
    const allEmployees = [...adminEmployees, ...regularEmployees].map(
      (emp) => ({
        ...emp,
        ...commonProps,
        createdBy: new mongoose.Types.ObjectId("67d7d55acccafb0fc97432ec"),
      })
    );

    console.log("👥 Creating employees...");
    const createdEmployees = await Promise.all(
      allEmployees.map((emp) => UserModel.create(emp))
    );

    // Print summary
    const summary = {
      totalEmployees: createdEmployees.length,
      admins: createdEmployees.filter((emp) => emp.role === UserRole.ADMIN)
        .length,
      regularUsers: createdEmployees.filter((emp) => emp.role === UserRole.USER)
        .length,
      byDepartment: departments.map((dept) => ({
        department: dept.name,
        employees: createdEmployees.filter(
          (emp) => emp.department.toString() === dept._id.toString()
        ).length,
      })),
    };

    console.log("\n📊 Setup Summary:", summary);
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

setupEmployees()
  .then(() => {
    console.log("🎉 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
