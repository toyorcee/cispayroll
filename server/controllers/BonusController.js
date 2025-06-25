import Bonus, { BonusType, ApprovalStatus } from "../models/Bonus.js";
import User from "../models/User.js";
import Department from "../models/Department.js";
import { handleError, ApiError, asyncHandler } from "../utils/errorHandler.js";
import mongoose from "mongoose";

/**
 * Create a personal bonus request
 * Different handling for admin and regular user
 */
const createPersonalBonus = asyncHandler(async (req, res) => {
  const { amount, reason, paymentDate, type } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;
  const userPosition = req.user.position?.toLowerCase() || "";

  if (!amount || !reason || !paymentDate) {
    throw new ApiError(400, "Amount, reason, and payment date are required");
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

    // If user is HR or super admin, auto-approve the bonus
    const isAutoApproved = userRole === "SUPER_ADMIN" || isHRManager;

    const bonus = await Bonus.create({
      employee: userId,
      type: type || BonusType.PERSONAL,
      amount,
      reason,
      paymentDate: new Date(paymentDate),
      department: req.user.department,
      approvalStatus: isAutoApproved
        ? ApprovalStatus.APPROVED
        : ApprovalStatus.PENDING,
      approvedBy: isAutoApproved ? userId : null,
      approvedAt: isAutoApproved ? new Date() : null,
      createdBy: userId,
      updatedBy: userId,
    });

    // If auto-approved, add to employee's personalBonuses
    if (isAutoApproved) {
      const personalBonus = {
        bonusId: bonus._id,
        status: "APPROVED",
        usedInPayroll: {
          month: null,
          year: null,
          payrollId: null,
        },
      };
      await User.findByIdAndUpdate(userId, {
        $push: { personalBonuses: personalBonus },
      });
    }

    // Add audit logging
    await PayrollStatisticsLogger.logBonusAction({
      action: "CREATE",
      bonusIds: [bonus._id],
      userId: userId,
      details: {
        type: type || BonusType.PERSONAL,
        amount: amount,
        reason: reason,
        paymentDate: paymentDate,
        employeeId: userId,
        departmentId: req.user.department,
        approvalStatus: bonus.approvalStatus,
        createdBy: userId,
        position: req.user.position,
        role: req.user.role,
        message: `Created personal bonus request: ${reason}`,
      },
      statisticsDetails: {
        bonusType: type || BonusType.PERSONAL,
        amount: amount,
        approvalStatus: bonus.approvalStatus,
        scope: "individual",
      },
      auditDetails: {
        entity: "BONUS",
        entityIds: [bonus._id],
        action: "CREATE",
        performedBy: userId,
        status: bonus.approvalStatus,
        remarks: `Created personal bonus request: ${reason}`,
      },
    });

    // Log only after successful creation
    console.log(
      `[BONUS REQUEST SUCCESS] User ${userId} created a personal bonus request for amount ${amount} with status ${bonus.approvalStatus}`
    );

    return res.status(201).json({
      success: true,
      data: bonus,
      message: isAutoApproved
        ? "Personal bonus created and auto-approved successfully"
        : "Personal bonus request created successfully and is pending approval",
    });
  } catch (error) {
    console.error(
      `[BONUS REQUEST FAILED] User ${userId} failed to create bonus request: ${error.message}`
    );
    throw new ApiError(500, "Failed to create bonus request");
  }
});

/**
 * Get all bonus requests with filtering options
 */
