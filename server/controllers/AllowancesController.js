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

  // Add audit logging
  await PayrollStatisticsLogger.logAllowanceAction({
    action: "CREATE",
    allowanceIds: allowances.map((a) => a._id),
    userId: userId,
    details: {
      type: type,
      amount: amount,
      reason: reason,
      paymentDate: paymentDate,
      employeeCount: employees.length,
      createdBy: userId,
      position: req.user.position,
      role: req.user.role,
      message: `Created general allowance for ${employees.length} employees`,
    },
    statisticsDetails: {
      allowanceType: type,
      amount: amount,
      employeeCount: employees.length,
    },
    auditDetails: {
      entity: "ALLOWANCE",
      entityIds: allowances.map((a) => a._id),
      action: "CREATE",
      performedBy: userId,
      status: "APPROVED",
      remarks: `Created general allowance for ${employees.length} employees`,
    },
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

  // Add audit logging
  await PayrollStatisticsLogger.logAllowanceAction({
    action: "CREATE",
    allowanceIds: allowances.map((a) => a._id),
    userId: userId,
    details: {
      type: type,
      amount: amount,
      reason: reason,
      paymentDate: paymentDate,
      departmentId: departmentId,
      departmentName: department.name,
      employeeCount: employees.length,
      createdBy: userId,
      position: req.user.position,
      role: req.user.role,
      message: `Created department allowance for ${employees.length} employees in ${department.name}`,
    },
    statisticsDetails: {
      allowanceType: type,
      amount: amount,
      departmentId: departmentId,
      employeeCount: employees.length,
    },
    auditDetails: {
      entity: "ALLOWANCE",
      entityIds: allowances.map((a) => a._id),
      action: "CREATE",
      performedBy: userId,
      status: "APPROVED",
      remarks: `Created department allowance for ${employees.length} employees in ${department.name}`,
    },
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

  // Add audit logging
  await PayrollStatisticsLogger.logAllowanceAction({
    action: "CREATE",
    allowanceIds: [allowance._id],
    userId: userId,
    details: {
      type: type,
      amount: amount,
      reason: reason,
      paymentDate: paymentDate,
      employeeId: employeeId,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      departmentId: employee.department,
      createdBy: userId,
      position: req.user.position,
      role: req.user.role,
      message: `Created allowance for employee ${employee.firstName} ${employee.lastName}`,
    },
    statisticsDetails: {
      allowanceType: type,
      amount: amount,
      employeeId: employeeId,
      departmentId: employee.department,
    },
    auditDetails: {
      entity: "ALLOWANCE",
      entityIds: [allowance._id],
      action: "CREATE",
      performedBy: userId,
      status: "APPROVED",
      remarks: `Created allowance for employee ${employee.firstName} ${employee.lastName}`,
    },
  });

  return res.status(201).json({
    success: true,
    data: populatedAllowance,
    message: `Allowance created for employee ${employee.firstName} ${employee.lastName}`,
  });
});

/**
 * Create a personal allowance request (for all users)
 */
const createPersonalAllowance = asyncHandler(async (req, res) => {
  const { name, type, amount, description, effectiveDate } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;
  const userPosition = req.user.position?.toLowerCase() || "";

  if (!name || !type || !amount || !description || !effectiveDate) {
    throw new ApiError(400, "All required fields must be provided");
  }

  try {
    // Check if user is HR Manager by department and position
    const hrDepartment = await Department.findOne({
      name: { $in: ["Human Resources", "HR"] },
      status: "active",
    });
    const isHRManager =
      hrDepartment &&
      userRole === "ADMIN" &&
      hrDepartment._id.toString() === req.user.department.toString() &&
      [
        "hr manager",
        "head of hr",
        "hr head",
        "head of human resources",
        "human resources manager",
        "hr director",
      ].some((pos) => userPosition.includes(pos));

    // If user is HR or super admin, auto-approve the allowance
    const isAutoApproved = userRole === "SUPER_ADMIN" || isHRManager;

    // Create the allowance request
    const allowance = await Allowance.create({
      name,
      type,
      amount: Number(amount),
      description,
      reason: description,
      calculationMethod: "fixed",
      frequency: "monthly",
      effectiveDate: new Date(effectiveDate),
      paymentDate: new Date(effectiveDate),
      employee: userId,
      department: req.user.department,
      scope: "individual",
      approvalStatus: isAutoApproved ? "approved" : "pending",
      approvedBy: isAutoApproved ? userId : null,
      approvedAt: isAutoApproved ? new Date() : null,
      createdBy: userId,
      updatedBy: userId,
    });

    // Log the created allowance
    console.log(
      "[PERSONAL ALLOWANCE CREATED]",
      JSON.stringify(allowance, null, 2)
    );

    // If auto-approved, add to employee's personalAllowances
    if (isAutoApproved) {
      const personalAllowance = {
        allowanceId: allowance._id,
        status: "APPROVED",
        usedInPayroll: {
          month: null,
          year: null,
          payrollId: null,
        },
      };
      await User.findByIdAndUpdate(userId, {
        $push: { personalAllowances: personalAllowance },
      });
    }

    // Add audit logging
    await PayrollStatisticsLogger.logAllowanceAction({
      action: "CREATE",
      allowanceIds: [allowance._id],
      userId: userId,
      details: {
        name: name,
        type: type,
        amount: amount,
        description: description,
        effectiveDate: effectiveDate,
        approvalStatus: allowance.approvalStatus,
        employeeId: userId,
        departmentId: req.user.department,
        createdBy: userId,
        position: req.user.position,
        role: req.user.role,
        message: `Created personal allowance request: ${name}`,
      },
      statisticsDetails: {
        allowanceType: type,
        amount: amount,
        approvalStatus: allowance.approvalStatus,
        scope: "individual",
      },
      auditDetails: {
        entity: "ALLOWANCE",
        entityIds: [allowance._id],
        action: "CREATE",
        performedBy: userId,
        status: allowance.approvalStatus,
        remarks: `Created personal allowance request: ${name}`,
      },
    });

    // Log only after successful creation
    console.log(
      `[ALLOWANCE REQUEST SUCCESS] User ${userId} created an allowance request for amount ${amount} with status ${allowance.approvalStatus}`
    );

    return res.status(201).json({
      success: true,
      data: allowance,
      message: isAutoApproved
        ? "Allowance created and approved successfully"
        : "Allowance request created successfully and is pending approval",
    });
  } catch (error) {
    console.error(
      `[ALLOWANCE REQUEST FAILED] User ${userId} failed to create allowance request: ${error.message}`
    );
    throw new ApiError(500, "Failed to create allowance request");
  }
});

/**
 * Get all allowance requests with filtering options
 */
const getAllowanceRequests = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    employee,
    departmentId,
    status,
    type,
    startDate,
    endDate,
    includeInactive = false,
  } = req.query;

  // Build the base query
  let query = {};

  // If user is a regular admin (not super admin), filter by their department
  if (
    req.user.role === "ADMIN" &&
    req.user.department &&
    req.user.role !== "SUPER_ADMIN"
  ) {
    query.department = req.user.department;
  }

  // Add other filters if provided
  if (employee) query.employee = employee;
  if (departmentId) query.department = departmentId;
  if (status) query.approvalStatus = status;
  if (type) query.type = type;

  // Date range filter
  if (startDate && endDate) {
    query.effectiveDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  // If includeInactive is false, we only want active allowances
  if (!includeInactive) {
    query.$and = [
      { approvalStatus: "approved" },
      {
        $or: [
          { effectiveDate: { $gt: new Date() } },
          { usedInPayroll: { $exists: false } },
          { usedInPayroll: null },
        ],
      },
    ];
  }

  const allowances = await Allowance.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("employee", "firstName lastName email")
    .populate("department", "name code");

  const total = await Allowance.countDocuments(query);

  res.json({
    success: true,
    data: {
      allowances,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    },
  });
});

const getPersonalAllowances = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const userId = req.user._id;
  const query = { employee: userId };

  const allowances = await Allowance.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit))
    .populate("department", "name code")
    .lean();

  const total = await Allowance.countDocuments(query);

  // Patch name/description for frontend display
  const allowancesWithNameDesc = allowances.map((a) => ({
    ...a,
    name: a.name || a.reason || "N/A",
    description: a.description || a.reason || "N/A",
  }));

  res.json({
    success: true,
    data: {
      allowances: allowancesWithNameDesc,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    },
  });
});

export {
  createAllowance,
  createDepartmentAllowance,
  createDepartmentEmployeeAllowance,
  createPersonalAllowance,
  getAllowanceRequests,
  getPersonalAllowances,
};
