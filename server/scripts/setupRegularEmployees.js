import mongoose from "mongoose";
import UserModel from "../models/User.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env") });

const employees = [
  // HR Department (2 employees)
  {
    firstName: "Blessing",
    lastName: "Okonkwo",
    email: "blessing.okonkwo@company.com",
    phone: "+234 811 234 5678",
    role: "USER",
    employeeId: "EMP2503001",
    position: "HR Officer",
    gradeLevel: "GL-04",
    workLocation: "HQ-2F-HR",
    dateJoined: "2024-01-01",
    department: "67e9bb7445f1b853da500821",
  },
  {
    firstName: "John",
    lastName: "Adewale",
    email: "john.adewale@company.com",
    phone: "+234 812 234 5678",
    role: "USER",
    employeeId: "EMP2503002",
    position: "HR Assistant",
    gradeLevel: "GL-02",
    workLocation: "HQ-2F-HR",
    dateJoined: "2024-01-01",
    department: "67e9bb7445f1b853da500821",
  },

  // Legal and Compliance (2 employees)
  {
    firstName: "Grace",
    lastName: "Eze",
    email: "grace.eze@company.com",
    phone: "+234 813 234 5678",
    role: "USER",
    employeeId: "LEG2503001",
    position: "Legal Officer",
    gradeLevel: "GL-05",
    workLocation: "HQ-2F-LEG",
    dateJoined: "2024-01-01",
    department: "67e9dceac6a350a3b61a7333",
  },
  {
    firstName: "Mohammed",
    lastName: "Ibrahim",
    email: "mohammed.ibrahim@company.com",
    phone: "+234 814 234 5678",
    role: "USER",
    employeeId: "LEG2503002",
    position: "Compliance Assistant",
    gradeLevel: "GL-03",
    workLocation: "HQ-2F-LEG",
    dateJoined: "2024-01-01",
    department: "67e9dceac6a350a3b61a7333",
  },

  // Quality Assurance (2 employees)
  {
    firstName: "Fatima",
    lastName: "Suleiman",
    email: "fatima.suleiman@company.com",
    phone: "+234 815 234 5678",
    role: "USER",
    employeeId: "QA2503001",
    position: "QA Engineer",
    gradeLevel: "GL-06",
    workLocation: "HQ-3F-QA",
    dateJoined: "2024-01-01",
    department: "67e9dcdcc6a350a3b61a732f",
  },
  {
    firstName: "David",
    lastName: "Okafor",
    email: "david.okafor@company.com",
    phone: "+234 816 234 5678",
    role: "USER",
    employeeId: "QA2503002",
    position: "QA Tester",
    gradeLevel: "GL-04",
    workLocation: "HQ-3F-QA",
    dateJoined: "2024-01-01",
    department: "67e9dcdcc6a350a3b61a732f",
  },

  // Research and Development (2 employees)
  {
    firstName: "Yetunde",
    lastName: "Adeleke",
    email: "yetunde.adeleke@company.com",
    phone: "+234 817 234 5678",
    role: "USER",
    employeeId: "RND2503001",
    position: "Research Analyst",
    gradeLevel: "GL-05",
    workLocation: "HQ-5F-RND",
    dateJoined: "2024-01-01",
    department: "67e9dcd2c6a350a3b61a732b",
  },
  {
    firstName: "Emeka",
    lastName: "Nnamdi",
    email: "emeka.nnamdi@company.com",
    phone: "+234 818 234 5678",
    role: "USER",
    employeeId: "RND2503002",
    position: "Research Assistant",
    gradeLevel: "GL-03",
    workLocation: "HQ-5F-RND",
    dateJoined: "2024-01-01",
    department: "67e9dcd2c6a350a3b61a732b",
  },

  // Customer Service (2 employees)
  {
    firstName: "Aisha",
    lastName: "Bello",
    email: "aisha.bello@company.com",
    phone: "+234 819 234 5678",
    role: "USER",
    employeeId: "CS2503001",
    position: "Customer Service Lead",
    gradeLevel: "GL-05",
    workLocation: "HQ-GF-CS",
    dateJoined: "2024-01-01",
    department: "67e9dcc8c6a350a3b61a7327",
  },
  {
    firstName: "Oluwaseun",
    lastName: "Adeyemi",
    email: "oluwaseun.adeyemi@company.com",
    phone: "+234 820 234 5678",
    role: "USER",
    employeeId: "CS2503002",
    position: "Customer Service Rep",
    gradeLevel: "GL-02",
    workLocation: "HQ-GF-CS",
    dateJoined: "2024-01-01",
    department: "67e9dcc8c6a350a3b61a7327",
  },

  // Sales and Marketing (2 employees)
  {
    firstName: "Chinua",
    lastName: "Achebe",
    email: "chinua.achebe@company.com",
    phone: "+234 821 234 5678",
    role: "USER",
    employeeId: "SAM2503001",
    position: "Sales Executive",
    gradeLevel: "GL-06",
    workLocation: "HQ-4F-SAM",
    dateJoined: "2024-01-01",
    department: "67e9dcb7c6a350a3b61a7323",
  },
  {
    firstName: "Zainab",
    lastName: "Hassan",
    email: "zainab.hassan@company.com",
    phone: "+234 822 234 5678",
    role: "USER",
    employeeId: "SAM2503002",
    position: "Marketing Assistant",
    gradeLevel: "GL-03",
    workLocation: "HQ-4F-SAM",
    dateJoined: "2024-01-01",
    department: "67e9dcb7c6a350a3b61a7323",
  },

  // Operations (2 employees)
  {
    firstName: "Tunde",
    lastName: "Bakare",
    email: "tunde.bakare@company.com",
    phone: "+234 823 234 5678",
    role: "USER",
    employeeId: "OPS2503001",
    position: "Operations Supervisor",
    gradeLevel: "GL-06",
    workLocation: "HQ-GF-OPS",
    dateJoined: "2024-01-01",
    department: "67e9dcadc6a350a3b61a731f",
  },
  {
    firstName: "Chidinma",
    lastName: "Ekwueme",
    email: "chidinma.ekwueme@company.com",
    phone: "+234 824 234 5678",
    role: "USER",
    employeeId: "OPS2503002",
    position: "Operations Assistant",
    gradeLevel: "GL-02",
    workLocation: "HQ-GF-OPS",
    dateJoined: "2024-01-01",
    department: "67e9dcadc6a350a3b61a731f",
  },

  // IT Department (2 employees)
  {
    firstName: "Babajide",
    lastName: "Ogunleye",
    email: "babajide.ogunleye@company.com",
    phone: "+234 825 234 5678",
    role: "USER",
    employeeId: "IT2503001",
    position: "Software Engineer",
    gradeLevel: "GL-06",
    workLocation: "HQ-3F-IT",
    dateJoined: "2024-01-01",
    department: "67e9dc94c6a350a3b61a731b",
  },
  {
    firstName: "Halima",
    lastName: "Abubakar",
    email: "halima.abubakar@company.com",
    phone: "+234 826 234 5678",
    role: "USER",
    employeeId: "IT2503002",
    position: "IT Support",
    gradeLevel: "GL-03",
    workLocation: "HQ-3F-IT",
    dateJoined: "2024-01-01",
    department: "67e9dc94c6a350a3b61a731b",
  },
];

const setupEmployees = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🚀 Starting employees setup...");

    const defaultPassword = "Password123!";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create employees one by one to trigger middleware
    const createdEmployees = await Promise.all(
      employees.map(async (employee) => {
        const newEmployee = new UserModel({
          ...employee,
          password: hashedPassword,
          status: "pending",
          isEmailVerified: false,
          invitationToken: uuidv4(),
          invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          createdBy: "67d7d55acccafb0fc97432ec",
          updatedBy: "67d7d55acccafb0fc97432ec",
        });
        return newEmployee.save();
      })
    );

    console.log("✅ Employees setup completed successfully!");
    console.log(`📊 Created ${createdEmployees.length} new employees`);

    await mongoose.disconnect();
    return createdEmployees;
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
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
