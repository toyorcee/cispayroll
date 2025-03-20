import mongoose, { Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import axios from "axios";
import User from "../../models/User.js";
import Department from "../../models/Department.js";
import Task from "../../models/Task.js";
import { UserRole } from "../../models/User.js";
import { DepartmentStatus } from "../../models/Department.js";
import { TaskStatus } from "../../models/Task.js";

dotenv.config();
const API_URL = "http://localhost:5000/api";
const AUTH_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3ZDdkNTVhY2NjYWZiMGZjOTc0MzJlYyIsInJvbGUiOiJTVVBFUl9BRE1JTiIsInBlcm1pc3Npb25zIjpbIkNSRUFURV9BRE1JTiIsIkVESVRfQURNSU4iLCJERUxFVEVfQURNSU4iLCJWSUVXX0FMTF9BRE1JTlMiLCJDUkVBVEVfVVNFUiIsIkVESVRfVVNFUiIsIkRFTEVURV9VU0VSIiwiVklFV19BTExfVVNFUlMiLCJDUkVBVEVfREVQQVJUTUVOVCIsIkVESVRfREVQQVJUTUVOVCIsIkRFTEVURV9ERVBBUlRNRU5UIiwiVklFV19BTExfREVQQVJUTUVOVFMiLCJNQU5BR0VfREVQQVJUTUVOVF9VU0VSUyIsIkNSRUFURV9QQVlST0xMIiwiRURJVF9QQVlST0xMIiwiREVMRVRFX1BBWVJPTEwiLCJWSUVXX0FMTF9QQVlST0xMIiwiQVBQUk9WRV9QQVlST0xMIiwiR0VORVJBVEVfUEFZU0xJUCIsIlZJRVdfUkVQT1JUUyIsIkFQUFJPVkVfTEVBVkUiLCJWSUVXX1RFQU1fTEVBVkUiLCJWSUVXX0FMTF9MRUFWRSIsIlZJRVdfUEVSU09OQUxfSU5GTyIsIlJFUVVFU1RfTEVBVkUiLCJWSUVXX09XTl9MRUFWRSIsIkNBTkNFTF9PV05fTEVBVkUiLCJWSUVXX09XTl9QQVlTTElQIiwiTUFOQUdFX09OQk9BUkRJTkciLCJWSUVXX09OQk9BUkRJTkciLCJNQU5BR0VfT0ZGQk9BUkRJTkciLCJWSUVXX09GRkJPQVJESU5HIiwiQVBQUk9WRV9PRkZCT0FSRElORyIsIlZJRVdfUEFZUk9MTF9TVEFUUyIsIk1BTkFHRV9TWVNURU0iLCJWSUVXX1NZU1RFTV9IRUFMVEgiLCJWSUVXX0FVRElUX0xPR1MiLCJNQU5BR0VfU0FMQVJZX1NUUlVDVFVSRSIsIlZJRVdfU0FMQVJZX1NUUlVDVFVSRSIsIkVESVRfU0FMQVJZX1NUUlVDVFVSRSIsIk1BTkFHRV9ERURVQ1RJT05TIiwiVklFV19ERURVQ1RJT05TIiwiRURJVF9ERURVQ1RJT05TIiwiTUFOQUdFX0FMTE9XQU5DRVMiLCJWSUVXX0FMTE9XQU5DRVMiLCJFRElUX0FMTE9XQU5DRVMiLCJNQU5BR0VfQk9OVVNFUyIsIlZJRVdfQk9OVVNFUyIsIkVESVRfQk9OVVNFUyIsIk1BTkFHRV9PVkVSVElNRSIsIlZJRVdfUEFZUk9MTF9SRVBPUlRTIiwiVklFV19FTVBMT1lFRV9SRVBPUlRTIiwiVklFV19UQVhfUkVQT1JUUyIsIk1BTkFHRV9UQVhfQ09ORklHIiwiTUFOQUdFX0NPTVBMSUFOQ0UiLCJNQU5BR0VfTk9USUZJQ0FUSU9OUyIsIk1BTkFHRV9JTlRFR1JBVElPTlMiLCJNQU5BR0VfRE9DVU1FTlRTIiwiRURJVF9QRVJTT05BTF9JTkZPIl0sImlhdCI6MTc0MjQ2MjA5NCwiZXhwIjoxNzQyNTQ4NDk0fQ.eNGhGTWGD0z4Gnrw3GFQ4p24M0mqwCqlU-qBnn8lR9A";

// No need for MONGODB_URI since it's handled in connectDB
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/payroll"
    );
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

