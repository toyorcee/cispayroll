import { ApiError } from "../utils/errorHandler.js";
import { Types } from "mongoose";

export const validateObjectId = (paramName) => {
  return (req, res, next) => {
    try {
      const id = req.params[paramName];
      if (!Types.ObjectId.isValid(id)) {
        throw new ApiError(400, `Invalid ${paramName} format`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateSignup = (req, res, next) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      phone,
      employeeId,
      position,
      gradeLevel,
      workLocation,
      dateJoined,
      emergencyContact,
      bankDetails,
    } = req.body;

    // Check required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !phone ||
      !employeeId
    ) {
      throw new ApiError(400, "Please provide all required fields");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ApiError(400, "Please provide a valid email");
    }

    // Validate password length
    if (password.length < 6) {
      throw new ApiError(400, "Password must be at least 6 characters");
    }

    // Validate employee details
    if (!position || !gradeLevel || !workLocation || !dateJoined) {
      throw new ApiError(400, "Please provide all employee details");
    }

    // Validate emergency contact
    if (
      !emergencyContact?.name ||
      !emergencyContact?.relationship ||
      !emergencyContact?.phone
    ) {
      throw new ApiError(400, "Please provide all emergency contact details");
    }

    // Validate bank details
    if (
      !bankDetails?.bankName ||
      !bankDetails?.accountNumber ||
      !bankDetails?.accountName
    ) {
      throw new ApiError(400, "Please provide all bank details");
    }

    next();
  } catch (error) {
    next(error);
  }
};
