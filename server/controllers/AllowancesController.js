import Allowance from "../models/Allowance.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { asyncHandler, ApiError } from "../utils/errorHandler.js";
import mongoose from "mongoose";

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

  let department;

  if (userRole === "ADMIN") {
    department = await Department.findOne({ headOfDepartment: userId });
    if (!department) {
      throw new ApiError(403, "You are not a head of department");
    }
    if (department._id.toString() !== departmentId) {
      throw new ApiError(
        403,
        "You can only create allowances for your own department"
      );
    }
  } else if (userRole === "SUPER_ADMIN") {
    department = await Department.findById(departmentId);
    if (!department) {
      throw new ApiError(404, "Department not found");
    }
  }

  const employees = await User.find({
    department: department._id,
    status: "active",
  });

  if (!employees.length) {
    throw new ApiError(404, "No active employees found in this department");
  }

  const allowancePromises = employees.map((employee) =>
    Allowance.create({
      employee: employee._id,
      type,
      amount,
      reason,
      paymentDate: new Date(paymentDate),
      department: department._id,
      createdBy: userId,
      updatedBy: userId,
      approvalStatus: "approved",
      approvedBy: userId,
      approvedAt: new Date(),
    })
  );

  let allowances = await Promise.all(allowancePromises);

  // Populate employee name for each allowance
  allowances = await Allowance.populate(allowances, {
    path: "employee",
    select: "firstName lastName email profileImageUrl",
  });

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

  // Find the employee
  const employee = await User.findById(employeeId);
  if (!employee || employee.status !== "active") {
    throw new ApiError(404, "Active employee not found");
  }

  // If Admin, check department match
  if (userRole === "ADMIN") {
    const department = await Department.findOne({ headOfDepartment: userId });
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

  // Create the allowance
  let allowance = await Allowance.create({
    employee: employee._id,
    type,
    amount,
    reason,
    paymentDate: new Date(paymentDate),
    department: employee.department,
    createdBy: userId,
    updatedBy: userId,
    approvalStatus: "approved",
    approvedBy: userId,
    approvedAt: new Date(),
  });

  // Populate employee name and email
  allowance = await Allowance.populate(allowance, {
    path: "employee",
    select: "firstName lastName email profileImageUrl",
  });

  return res.status(201).json({
    success: true,
    data: allowance,
    message: `Allowance created for employee ${employee._id}`,
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
  else {
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

  const allowances = await Allowance.find(query)
    .populate("employee", "firstName lastName email profileImageUrl")
    .populate("department", "name")
    .populate("approvedBy", "fullName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  // Add fullName to each employee
  allowances.forEach((allowance) => {
    if (allowance.employee && typeof allowance.employee === "object") {
      allowance.employee.fullName = `${allowance.employee.firstName || ""} ${
        allowance.employee.lastName || ""
      }`.trim();
    }
  });

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