const defaultOnboardingTasks = [
  "documentation_review",
  "system_access_setup",
  "training_completion",
  "department_orientation",
];

// Add this constant for number of users per department
const USERS_PER_DEPARTMENT = 20; // This will create 100 users total (20 users × 5 departments)

// Sample data for more realistic employees
const positions = [
  "Software Engineer",
  "HR Specialist",
  "Financial Analyst",
  "Sales Representative",
  "Marketing Coordinator",
  "Project Manager",
  "Business Analyst",
  "Product Manager",
];

const workLocations = [
  "Headquarters",
  "Remote",
  "Branch Office",
  "Regional Office",
  "Home Office",
];

const gradeLevels = ["L1", "L2", "L3", "L4", "L5"];

// Update the interface to match Mongoose's types
interface DepartmentDocument extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description: string;
  status: DepartmentStatus;
  location: string;
  createdBy: string;
  updatedBy: string;
}

// Add sample names for more realistic data
const firstNames = [
  "James",
  "Mary",
  "John",
  "Patricia",
  "Robert",
  "Jennifer",
  "Michael",
  "Linda",
  "William",
  "Elizabeth",
  "David",
  "Barbara",
  "Richard",
  "Susan",
  "Joseph",
  "Jessica",
  "Thomas",
  "Sarah",
  "Charles",
  "Karen",
  "Christopher",
  "Nancy",
  "Daniel",
  "Lisa",
  "Matthew",
  "Betty",
  "Anthony",
  "Margaret",
  "Mark",
  "Sandra",
  "Donald",
  "Ashley",
  "Steven",
  "Kimberly",
  "Paul",
  "Emily",
  "Andrew",
  "Donna",
  "Joshua",
  "Michelle",
];

const lastNames = [
  "Smith",
  "Johnson",
  "Williams",
  "Brown",
  "Jones",
  "Garcia",
  "Miller",
  "Davis",
  "Rodriguez",
  "Martinez",
  "Hernandez",
  "Lopez",
  "Gonzalez",
  "Wilson",
  "Anderson",
  "Thomas",
  "Taylor",
  "Moore",
  "Jackson",
  "Martin",
  "Lee",
  "Perez",
  "Thompson",
  "White",
  "Harris",
  "Sanchez",
  "Clark",
  "Ramirez",
  "Lewis",
  "Robinson",
  "Walker",
  "Young",
  "Allen",
  "King",
  "Wright",
  "Scott",
  "Torres",
  "Nguyen",
  "Hill",
  "Flores",
];

// Update the createEmployees function to ensure unique emails
async function createEmployees(
  departments: DepartmentDocument[]
): Promise<any[]> {
  const employees = [];
  let emailCounter = 1; // Add a counter for unique emails

  for (const dept of departments) {
    // Create 20 employees per department
    for (let i = 0; i < USERS_PER_DEPARTMENT; i++) {
      const hashedPassword = await bcrypt.hash("user123", 12);

      // Generate random names
      const firstName =
        firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

      // Generate random dates within last 30 days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));

      // Create unique email using counter
      const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${emailCounter}@company.com`;
      emailCounter++; // Increment counter for next email

      // Create employee with realistic data
      const employee = await User.create({
        employeeId: `${dept.code}${String(i + 1).padStart(3, "0")}`,
        firstName,
        lastName,
        email, // Use the unique email
        phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        password: hashedPassword,
        role: UserRole.USER,
        department: dept._id,
        position: positions[Math.floor(Math.random() * positions.length)],
        gradeLevel: gradeLevels[Math.floor(Math.random() * gradeLevels.length)],
        workLocation:
          workLocations[Math.floor(Math.random() * workLocations.length)],
        dateJoined: startDate,
        status: "pending",
        isEmailVerified: false,
        progress: 0,
      });

      // Create onboarding tasks for each employee
      const tasks = [
        {
          name: "documentation_review",
          status: TaskStatus.NOT_STARTED,
          dueDate: new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
        {
          name: "system_access_setup",
          status: TaskStatus.NOT_STARTED,
          dueDate: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000),
        },
        {
          name: "training_completion",
          status: TaskStatus.NOT_STARTED,
          dueDate: new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000),
        },
        {
          name: "department_orientation",
          status: TaskStatus.NOT_STARTED,
          dueDate: new Date(startDate.getTime() + 5 * 24 * 60 * 60 * 1000),
        },
      ];

      // Create tasks in database
      for (const task of tasks) {
        await Task.create({
          ...task,
          userId: employee._id,
          completed: false,
        });
      }

      employees.push(employee);
      console.log(`Created employee: ${firstName} ${lastName} in ${dept.name}`);
    }
  }

  return employees;
}

// Define the 5 Nigerian department heads with their department IDs
const departmentHeads = [
  {
    firstName: "Oluwaseun",
    lastName: "Adeyemi",
    email: "oluwaseun.adeyemi@company.com",
    phone: "08012345678",
    password: "Password123!",
    position: "Head of Engineering",
    gradeLevel: "GL-06",
    workLocation: "Lagos",
    department: "Engineering", // The API will match this with existing department
    dateJoined: "2024-03-20",
    emergencyContact: {
      name: "Folake Adeyemi",
      relationship: "Spouse",
      phone: "08087654321",
    },
    bankDetails: {
      bankName: "GTBank",
      accountNumber: "0123456789",
      accountName: "Oluwaseun Adeyemi",
    },
  },
  {
    firstName: "Chibueze",
    lastName: "Okonkwo",
    email: "chibueze.okonkwo@company.com",
    phone: "08023456789",
    password: "Password123!",
    position: "Head of Finance",
    gradeLevel: "GL-06",
    workLocation: "Lagos",
    department: "Finance",
    dateJoined: "2024-03-20",
    emergencyContact: {
      name: "Adanna Okonkwo",
      relationship: "Spouse",
      phone: "08076543210",
    },
    bankDetails: {
      bankName: "Access Bank",
      accountNumber: "0234567890",
      accountName: "Chibueze Okonkwo",
    },
  },
  {
    firstName: "Abubakar",
    lastName: "Ibrahim",
    email: "abubakar.ibrahim@company.com",
    phone: "08034567890",
    password: "Password123!",
    position: "Head of HR",
    gradeLevel: "GL-06",
    workLocation: "Lagos",
    department: "HR",
    dateJoined: "2024-03-20",
    emergencyContact: {
      name: "Amina Ibrahim",
      relationship: "Spouse",
      phone: "08065432109",
    },
    bankDetails: {
      bankName: "Zenith Bank",
      accountNumber: "0345678901",
      accountName: "Abubakar Ibrahim",
    },
  },
  {
    firstName: "Osahon",
    lastName: "Osagie",
    email: "osahon.osagie@company.com",
    phone: "08045678901",
    password: "Password123!",
    position: "Head of Marketing",
    gradeLevel: "GL-06",
    workLocation: "Lagos",
    department: "Marketing",
    dateJoined: "2024-03-20",
    emergencyContact: {
      name: "Ehis Osagie",
      relationship: "Spouse",
      phone: "08054321098",
    },
    bankDetails: {
      bankName: "UBA",
      accountNumber: "0456789012",
      accountName: "Osahon Osagie",
    },
  },
  {
    firstName: "Ekong",
    lastName: "Udoh",
    email: "ekong.udoh@company.com",
    phone: "08056789012",
    password: "Password123!",
    position: "Head of Sales",
    gradeLevel: "GL-06",
    workLocation: "Lagos",
    department: "Sales",
    dateJoined: "2024-03-20",
    emergencyContact: {
      name: "Ime Udoh",
      relationship: "Spouse",
      phone: "08043210987",
    },
    bankDetails: {
      bankName: "First Bank",
      accountNumber: "0567890123",
      accountName: "Ekong Udoh",
    },
  },
];

async function createAdmins() {
  console.log("🚀 Creating department heads...");

  for (const admin of departmentHeads) {
    try {
      console.log(
        `Attempting to create admin for ${admin.department} department...`
      );

      const response = await axios.post(
        `${API_URL}/super-admin/admins`,
        admin,
        {
          headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("API Response:", response.data);
      console.log(
        `✅ Created admin: ${admin.firstName} ${admin.lastName} for ${admin.department} department`
      );
    } catch (error: any) {
      console.error(
        `❌ Failed to create admin ${admin.firstName} ${admin.lastName}:`,
        error.response?.data || error.message,
        "\nFull error:",
        error
      );
    }
  }
}

async function main() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    // Clear existing users except Toyosi (super admin)
    await User.deleteMany({
      _id: { $ne: "67d7d55acccafb0fc97432ec" },
      role: { $ne: UserRole.SUPER_ADMIN },
    });
    console.log("Cleared existing users (preserved super admin)");

    // Create admins as department heads
    await createAdmins();
    console.log("✅ Admin seeding completed successfully");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding data:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the seed script
main();
