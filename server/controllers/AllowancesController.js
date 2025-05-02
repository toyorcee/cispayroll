import Allowance from "../models/Allowance.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { asyncHandler, ApiError } from "../utils/errorHandler.js";
import mongoose, { Types } from "mongoose";

// Add this function at the top of the file, after imports
const validatePaymentDate = (paymentDate) => {
  const date = new Date(paymentDate);
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JavaScript months are 0-based

  // Calculate payroll period
  const periodStart = new Date(year, month - 1, 1); // First day of the month
  const periodEnd = new Date(year, month, 0); // Last day of the month

  // Adjust for payroll processing period (last day of previous month to last day of current month)
  const payrollStart = new Date(year, month - 1, 0); // Last day of previous month
  const payrollEnd = new Date(year, month, 0); // Last day of current month

  if (date < payrollStart || date > payrollEnd) {
    throw new ApiError(
      400,
      `Payment date must be between ${
        payrollStart.toISOString().split("T")[0]
      } and ${payrollEnd.toISOString().split("T")[0]} for the selected month`
    );
  }

  return true;
};

/**
 * Create a general allowance for all employees (Super Admin only)
 */
const createAllowance = asyncHandler(async (req, res) => {
  const { amount, reason, paymentDate, type } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Only Super Admin can create general allowance
  if (userRole !== "SUPER_ADMIN") {
    throw new ApiError(403, "Only Super Admins can create general allowances");
  }

  if (!amount || !reason || !paymentDate || !type) {
    throw new ApiError(
      400,
      "Amount, reason, type, and payment date are required"
    );
  }

  // Get all active employees
  const employees = await User.find({ status: "active" });

  if (!employees.length) {
    throw new ApiError(404, "No active employees found");
  }

  // Create an allowance for each employee
  const allowancePromises = employees.map((employee) =>
    Allowance.create({
      employee: employee._id,
      type,
      amount,
      reason,
      paymentDate: new Date(paymentDate),
      createdBy: userId,
      updatedBy: userId,
      approvalStatus: "approved",
      approvedBy: userId,
      approvedAt: new Date(),
    })
  );

  let allowances = await Promise.all(allowancePromises);

  // Populate employee name and email
  allowances = await Allowance.populate(allowances, {
    path: "employee",
    select: "firstName lastName email profileImageUrl",
  });

  return res.status(201).json({
    success: true,
    data: allowances,
    message: `General allowance created for ${allowances.length} employees`,
  });
});

/**
 * Create a department-wide allowance (Admin/HOD or Super Admin)
 */
const createDepartmentAllowance = asyncHandler(async (req, res) => {
  const { departmentId, amount, reason, paymentDate, type } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  console.log("📝 Creating department-wide allowance:", {
    departmentId,
    amount,
    reason,
    paymentDate,
    type,
    createdBy: userId,
  });

  // Only Admin or Super Admin can create department allowance
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    throw new ApiError(
      403,
      "Only department heads and super admins can create department allowances"
    );
  }

  if (!departmentId || !amount || !reason || !paymentDate || !type) {
    throw new ApiError(
      400,
      "Department, amount, reason, type, and payment date are required"
    );
  }

  // Validate payment date
  validatePaymentDate(paymentDate);

  // If Admin, check department match (EXACTLY like bonus controller)
  let department;
  if (userRole === "ADMIN") {
    // First try to find department by headOfDepartment field
    department = await Department.findOne({ headOfDepartment: userId });

    // If not found by headOfDepartment, check if user's position indicates they're a head of department
    if (
      !department &&
      req.user.position &&
      req.user.position.toLowerCase().includes("head of")
    ) {
      // Find department by user's department field
      department = await Department.findById(req.user.department);
    }

    if (!department) {
      throw new ApiError(403, "You are not a head of department");
    }
    if (department._id.toString() !== departmentId.toString()) {
      throw new ApiError(
        403,
        "You can only create allowances for your own department"
      );
    }
  } else {
    // For super admin, fetch the department by ID
    department = await Department.findById(departmentId);
    if (!department) {
      throw new ApiError(404, "Department not found");
    }
  }

  // Find all active employees in the department
  const employees = await User.find({
    department: departmentId,
    status: "active",
  });

  if (!employees.length) {
    throw new ApiError(404, "No active employees found in the department");
  }

  console.log(`👥 Found ${employees.length} active employees in department`);

  // Create allowances for each employee
  const allowances = [];
  for (const employee of employees) {
    // Create allowance in the Allowance collection
    const allowance = await Allowance.create({
      employee: employee._id,
      type,
      amount: Number(amount),
      reason,
      paymentDate: new Date(paymentDate),
      department: departmentId,
      createdBy: userId,
      updatedBy: userId,
      approvalStatus: "approved",
      approvedBy: userId,
      approvedAt: new Date(),
      isDepartmentWide: true,
      calculationMethod: "fixed",
      frequency: "monthly",
    });

    // Create simplified personalAllowance object
    const personalAllowance = {
      allowanceId: allowance._id,
      status: "APPROVED",
      usedInPayroll: {
        month: null,
        year: null,
        payrollId: null,
      },
    };

    // Update the user with the new allowance
    await User.findByIdAndUpdate(employee._id, {
      $push: { personalAllowances: personalAllowance },
    });

    allowances.push(allowance);
  }

  console.log(
    `✅ Created ${allowances.length} allowances in collection and added to employees' personalAllowances arrays`
  );

  return res.status(201).json({
    success: true,
    data: allowances,
    message: `Department allowance created for ${allowances.length} employees`,
  });
});

