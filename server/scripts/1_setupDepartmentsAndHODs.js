// This script will:
// 1. Create HODs first (without departments)
// 2. Create departments with HOD references
// 3. Update HODs with their department references

import mongoose from "mongoose";
import UserModel, { UserRole, Permission } from "../models/User.js";
import Department from "../models/Department.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

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

const HOD_PERMISSIONS = [
  Permission.CREATE_USER,
  Permission.EDIT_USER,
  Permission.DELETE_USER,
  Permission.VIEW_ALL_USERS,
  Permission.VIEW_ALL_DEPARTMENTS,
  Permission.MANAGE_DEPARTMENT_USERS,
  Permission.CREATE_PAYROLL,
  Permission.EDIT_PAYROLL,
  Permission.VIEW_DEPARTMENT_PAYROLL,
  Permission.GENERATE_PAYSLIP,
  Permission.VIEW_REPORTS,
  Permission.APPROVE_LEAVE,
  Permission.VIEW_TEAM_LEAVE,
];

const departments = [
  {
    name: "Operations",
    code: "OPS",
    description: "Responsible for overseeing day-to-day business activities",
    location: "HQ Floor 3",
    status: "active",
  },
  {
    name: "Sales",
    code: "SLS",
    description: "Sales and Revenue Generation",
    location: "Lagos",
    status: "active",
  },
  {
    name: "Marketing",
    code: "MKT",
    description: "Marketing and Brand Management",
    location: "Lagos",
    status: "active",
  },
  {
    name: "Human Resources",
    code: "HR",
    description: "Human Resources Management",
    location: "Lagos",
    status: "active",
  },
  {
    name: "Finance",
    code: "FIN",
    description: "Financial Management and Planning",
    location: "Lagos",
    status: "active",
  },
  {
    name: "Engineering",
    code: "ENG",
    description: "Engineering and Product Development",
    location: "Lagos HQ, Floor 2",
    status: "active",
  },
  {
    name: "Information Technology",
    code: "IT",
    description: "IT Infrastructure and Support",
    location: "Lagos HQ, Floor 2",
    status: "active",
  },
];

const ONBOARDING_TASKS = [
  {
    name: "Welcome Meeting",
    description: "Initial welcome meeting with HR and department head",
    requiredFor: "orientation",
    estimatedDuration: "1 hour",
  },
  {
    name: "Department Introduction",
    description: "Meet team members and understand department workflow",
    requiredFor: "orientation",
    estimatedDuration: "2 hours",
  },
  {
    name: "System Access Setup",
    description: "Set up all required system access and permissions",
    requiredFor: "access",
    estimatedDuration: "4 hours",
  },
  {
    name: "Policy Documentation Review",
    description: "Review and acknowledge company policies",
    requiredFor: "compliance",
    estimatedDuration: "3 hours",
  },
  {
    name: "Initial Training Session",
    description: "Complete initial role-specific training",
    requiredFor: "training",
    estimatedDuration: "6 hours",
  },
];

