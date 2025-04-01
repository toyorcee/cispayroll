// Create a new middleware for deduction access control
export const validateDeductionAccess = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.user.id).populate("department");

    // Super Admin can access everything
    if (user.role === UserRole.SUPER_ADMIN) {
      return next();
    }

    // Admin can only access their department's deductions
    if (user.role === UserRole.ADMIN) {
      if (!user.department) {
        throw new ApiError(400, "Admin must be assigned to a department");
      }

      // Add department context to request
      req.departmentContext = user.department._id;
      return next();
    }

    // Regular users can only view their assigned deductions
    if (user.role === UserRole.USER) {
      req.userContext = user._id;
      return next();
    }

    throw new ApiError(403, "Unauthorized access to deductions");
  } catch (error) {
    next(error);
  }
};
