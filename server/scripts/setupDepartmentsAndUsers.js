import mongoose from "mongoose";
import UserModel, { UserRole, Permission } from "../models/User.js";
import Department from "../models/Department.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";

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

const validateSetup = async (hodUsers, employees) => {
  const superAdmin = await UserModel.findById(
    new mongoose.Types.ObjectId("67d7d55acccafb0fc97432ec")
  );
  if (!superAdmin) {
    throw new Error("Super Admin not found! Please ensure super admin exists before running setup.");
  }

  const employeeIds = [...hodUsers, ...employees].map((u) => u.employeeId);
  if (new Set(employeeIds).size !== employeeIds.length) {
    throw new Error("Duplicate employee IDs found!");
  }

  const emails = [...hodUsers, ...employees].map((u) => u.email);
  if (new Set(emails).size !== emails.length) {
    throw new Error("Duplicate emails found!");
  }
};

const setupDepartmentsAndUsers = async () => {
  try {
    await connectDB();
    console.log("🚀 Starting setup process...");

    // 1. Clean existing data while preserving super admin
    await UserModel.deleteMany({
      _id: { $ne: new mongoose.Types.ObjectId("67d7d55acccafb0fc97432ec") },
      role: { $in: [UserRole.ADMIN, UserRole.USER] },
    });
    await Department.deleteMany({});

    // 2. Create departments first
    const departmentData = [
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
        description: "Sales Department",
        location: "Lagos",
        status: "active",
      },
      {
        name: "Marketing",
        code: "MKT",
        description: "Marketing Department",
        location: "Lagos",
        status: "active",
      },
      {
        name: "HR",
        code: "HR",
        description: "Human Resources Department",
        location: "Lagos",
        status: "active",
      },
      {
        name: "Finance",
        code: "FIN",
        description: "Finance Department",
        location: "Lagos",
        status: "active",
      },
      {
        name: "Engineering",
        code: "ENG",
        description: "Engineering Department",
        location: "Lagos HQ, Floor 2",
        status: "active",
      },
    ];

    console.log("🏢 Creating departments...");
    const createdDepartments = await Promise.all(
      departmentData.map((dept) =>
        Department.create({
          ...dept,
          createdBy: new mongoose.Types.ObjectId("67d7d55acccafb0fc97432ec"),
          updatedBy: new mongoose.Types.ObjectId("67d7d55acccafb0fc97432ec"),
        })
      )
    );

    // 3. Create HODs with department references
    const defaultPassword = "Sbpdojddme4*";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    const hodUsers = [
      {
        firstName: "Samuel",
        lastName: "Adebayo",
        email: "samuel.adebayo@company.com",
        phone: "08012345678",
        role: UserRole.ADMIN,
        employeeId: "EMP2503011",
        position: "Head of Operations",
        gradeLevel: "GL-07",
        workLocation: "HQ Floor 3",
        department: createdDepartments[0]._id,
      },
      {
        firstName: "Ekong",
        lastName: "Udoh",
        email: "ekong.udoh@company.com",
        phone: "08023456789",
        role: UserRole.ADMIN,
        employeeId: "ADM2503002",
        position: "Head of Sales",
        gradeLevel: "GL-07",
        workLocation: "Lagos",
        department: createdDepartments[1]._id,
      },
      {
        firstName: "Osahon",
        lastName: "Osagie",
        email: "osahon.osagie@company.com",
        phone: "08034567890",
        role: UserRole.ADMIN,
        employeeId: "ADM2503003",
        position: "Head of Marketing",
        gradeLevel: "GL-07",
        workLocation: "Lagos",
        department: createdDepartments[2]._id,
      },
      {
        firstName: "Abubakar",
        lastName: "Ibrahim",
        email: "abubakar.ibrahim@company.com",
        phone: "08045678901",
        role: UserRole.ADMIN,
        employeeId: "ADM2503004",
        position: "Head of HR",
        gradeLevel: "GL-07",
        workLocation: "Lagos",
        department: createdDepartments[3]._id,
      },
      {
        firstName: "Chibueze",
        lastName: "Okonkwo",
        email: "chibueze.okonkwo@company.com",
        phone: "08056789012",
        role: UserRole.ADMIN,
        employeeId: "ADM2503005",
        position: "Head of Finance",
        gradeLevel: "GL-07",
        workLocation: "Lagos",
        department: createdDepartments[4]._id,
      },
      {
        firstName: "Oluwaseun",
        lastName: "Adeyemi",
        email: "oluwaseun.adeyemi@company.com",
        phone: "08067890123",
        role: UserRole.ADMIN,
        employeeId: "ADM2503006",
        position: "Head of Engineering",
        gradeLevel: "GL-07",
        workLocation: "Lagos HQ, Floor 2",
        department: createdDepartments[5]._id,
      },
    ].map((hod) => ({
      ...hod,
      status: "pending",
      isEmailVerified: false,
      dateJoined: new Date(),
      password: hashedPassword,
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
      permissions: [
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
      ],
    }));

    console.log("📊 Creating department heads...");
    const createdHODs = await Promise.all(
      hodUsers.map((hod) =>
        UserModel.create({
          ...hod,
          createdBy: new mongoose.Types.ObjectId("67d7d55acccafb0fc97432ec"),
        })
      )
    );

    // 4. Update departments with HOD references
    await Promise.all(
      createdDepartments.map((dept, index) =>
        Department.findByIdAndUpdate(dept._id, {
          headOfDepartment: createdHODs[index]._id,
        })
      )
    );

    // 5. Create regular employees (including additional admins)
    const employees = [
      // Additional Admins (non-HODs)
      {
        firstName: "Victoria",
        lastName: "Adeyemi",
        email: "victoria.adeyemi@company.com",
        phone: "08087654321",
        role: UserRole.ADMIN,
        department: createdDepartments[0]._id,
        employeeId: "ADM2103002",
        position: "Operations Manager",
        gradeLevel: "GL-06",
        workLocation: "HQ Floor 2",
      },
      {
        firstName: "Babajide",
        lastName: "Ogunleye",
        email: "babajide.ogunleye@company.com",
        phone: "08076543210",
        role: UserRole.ADMIN,
        department: createdDepartments[2]._id,
        employeeId: "ADM2503016",
        position: "Marketing Manager",
        gradeLevel: "GL-06",
        workLocation: "Lagos",
      },
      {
        firstName: "Blessing",
        lastName: "Okafor",
        email: "blessing.okafor@company.com",
        phone: "08021098765",
        role: UserRole.ADMIN,
        department: createdDepartments[3]._id,
        employeeId: "ADM2503021",
        position: "HR Manager",
        gradeLevel: "GL-06",
        workLocation: "Lagos",
      },

      // Regular Users
      {
        firstName: "Amina",
        lastName: "Bello",
        email: "amina.bello@company.com",
        phone: "08012345608",
        role: UserRole.USER,
        department: createdDepartments[0]._id,
        employeeId: "EMP2503009",
        position: "Operations Analyst",
        gradeLevel: "GL-04",
        workLocation: "Lagos",
      },
      {
        firstName: "Chukwudi",
        lastName: "Nnamdi",
        email: "chukwudi.nnamdi@company.com",
        phone: "08076543210",
        role: UserRole.USER,
        department: createdDepartments[4]._id,
        employeeId: "EMP2503013",
        position: "Financial Analyst",
        gradeLevel: "GL-05",
        workLocation: "Lagos",
      },
      {
        firstName: "Folake",
        lastName: "Adeleke",
        email: "folake.adeleke@company.com",
        phone: "08089765432",
        role: UserRole.USER,
        department: createdDepartments[2]._id,
        employeeId: "EMP2503012",
        position: "Marketing Analyst",
        gradeLevel: "GL-05",
        workLocation: "Lagos",
      },
      {
        firstName: "Ibrahim",
        lastName: "Musa",
        email: "ibrahim.musa@company.com",
        phone: "08032109876",
        role: UserRole.USER,
        department: createdDepartments[1]._id,
        employeeId: "EMP2503020",
        position: "Sales Representative",
        gradeLevel: "GL-03",
        workLocation: "Lagos",
      },
      {
        firstName: "Yetunde",
        lastName: "Adewale",
        email: "yetunde.adewale@company.com",
        phone: "08043210987",
        role: UserRole.USER,
        department: createdDepartments[5]._id,
        employeeId: "EMP2503019",
        position: "Software Engineer",
        gradeLevel: "GL-05",
        workLocation: "Lagos",
      },
      {
        firstName: "Emeka",
        lastName: "Okafor",
        email: "emeka.okafor@company.com",
        phone: "08054321098",
        role: UserRole.USER,
        department: createdDepartments[4]._id,
        employeeId: "EMP2503018",
        position: "Accountant",
        gradeLevel: "GL-05",
        workLocation: "Lagos",
      },
    ].map((emp) => ({
      ...emp,
      status: "pending",
      isEmailVerified: false,
      password: hashedPassword,
      dateJoined: new Date(),
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
    }));

    await validateSetup(hodUsers, employees);

    console.log("👥 Creating employees...");
    await Promise.all(
      employees.map((emp) =>
        UserModel.create({
          ...emp,
          createdBy: new mongoose.Types.ObjectId("67d7d55acccafb0fc97432ec"),
        })
      )
    );

    const summary = await generateSetupSummary();
    console.log("\n📊 Setup Summary:", summary);
  } catch (error) {
    console.error("❌ Setup failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
};

const generateSetupSummary = async () => {
  const adminCount = await UserModel.countDocuments({ role: UserRole.ADMIN });
  const userCount = await UserModel.countDocuments({ role: UserRole.USER });
  const departmentCount = await Department.countDocuments();
  const pendingCount = await UserModel.countDocuments({ status: "pending" });

  return {
    departments: departmentCount,
    admins: adminCount,
    regularUsers: userCount,
    totalUsers: adminCount + userCount,
    pendingUsers: pendingCount,
  };
};

setupDepartmentsAndUsers()
  .then(() => {
    console.log("🎉 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });