import mongoose, { Document, Types } from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "../../models/User.js";
import Department from "../../models/Department.js";
import Task from "../../models/Task.js";
import { UserRole } from "../../models/User.js";
import { DepartmentStatus } from "../../models/Department.js";
import { TaskStatus } from "../../models/Task.js";

dotenv.config();

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

async function main() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");

    // Clear existing data (preserve super admins)
    await Department.deleteMany({});
    await User.deleteMany({ role: { $ne: UserRole.SUPER_ADMIN } });
    await Task.deleteMany({});
    console.log("Cleared existing data (preserved super admins)");

    // Create departments first with required fields
    const departments = (await Department.create([
      {
        name: "Engineering",
        code: "ENG",
        description: "Software and Systems Engineering",
        status: DepartmentStatus.ACTIVE,
        location: "New York",
        createdBy: "SYSTEM_SEED",
        updatedBy: "SYSTEM_SEED",
      },
      {
        name: "HR",
        code: "HR",
        description: "Human Resources Management",
        status: DepartmentStatus.ACTIVE,
        location: "Chicago",
        createdBy: "SYSTEM_SEED",
        updatedBy: "SYSTEM_SEED",
      },
      {
        name: "Finance",
        code: "FIN",
        description: "Financial Operations",
        status: DepartmentStatus.ACTIVE,
        location: "Boston",
        createdBy: "SYSTEM_SEED",
        updatedBy: "SYSTEM_SEED",
      },
      {
        name: "Sales",
        code: "SAL",
        description: "Sales and Business Development",
        status: DepartmentStatus.ACTIVE,
        location: "Los Angeles",
        createdBy: "SYSTEM_SEED",
        updatedBy: "SYSTEM_SEED",
      },
      {
        name: "Marketing",
        code: "MKT",
        description: "Marketing and Communications",
        status: DepartmentStatus.ACTIVE,
        location: "Miami",
        createdBy: "SYSTEM_SEED",
        updatedBy: "SYSTEM_SEED",
      },
    ])) as unknown as DepartmentDocument[];
    console.log("Created departments");

    // Create employees with their tasks
    const employees = await createEmployees(departments);
    console.log(
      `Created ${employees.length} employees with their onboarding tasks`
    );

    console.log("Seeding completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding data:", error);
    process.exit(1);
  } finally {
    // Add disconnect when done
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run the seed script
main();
