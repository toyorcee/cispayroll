import mongoose from "mongoose";
import UserModel, { UserRole, Permission } from "../models/User.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

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

const hodUsers = [
  {
    firstName: "Samuel",
    lastName: "Adebayo",
    email: "samuel.adebayo@company.com",
    phone: "+234 801 234 5678",
    role: "ADMIN",
    position: "Head of Legal and Compliance",
    gradeLevel: "GL-07",
    workLocation: "HQ-2F-LEG",
    dateJoined: "2024-01-01",
    department: "67e9dceac6a350a3b61a7333",
  },
  {
    firstName: "Chioma",
    lastName: "Nnamdi",
    email: "chioma.nnamdi@company.com",
    phone: "+234 802 345 6789",
    role: "ADMIN",
    position: "Head of Quality Assurance",
    gradeLevel: "GL-07",
    workLocation: "HQ-3F-QA",
    dateJoined: "2024-01-01",
    department: "67e9dcdcc6a350a3b61a732f",
  },
  {
    firstName: "Ibrahim",
    lastName: "Musa",
    email: "ibrahim.musa@company.com",
    phone: "+234 803 456 7890",
    role: "ADMIN",
    position: "Head of Research and Development",
    gradeLevel: "GL-07",
    workLocation: "HQ-5F-RND",
    dateJoined: "2024-01-01",
    department: "67e9dcd2c6a350a3b61a732b",
  },
  {
    firstName: "Folake",
    lastName: "Ogunleye",
    email: "folake.ogunleye@company.com",
    phone: "+234 804 567 8901",
    role: "ADMIN",
    position: "Head of Customer Service",
    gradeLevel: "GL-07",
    workLocation: "HQ-GF-CS",
    dateJoined: "2024-01-01",
    department: "67e9dcc8c6a350a3b61a7327",
  },
  {
    firstName: "Victor",
    lastName: "Okafor",
    email: "victor.okafor@company.com",
    phone: "+234 805 678 9012",
    role: "ADMIN",
    position: "Head of Sales and Marketing",
    gradeLevel: "GL-07",
    workLocation: "HQ-4F-SAM",
    dateJoined: "2024-01-01",
    department: "67e9dcb7c6a350a3b61a7323",
  },
  {
    firstName: "Amina",
    lastName: "Yusuf",
    email: "amina.yusuf@company.com",
    phone: "+234 806 789 0123",
    role: "ADMIN",
    position: "Head of Operations",
    gradeLevel: "GL-07",
    workLocation: "HQ-GF-OPS",
    dateJoined: "2024-01-01",
    department: "67e9dcadc6a350a3b61a731f",
  },
  {
    firstName: "Chidi",
    lastName: "Okoro",
    email: "chidi.okoro@company.com",
    phone: "+234 807 890 1234",
    role: "ADMIN",
    position: "Head of IT",
    gradeLevel: "GL-07",
    workLocation: "HQ-3F-IT",
    dateJoined: "2024-01-01",
    department: "67e9dc94c6a350a3b61a731b",
  },
  {
    firstName: "Aisha",
    lastName: "Mohammed",
    email: "aisha.mohammed@company.com",
    phone: "+234 808 901 2345",
    role: "ADMIN",
    position: "Head of Finance",
    gradeLevel: "GL-07",
    workLocation: "HQ-1F-FIN",
    dateJoined: "2024-01-01",
    department: "67e9dc77c6a350a3b61a7317",
  },
];

const setupRemainingHODs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 Starting remaining HODs setup...");

    const defaultPassword = "Password123!";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create HODs one by one to trigger middleware
    const createdHODs = await Promise.all(
      hodUsers.map(async (hod) => {
        const newHOD = new UserModel({
          ...hod,
          password: hashedPassword,
          status: "pending",
          isEmailVerified: false,
          invitationToken: uuidv4(),
          invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdBy: "67d7d55acccafb0fc97432ec",
          updatedBy: "67d7d55acccafb0fc97432ec",
        });
        return newHOD.save();
      })
    );

    console.log("✅ HODs setup completed successfully!");
    console.log(`📊 Created ${createdHODs.length} new HODs`);

    await mongoose.disconnect();
    return createdHODs;
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  }
};

setupRemainingHODs()
  .then(() => {
    console.log("🎉 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