const hodUsers = [
  {
    firstName: "Samuel",
    lastName: "Adebayo",
    email: "samuel.adebayo@company.com",
    phone: "08012345678",
    role: UserRole.ADMIN,
    employeeId: "ADM2503001",
    position: "Head of Operations",
    gradeLevel: "GL-07",
    workLocation: "HQ Floor 3",
    region: "Southwest",
    status: "pending",
    isEmailVerified: false,
    invitationToken: uuidv4(), // For tracking invitation
    invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    onboardingState: {
      currentStep: "INVITED", // INVITED -> REGISTERED -> ONBOARDING -> ACTIVE -> OFFBOARDING
      lastUpdated: new Date(),
      history: [
        {
          step: "INVITED",
          timestamp: new Date(),
          details: "Initial user creation and invitation sent",
        },
      ],
    },
    onboarding: {
      status: "not_started",
      tasks: [
        {
          name: "Welcome Meeting",
          completed: false,
          requiredFor: "orientation",
          deadline: null, // Set when onboarding starts
          completedAt: null,
        },
        {
          name: "Department Introduction",
          completed: false,
          requiredFor: "orientation",
          deadline: null,
          completedAt: null,
        },
        {
          name: "System Access Setup",
          completed: false,
          requiredFor: "access",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Policy Documentation Review",
          completed: false,
          requiredFor: "compliance",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Initial Training Session",
          completed: false,
          requiredFor: "training",
          deadline: null,
          completedAt: null,
        },
      ],
      progress: 0,
      startedAt: null,
      expectedCompletionDate: null,
      actualCompletionDate: null,
      lastUpdated: new Date(),
    },
    permissions: HOD_PERMISSIONS,
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
  },
  {
    firstName: "Olayinka",
    lastName: "Ogunleye",
    email: "olayinka.ogunleye@company.com",
    phone: "08023456789",
    role: UserRole.ADMIN,
    employeeId: "ADM2503002",
    position: "Head of Sales",
    gradeLevel: "GL-07",
    workLocation: "Lagos",
    region: "Southwest",
    status: "pending",
    isEmailVerified: false,
    invitationToken: uuidv4(), // For tracking invitation
    invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    onboardingState: {
      currentStep: "INVITED", // INVITED -> REGISTERED -> ONBOARDING -> ACTIVE -> OFFBOARDING
      lastUpdated: new Date(),
      history: [
        {
          step: "INVITED",
          timestamp: new Date(),
          details: "Initial user creation and invitation sent",
        },
      ],
    },
    onboarding: {
      status: "not_started",
      tasks: [
        {
          name: "Welcome Meeting",
          completed: false,
          requiredFor: "orientation",
          deadline: null, // Set when onboarding starts
          completedAt: null,
        },
        {
          name: "Department Introduction",
          completed: false,
          requiredFor: "orientation",
          deadline: null,
          completedAt: null,
        },
        {
          name: "System Access Setup",
          completed: false,
          requiredFor: "access",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Policy Documentation Review",
          completed: false,
          requiredFor: "compliance",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Initial Training Session",
          completed: false,
          requiredFor: "training",
          deadline: null,
          completedAt: null,
        },
      ],
      progress: 0,
      startedAt: null,
      expectedCompletionDate: null,
      actualCompletionDate: null,
      lastUpdated: new Date(),
    },
    permissions: HOD_PERMISSIONS,
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
  },
  {
    firstName: "Chidinma",
    lastName: "Okafor",
    email: "chidinma.okafor@company.com",
    phone: "08034567890",
    role: UserRole.ADMIN,
    employeeId: "ADM2503003",
    position: "Head of Marketing",
    gradeLevel: "GL-07",
    workLocation: "Lagos",
    region: "Southwest",
    status: "pending",
    isEmailVerified: false,
    invitationToken: uuidv4(), // For tracking invitation
    invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    onboardingState: {
      currentStep: "INVITED", // INVITED -> REGISTERED -> ONBOARDING -> ACTIVE -> OFFBOARDING
      lastUpdated: new Date(),
      history: [
        {
          step: "INVITED",
          timestamp: new Date(),
          details: "Initial user creation and invitation sent",
        },
      ],
    },
    onboarding: {
      status: "not_started",
      tasks: [
        {
          name: "Welcome Meeting",
          completed: false,
          requiredFor: "orientation",
          deadline: null, // Set when onboarding starts
          completedAt: null,
        },
        {
          name: "Department Introduction",
          completed: false,
          requiredFor: "orientation",
          deadline: null,
          completedAt: null,
        },
        {
          name: "System Access Setup",
          completed: false,
          requiredFor: "access",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Policy Documentation Review",
          completed: false,
          requiredFor: "compliance",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Initial Training Session",
          completed: false,
          requiredFor: "training",
          deadline: null,
          completedAt: null,
        },
      ],
      progress: 0,
      startedAt: null,
      expectedCompletionDate: null,
      actualCompletionDate: null,
      lastUpdated: new Date(),
    },
    permissions: HOD_PERMISSIONS,
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
  },
  {
    firstName: "Aisha",
    lastName: "Ibrahim",
    email: "aisha.ibrahim@company.com",
    phone: "08045678901",
    role: UserRole.ADMIN,
    employeeId: "ADM2503004",
    position: "Head of HR",
    gradeLevel: "GL-07",
    workLocation: "Lagos",
    region: "Southwest",
    status: "pending",
    isEmailVerified: false,
    invitationToken: uuidv4(), // For tracking invitation
    invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    onboardingState: {
      currentStep: "INVITED", // INVITED -> REGISTERED -> ONBOARDING -> ACTIVE -> OFFBOARDING
      lastUpdated: new Date(),
      history: [
        {
          step: "INVITED",
          timestamp: new Date(),
          details: "Initial user creation and invitation sent",
        },
      ],
    },
    onboarding: {
      status: "not_started",
      tasks: [
        {
          name: "Welcome Meeting",
          completed: false,
          requiredFor: "orientation",
          deadline: null, // Set when onboarding starts
          completedAt: null,
        },
        {
          name: "Department Introduction",
          completed: false,
          requiredFor: "orientation",
          deadline: null,
          completedAt: null,
        },
        {
          name: "System Access Setup",
          completed: false,
          requiredFor: "access",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Policy Documentation Review",
          completed: false,
          requiredFor: "compliance",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Initial Training Session",
          completed: false,
          requiredFor: "training",
          deadline: null,
          completedAt: null,
        },
      ],
      progress: 0,
      startedAt: null,
      expectedCompletionDate: null,
      actualCompletionDate: null,
      lastUpdated: new Date(),
    },
    permissions: HOD_PERMISSIONS,
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
  },
  {
    firstName: "Oluwaseun",
    lastName: "Adeleke",
    email: "oluwaseun.adeleke@company.com",
    phone: "08056789012",
    role: UserRole.ADMIN,
    employeeId: "ADM2503005",
    position: "Head of Finance",
    gradeLevel: "GL-07",
    workLocation: "Lagos",
    region: "Southwest",
    status: "pending",
    isEmailVerified: false,
    invitationToken: uuidv4(), // For tracking invitation
    invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    onboardingState: {
      currentStep: "INVITED", // INVITED -> REGISTERED -> ONBOARDING -> ACTIVE -> OFFBOARDING
      lastUpdated: new Date(),
      history: [
        {
          step: "INVITED",
          timestamp: new Date(),
          details: "Initial user creation and invitation sent",
        },
      ],
    },
    onboarding: {
      status: "not_started",
      tasks: [
        {
          name: "Welcome Meeting",
          completed: false,
          requiredFor: "orientation",
          deadline: null, // Set when onboarding starts
          completedAt: null,
        },
        {
          name: "Department Introduction",
          completed: false,
          requiredFor: "orientation",
          deadline: null,
          completedAt: null,
        },
        {
          name: "System Access Setup",
          completed: false,
          requiredFor: "access",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Policy Documentation Review",
          completed: false,
          requiredFor: "compliance",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Initial Training Session",
          completed: false,
          requiredFor: "training",
          deadline: null,
          completedAt: null,
        },
      ],
      progress: 0,
      startedAt: null,
      expectedCompletionDate: null,
      actualCompletionDate: null,
      lastUpdated: new Date(),
    },
    permissions: HOD_PERMISSIONS,
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
  },
  {
    firstName: "Chukwudi",
    lastName: "Eze",
    email: "chukwudi.eze@company.com",
    phone: "08067890123",
    role: UserRole.ADMIN,
    employeeId: "ADM2503006",
    position: "Head of Engineering",
    gradeLevel: "GL-07",
    workLocation: "Lagos HQ, Floor 2",
    region: "Southwest",
    status: "pending",
    isEmailVerified: false,
    invitationToken: uuidv4(), // For tracking invitation
    invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    onboardingState: {
      currentStep: "INVITED", // INVITED -> REGISTERED -> ONBOARDING -> ACTIVE -> OFFBOARDING
      lastUpdated: new Date(),
      history: [
        {
          step: "INVITED",
          timestamp: new Date(),
          details: "Initial user creation and invitation sent",
        },
      ],
    },
    onboarding: {
      status: "not_started",
      tasks: [
        {
          name: "Welcome Meeting",
          completed: false,
          requiredFor: "orientation",
          deadline: null, // Set when onboarding starts
          completedAt: null,
        },
        {
          name: "Department Introduction",
          completed: false,
          requiredFor: "orientation",
          deadline: null,
          completedAt: null,
        },
        {
          name: "System Access Setup",
          completed: false,
          requiredFor: "access",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Policy Documentation Review",
          completed: false,
          requiredFor: "compliance",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Initial Training Session",
          completed: false,
          requiredFor: "training",
          deadline: null,
          completedAt: null,
        },
      ],
      progress: 0,
      startedAt: null,
      expectedCompletionDate: null,
      actualCompletionDate: null,
      lastUpdated: new Date(),
    },
    permissions: HOD_PERMISSIONS,
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
  },
  {
    firstName: "Folake",
    lastName: "Ajayi",
    email: "folake.ajayi@company.com",
    phone: "08078901234",
    role: UserRole.ADMIN,
    employeeId: "ADM2503007",
    position: "Head of IT",
    gradeLevel: "GL-07",
    workLocation: "Lagos HQ, Floor 2",
    region: "Southwest",
    status: "pending",
    isEmailVerified: false,
    invitationToken: uuidv4(), // For tracking invitation
    invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    onboardingState: {
      currentStep: "INVITED", // INVITED -> REGISTERED -> ONBOARDING -> ACTIVE -> OFFBOARDING
      lastUpdated: new Date(),
      history: [
        {
          step: "INVITED",
          timestamp: new Date(),
          details: "Initial user creation and invitation sent",
        },
      ],
    },
    onboarding: {
      status: "not_started",
      tasks: [
        {
          name: "Welcome Meeting",
          completed: false,
          requiredFor: "orientation",
          deadline: null, // Set when onboarding starts
          completedAt: null,
        },
        {
          name: "Department Introduction",
          completed: false,
          requiredFor: "orientation",
          deadline: null,
          completedAt: null,
        },
        {
          name: "System Access Setup",
          completed: false,
          requiredFor: "access",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Policy Documentation Review",
          completed: false,
          requiredFor: "compliance",
          deadline: null,
          completedAt: null,
        },
        {
          name: "Initial Training Session",
          completed: false,
          requiredFor: "training",
          deadline: null,
          completedAt: null,
        },
      ],
      progress: 0,
      startedAt: null,
      expectedCompletionDate: null,
      actualCompletionDate: null,
      lastUpdated: new Date(),
    },
    permissions: HOD_PERMISSIONS,
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
  },
].map((hod) => ({
  ...hod,
  trackingId: uuidv4(), // Unique ID for tracking entire lifecycle
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const setupDepartmentsAndHODs = async () => {
  try {
    await connectDB();
    console.log("🚀 Starting HODs and Departments setup...");

    // 1. Create HODs first
    const defaultPassword = "Sbpdojddme4*";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const processedHODs = hodUsers.map((hod) => ({
      ...hod,
      password: hashedPassword,
      trackingId: uuidv4(),
      onboardingState: {
        currentStep: "INVITED",
        lastUpdated: new Date(),
        history: [
          {
            step: "INVITED",
            timestamp: new Date(),
            details: "Initial HOD creation",
          },
        ],
      },
      onboarding: {
        status: "not_started",
        tasks: ONBOARDING_TASKS.map((task) => ({
          ...task,
          completed: false,
          deadline: null,
          completedAt: null,
          notes: [],
        })),
        progress: 0,
        startedAt: null,
        expectedCompletionDate: null,
      },
    }));

    const createdHODs = await Promise.all(
      processedHODs.map((hod) =>
        UserModel.create({
          ...hod,
          createdBy: new mongoose.Types.ObjectId("67d7d55acccafb0fc97432ec"),
        })
      )
    );

    // 2. Create departments
    const createdDepartments = await Promise.all(
      departments.map((dept, index) =>
        Department.create({
          ...dept,
          headOfDepartment: createdHODs[index]._id,
          createdBy: new mongoose.Types.ObjectId("67d7d55acccafb0fc97432ec"),
          updatedBy: new mongoose.Types.ObjectId("67d7d55acccafb0fc97432ec"),
          trackingId: uuidv4(),
          status: "active",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      )
    );

    // 3. Update HODs with department references
    await Promise.all(
      createdHODs.map((hod, index) =>
        UserModel.findByIdAndUpdate(
          hod._id,
          {
            department: createdDepartments[index]._id,
            "onboardingState.history": {
              $push: {
                step: "DEPARTMENT_ASSIGNED",
                timestamp: new Date(),
                details: `Assigned as head of ${departments[index].name}`,
              },
            },
          },
          { new: true }
        )
      )
    );

    console.log("✅ Setup completed successfully!");

    // Print detailed summary
    const summary = {
      departments: createdDepartments.length,
      hods: createdHODs.length,
      onboardingStatus: createdHODs.map((hod) => ({
        name: `${hod.firstName} ${hod.lastName}`,
        department: departments.find((d) => d.headOfDepartment.equals(hod._id))
          ?.name,
        currentState: hod.onboardingState.currentStep,
        invitationStatus: hod.isEmailVerified ? "Verified" : "Pending",
      })),
    };

    console.log("\n📊 Setup Summary:", JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

setupDepartmentsAndHODs()
  .then(() => {
    console.log("🎉 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