const getBonusRequests = asyncHandler(async (req, res) => {
  const {
    status,
    employeeId,
    departmentId,
    startDate,
    endDate,
    employee,
    type,
    includeInactive,
  } = req.query;
  const userId = req.user._id;
  const isAdmin = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";
  const userPosition = req.user.position?.toLowerCase() || "";
  const userDepartment = req.user.department;

  // Check if user is HR Manager by department and position
  const isHRManager =
    userDepartment?.name?.toLowerCase() === "human resources" &&
    req.user.role === "ADMIN" &&
    [
      "hr manager",
      "head of hr",
      "hr head",
      "head of human resources",
      "human resources manager",
      "hr director",
    ].some((pos) => userPosition.toLowerCase().includes(pos));

  // Check if user is a Department Head
  const isDepartmentHead = await Department.findOne({
    headOfDepartment: userId,
  });

  // Build query based on user role and filters
  const query = {};

  // Regular users can only see their own requests
  if (!isAdmin && !isHRManager && !isDepartmentHead) {
    query.employee = userId;
  }
  // Department heads can see requests from their department
  else if (isDepartmentHead) {
    query.department = isDepartmentHead._id;
  }
  // HR managers and super admins can see all requests
  else if (isHRManager || req.user.role === "SUPER_ADMIN") {
    // Allow all requests to be visible
    if (employeeId) query.employee = employeeId;
    if (departmentId) query.department = departmentId;
  }
  // Regular admins can see requests from their department
  else if (req.user.role === "ADMIN") {
    // Restrict to admin's department by default
    query.department = userDepartment._id;
    // Allow further filtering if provided
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

  // If includeInactive is false, only show active bonuses
  if (includeInactive === "false") {
    query.$or = [
      { approvalStatus: "pending" },
      {
        approvalStatus: "approved",
        paymentDate: { $gte: new Date() },
      },
    ];
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

  // Get bonus requests with pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const bonuses = await Bonus.find(query)
    .populate("employee", "firstName lastName email")
    .populate("department", "name code")
    .populate("approvedBy", "fullName")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  bonuses.forEach((bonus) => {
    if (bonus.employee && typeof bonus.employee === "object") {
      bonus.employee.fullName = `${bonus.employee.firstName || ""} ${
        bonus.employee.lastName || ""
      }`.trim();
    }
  });

  const total = await Bonus.countDocuments(query);

  return res.status(200).json({
    success: true,
    data: {
      bonuses,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    },
    message: "Bonus requests retrieved successfully",
  });
});

/**
 * Get a single bonus request by ID
 */
const getBonusRequestById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const isAdmin = req.user.role === "SUPER_ADMIN" || req.user.role === "ADMIN";
  const isHRManager = req.user.role === "HR_MANAGER";
  const isDepartmentHead = req.user.role === "DEPARTMENT_HEAD";

  const bonus = await Bonus.findById(id)
    .populate("employee", "firstName lastName email profileImageUrl")
    .populate("department", "name")
    .populate("approvedBy", "firstName lastName")
    .populate("createdBy", "firstName lastName profileImageUrl")
    .populate("updatedBy", "firstName lastName profileImageUrl");

  if (!bonus) {
    throw new ApiError(404, "Bonus request not found");
  }

  // Check if user has permission to view this bonus request
  if (
    !isAdmin &&
    !isHRManager &&
    !isDepartmentHead &&
    bonus.employee._id.toString() !== userId.toString()
  ) {
    throw new ApiError(
      403,
      "You don't have permission to view this bonus request"
    );
  }

  // If department head, check if bonus is from their department
  if (
    isDepartmentHead &&
    bonus.department._id.toString() !== req.user.department.toString()
  ) {
    throw new ApiError(
      403,
      "You don't have permission to view this bonus request"
    );
  }

  // Format the user data to include fullName
  if (bonus.employee) {
    bonus.employee.fullName = `${bonus.employee.firstName || ""} ${
      bonus.employee.lastName || ""
    }`.trim();
  }

  if (bonus.createdBy) {
    bonus.createdBy.fullName = `${bonus.createdBy.firstName || ""} ${
      bonus.createdBy.lastName || ""
    }`.trim();
  }

  if (bonus.updatedBy) {
    bonus.updatedBy.fullName = `${bonus.updatedBy.firstName || ""} ${
      bonus.updatedBy.lastName || ""
    }`.trim();
  }

  if (bonus.approvedBy) {
    bonus.approvedBy.fullName = `${bonus.approvedBy.firstName || ""} ${
      bonus.approvedBy.lastName || ""
    }`.trim();
  }

  return res.status(200).json({
    success: true,
    data: bonus,
    message: "Bonus request retrieved successfully",
  });
});

/**
 * Approve a bonus request
 */
const approveBonusRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  console.log("✍️ Processing bonus approval for:", id);
  console.log("👤 Approver:", req.user.firstName, req.user.lastName);

  // Check if user has permission to approve bonuses
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    throw new ApiError(
      403,
      "Only department heads and super admins can approve bonuses"
    );
  }

  const bonus = await Bonus.findById(id);
  if (!bonus) {
    throw new ApiError(404, "Bonus request not found");
  }

  if (bonus.status !== "pending") {
    throw new ApiError(400, "Bonus request is not pending");
  }

  // Update bonus status
  bonus.status = "approved";
  bonus.approvedBy = userId;
  bonus.approvedAt = new Date();
  bonus.approvalRemarks = remarks || "";
  bonus.updatedBy = userId;
  bonus.updatedAt = new Date();

  await bonus.save();

  // Add audit logging
  await PayrollStatisticsLogger.logBonusAction({
    action: "APPROVE",
    bonusId: bonus._id,
    userId: userId,
    details: {
      employeeId: bonus.employeeId,
      amount: bonus.amount,
      type: bonus.type,
      reason: bonus.reason,
      paymentDate: bonus.paymentDate,
      approvedBy: userId,
      approvalRemarks: remarks,
      message: `Approved bonus request for ${bonus.amount}`,
      remarks: `Approved bonus request for ${bonus.amount}`,
    },
  });

  console.log("✅ Bonus request approved successfully");

  res.status(200).json({
    success: true,
    message: "Bonus request approved successfully",
    data: bonus,
  });
});

/**
 * Reject a bonus request
 */
const rejectBonusRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { remarks } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  console.log("✍️ Processing bonus rejection for:", id);
  console.log("👤 Rejector:", req.user.firstName, req.user.lastName);

  // Check if user has permission to reject bonuses
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    throw new ApiError(
      403,
      "Only department heads and super admins can reject bonuses"
    );
  }

  const bonus = await Bonus.findById(id);
  if (!bonus) {
    throw new ApiError(404, "Bonus request not found");
  }

  if (bonus.status !== "pending") {
    throw new ApiError(400, "Bonus request is not pending");
  }

  // Update bonus status
  bonus.status = "rejected";
  bonus.approvedBy = userId;
  bonus.approvedAt = new Date();
  bonus.approvalRemarks = remarks || "";
  bonus.updatedBy = userId;
  bonus.updatedAt = new Date();

  await bonus.save();

  // Add audit logging
  await PayrollStatisticsLogger.logBonusAction({
    action: "REJECT",
    bonusId: bonus._id,
    userId: userId,
    details: {
      employeeId: bonus.employeeId,
      amount: bonus.amount,
      type: bonus.type,
      reason: bonus.reason,
      paymentDate: bonus.paymentDate,
      rejectedBy: userId,
      rejectionRemarks: remarks,
      message: `Rejected bonus request for ${bonus.amount}`,
      remarks: `Rejected bonus request for ${bonus.amount}`,
    },
  });

  console.log("✅ Bonus request rejected successfully");

  res.status(200).json({
    success: true,
    message: "Bonus request rejected successfully",
    data: bonus,
  });
});

/**
 * Delete a bonus request (only by creator or admin)
 */
const deleteBonusRequest = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  console.log("🗑️ Deleting bonus request:", id);
  console.log("👤 Deleter:", req.user.firstName, req.user.lastName);

  // Check if user has permission to delete bonuses
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    throw new ApiError(
      403,
      "Only department heads and super admins can delete bonuses"
    );
  }

  const bonus = await Bonus.findById(id);
  if (!bonus) {
    throw new ApiError(404, "Bonus request not found");
  }

  // Store bonus data before deletion for audit
  const deletedBonusData = {
    employeeId: bonus.employeeId,
    amount: bonus.amount,
    type: bonus.type,
    reason: bonus.reason,
    paymentDate: bonus.paymentDate,
    status: bonus.status,
  };

  await Bonus.findByIdAndDelete(id);

  // Add audit logging
  await PayrollStatisticsLogger.logBonusAction({
    action: "DELETE",
    bonusId: bonus._id,
    userId: userId,
    details: {
      ...deletedBonusData,
      deletedBy: userId,
      message: `Deleted bonus request for ${bonus.amount}`,
      remarks: `Deleted bonus request for ${bonus.amount}`,
    },
  });

  console.log("✅ Bonus request deleted successfully");

  res.status(200).json({
    success: true,
    message: "Bonus request deleted successfully",
  });
});

/**
 * Create a bonus for a specific employee in the HOD's department
 * Only HODs and super admins can use this
 */
const createDepartmentEmployeeBonus = asyncHandler(async (req, res) => {
  const { employeeId, amount, reason, paymentDate, type } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Validate required fields
  if (!employeeId || !amount || !reason || !paymentDate) {
    throw new ApiError(
      400,
      "Employee ID, amount, reason, and payment date are required"
    );
  }

  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    throw new ApiError(
      403,
      "Only department heads and super admins can create department employee bonuses"
    );
  }

  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new ApiError(404, "Employee not found");
  }

  if (userRole === "ADMIN") {
    const department = await Department.findOne({ headOfDepartment: userId });
    if (!department) {
      throw new ApiError(403, "You are not a head of department");
    }

    if (employee.department.toString() !== department._id.toString()) {
      throw new ApiError(
        403,
        "You can only create bonuses for employees in your department"
      );
    }
  }

  const approvalStatus = "approved";
  const approvedBy = userId;
  const approvedAt = new Date();

  try {
    const bonus = await Bonus.create({
      employee: employeeId,
      type: type || BonusType.SPECIAL,
      amount,
      reason,
      paymentDate: new Date(paymentDate),
      department: employee.department,
      createdBy: userId,
      updatedBy: userId,
      approvalStatus,
      approvedBy,
      approvedAt,
    });

    // Remove any existing personalBonuses with this bonusId
    await User.findByIdAndUpdate(employeeId, {
      $pull: { personalBonuses: { bonusId: bonus._id } },
    });

    // Add to employee's personalBonuses array with correct structure
    const personalBonus = {
      bonusId: bonus._id,
      status: "APPROVED",
      usedInPayroll: {
        month: null,
        year: null,
        payrollId: null,
      },
    };
    await User.findByIdAndUpdate(employeeId, {
      $push: { personalBonuses: personalBonus },
    });

    // Fetch and log the updated user document
    const updatedUser = await User.findById(employeeId).lean();
    console.log(
      "👤 Updated employee.personalBonuses:",
      JSON.stringify(updatedUser.personalBonuses, null, 2)
    );

    // Add audit logging
    await PayrollStatisticsLogger.logBonusAction({
      action: "CREATE",
      bonusIds: [bonus._id],
      userId: userId,
      details: {
        type: type || BonusType.SPECIAL,
        amount: amount,
        reason: reason,
        paymentDate: paymentDate,
        employeeId: employeeId,
        employeeName: `${employee.firstName} ${employee.lastName}`,
        departmentId: employee.department,
        approvalStatus: approvalStatus,
        createdBy: userId,
        position: req.user.position,
        role: req.user.role,
        message: `Created department employee bonus for ${employee.firstName} ${employee.lastName}`,
      },
      statisticsDetails: {
        bonusType: type || BonusType.SPECIAL,
        amount: amount,
        employeeId: employeeId,
        departmentId: employee.department,
      },
      auditDetails: {
        entity: "BONUS",
        entityIds: [bonus._id],
        action: "CREATE",
        performedBy: userId,
        status: approvalStatus,
        remarks: `Created department employee bonus for ${employee.firstName} ${employee.lastName}`,
      },
    });

    // Log only after successful creation
    console.log(
      `[BONUS REQUEST SUCCESS] User ${userId} created a department employee bonus for employee ${employeeId} with amount ${amount}`
    );

    return res.status(201).json({
      success: true,
      data: bonus,
      message: "Department employee bonus created successfully",
    });
  } catch (error) {
    console.error(
      `[BONUS REQUEST FAILED] User ${userId} failed to create department employee bonus: ${error.message}`
    );
    throw new ApiError(500, "Failed to create department employee bonus");
  }
});

/**
 * Create a bonus for all employees in the HOD's department
 * Only HODs and super admins can use this
 */