/**
 * Create an allowance for a specific employee in a department (Admin/HOD or Super Admin)
 */
const createDepartmentEmployeeAllowance = asyncHandler(async (req, res) => {
  const { employeeId, amount, reason, paymentDate, type } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  console.log("📝 Creating allowance for employee:", {
    employeeId,
    amount,
    reason,
    paymentDate,
    type,
    createdBy: userId,
  });

  // Only Admin or Super Admin can create department employee allowance
  if (userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
    throw new ApiError(
      403,
      "Only department heads and super admins can create employee allowances"
    );
  }

  if (!employeeId || !amount || !reason || !paymentDate || !type) {
    throw new ApiError(
      400,
      "Employee, amount, reason, type, and payment date are required"
    );
  }

  // Validate payment date
  validatePaymentDate(paymentDate);

  // Find the employee
  const employee = await User.findById(employeeId);
  if (!employee || employee.status !== "active") {
    throw new ApiError(404, "Active employee not found");
  }

  console.log("👤 Found employee:", {
    name: employee.name,
    department: employee.department,
  });

  // If Admin, check department match (with fallback logic)
  if (userRole === "ADMIN") {
    // First try to find department by headOfDepartment field
    let department = await Department.findOne({ headOfDepartment: userId });

    // Fallback: If not found, check if user's position indicates they're a head of department
    if (
      !department &&
      req.user.position &&
      req.user.position.toLowerCase().includes("head of")
    ) {
      department = await Department.findById(req.user.department);
    }

    if (!department) {
      throw new ApiError(403, "You are not a head of department");
    }
    if (employee.department.toString() !== department._id.toString()) {
      throw new ApiError(
        403,
        "You can only create allowances for employees in your own department"
      );
    }
  }

  // Create the allowance in the Allowance collection
  const allowance = await Allowance.create({
    employee: employeeId,
    type,
    amount: Number(amount),
    reason,
    paymentDate: new Date(paymentDate),
    department: employee.department,
    createdBy: userId,
    updatedBy: userId,
    approvalStatus: "approved",
    approvedBy: userId,
    approvedAt: new Date(),
    calculationMethod: "fixed",
    frequency: "monthly",
  });

  console.log(
    "✅ Created allowance in collection:",
    JSON.stringify(allowance, null, 2)
  );

  // Add to employee's personalAllowances array with correct structure
  const personalAllowance = {
    // Reference to main allowance
    allowanceId: allowance._id,
    // Assignment details
    assignedAt: new Date(),
    assignedBy: userId,
    status: "APPROVED",
    // Payroll calculation fields
    type: allowance.type,
    amount: allowance.amount,
    paymentDate: allowance.paymentDate,
    calculationMethod: allowance.calculationMethod,
    frequency: allowance.frequency,
    // Initialize usedInPayroll as null
    usedInPayroll: {
      month: null,
      year: null,
      payrollId: null,
    },
  };

  console.log(
    "📝 personalAllowance object to be added:",
    JSON.stringify(personalAllowance, null, 2)
  );

  // First remove any existing allowance with this ID
  await User.findByIdAndUpdate(employeeId, {
    $pull: { personalAllowances: { allowanceId: allowance._id } },
  });

  // Then add the new allowance
  await User.findByIdAndUpdate(employeeId, {
    $push: { personalAllowances: personalAllowance },
  });

  // Fetch and log the updated user document
  const updatedUser = await User.findById(employeeId).lean();
  console.log(
    "👤 Updated employee.personalAllowances:",
    JSON.stringify(updatedUser.personalAllowances, null, 2)
  );

  console.log("✅ Added allowance to employee's personalAllowances array");

  // Populate the allowance details for the response
  const populatedAllowance = await Allowance.findById(allowance._id)
    .populate("employee", "firstName lastName email")
    .populate("department", "name");

  return res.status(201).json({
    success: true,
    data: populatedAllowance,
    message: `Allowance created for employee ${employee.firstName} ${employee.lastName}`,
  });
});

/**
 * Get all allowance requests with filtering options
 */
const getAllowanceRequests = asyncHandler(async (req, res) => {
  const {
    status,
    employeeId,
    departmentId,
    startDate,
    endDate,
    employee,
    type,
  } = req.query;
  const userId = req.user._id;
  const isAdmin = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";
  const isHRManager = req.user.role === "HR_MANAGER";
  const isDepartmentHead = req.user.role === "DEPARTMENT_HEAD";

  // Build query based on user role and filters
  const query = {};

  // Regular users can only see their own requests
  if (!isAdmin && !isHRManager && !isDepartmentHead) {
    query.employee = userId;
  }
  // Department heads can see requests from their department
  else if (isDepartmentHead) {
    const userDepartment = await User.findById(userId).select("department");
    query.department = userDepartment.department;
  }
  // Admins and HR managers can see all requests with filters
  else if (req.user.role === "ADMIN") {
    // Restrict to admin's department by default
    const adminDepartment = req.user.department;
    query.department = adminDepartment;
    // Allow further filtering if provided
    if (employeeId) query.employee = employeeId;
    if (departmentId) query.department = departmentId;
  } else {
    // For super admin and HR managers, allow all
    if (employeeId) query.employee = employeeId;
    if (departmentId) query.department = departmentId;
  }

  // Apply additional filters
  if (status) query.approvalStatus = status;
  if (type) query.type = type;
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // If employee is provided and not a valid ObjectId, treat as name/email search
  if (employee) {
    const isObjectId = mongoose.Types.ObjectId.isValid(employee);
    if (!isObjectId) {
      // Find users by name or email (case-insensitive)
      const users = await User.find({
        $or: [
          { fullName: { $regex: employee, $options: "i" } },
          { email: { $regex: employee, $options: "i" } },
          { firstName: { $regex: employee, $options: "i" } },
          { lastName: { $regex: employee, $options: "i" } },
        ],
      }).select("_id");
      const userIds = users.map((u) => u._id);
      query.employee = { $in: userIds };
    } else {
      query.employee = employee;
    }
  }

  // Get allowance requests with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get allowances from Allowance collection
  const allowances = await Allowance.find(query)
    .populate("department", "name code")
    .populate("createdBy", "firstName lastName")
    .populate("employee", "firstName lastName email profileImageUrl")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Get total count
  const total = await Allowance.countDocuments(query);

  return res.status(200).json({
    success: true,
    data: {
      allowances,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
    message: "Allowance requests retrieved successfully",
  });
});

export {
  createAllowance,
  createDepartmentAllowance,
  createDepartmentEmployeeAllowance,
  getAllowanceRequests,
};