const createDepartmentWideBonus = asyncHandler(async (req, res) => {
  const { amount, reason, paymentDate, type, departmentId } = req.body;
  const userId = req.user._id;
  const userRole = req.user.role;

  // Validate required fields
  if (!amount || !reason || !paymentDate) {
    throw new ApiError(400, "Amount, reason, and payment date are required");
  }

  // Check if user is a super admin or HOD
  if (userRole !== "SUPER_ADMIN" && userRole !== "ADMIN") {
    throw new ApiError(
      403,
      "Only department heads and super admins can create department-wide bonuses"
    );
  }

  let department;

  // If user is a HOD, get their department
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
  }
  // If user is a super admin, they can specify a department
  else if (userRole === "SUPER_ADMIN" && departmentId) {
    department = await Department.findById(departmentId);
    if (!department) {
      throw new ApiError(404, "Department not found");
    }
  } else {
    throw new ApiError(400, "Department ID is required for super admins");
  }

  // Get all employees in the department
  const employees = await User.find({
    department: department._id,
    status: "active",
  });

  if (!employees || employees.length === 0) {
    throw new ApiError(404, "No active employees found in this department");
  }

  const approvalStatus = "approved";
  const approvedBy = userId;
  const approvedAt = new Date();

  try {
    // Create a bonus for each employee
    const bonusPromises = employees.map((employee) =>
      Bonus.create({
        employee: employee._id,
        type: type || BonusType.SPECIAL,
        amount,
        reason,
        paymentDate: new Date(paymentDate),
        department: department._id,
        createdBy: userId,
        updatedBy: userId,
        approvalStatus,
        approvedBy,
        approvedAt,
      })
    );

    const bonuses = await Promise.all(bonusPromises);

    // For each employee, update their personalBonuses array
    for (const bonus of bonuses) {
      await User.findByIdAndUpdate(bonus.employee, {
        $pull: { personalBonuses: { bonusId: bonus._id } },
      });
      const personalBonus = {
        bonusId: bonus._id,
        status: "APPROVED",
        usedInPayroll: {
          month: null,
          year: null,
          payrollId: null,
        },
      };
      await User.findByIdAndUpdate(bonus.employee, {
        $push: { personalBonuses: personalBonus },
      });
    }

    // Add audit logging
    await PayrollStatisticsLogger.logBonusAction({
      action: "CREATE",
      bonusIds: bonuses.map((b) => b._id),
      userId: userId,
      details: {
        type: type || BonusType.SPECIAL,
        amount: amount,
        reason: reason,
        paymentDate: paymentDate,
        departmentId: department._id,
        departmentName: department.name,
        employeeCount: employees.length,
        approvalStatus: approvalStatus,
        createdBy: userId,
        position: req.user.position,
        role: req.user.role,
        message: `Created department-wide bonus for ${employees.length} employees in ${department.name}`,
      },
      statisticsDetails: {
        bonusType: type || BonusType.SPECIAL,
        amount: amount,
        departmentId: department._id,
        employeeCount: employees.length,
      },
      auditDetails: {
        entity: "BONUS",
        entityIds: bonuses.map((b) => b._id),
        action: "CREATE",
        performedBy: userId,
        status: approvalStatus,
        remarks: `Created department-wide bonus for ${employees.length} employees in ${department.name}`,
      },
    });

    // Log only after successful creation
    console.log(
      `[BONUS REQUEST SUCCESS] User ${userId} created department-wide bonuses for ${bonuses.length} employees in department ${department._id}`
    );

    return res.status(201).json({
      success: true,
      data: bonuses,
      message: `Department-wide bonus created successfully for ${bonuses.length} employees`,
    });
  } catch (error) {
    console.error(
      `[BONUS REQUEST FAILED] User ${userId} failed to create department-wide bonus: ${error.message}`
    );
    throw new ApiError(500, "Failed to create department-wide bonus");
  }
});

/**
 * Get personal bonuses for the logged-in user
 * This function is specifically for the MyBonus page
 * It only returns bonuses where the user is the employee
 */
const getMyBonuses = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [bonuses, total] = await Promise.all([
      Bonus.find({ employee: userId })
        .sort({ createdAt: -1 })
        .populate("employee", "firstName lastName")
        .populate("department", "name")
        .skip(skip)
        .limit(limit),
      Bonus.countDocuments({ employee: userId }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        bonuses,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      message: "Personal bonuses retrieved successfully",
    });
  } catch (error) {
    console.error(`[GET MY BONUSES FAILED] User ${userId}: ${error.message}`);
    throw new ApiError(500, "Failed to retrieve personal bonuses");
  }
});

export {
  createPersonalBonus,
  getBonusRequests,
  getBonusRequestById,
  approveBonusRequest,
  rejectBonusRequest,
  deleteBonusRequest,
  createDepartmentEmployeeBonus,
  createDepartmentWideBonus,
  getMyBonuses,
};
