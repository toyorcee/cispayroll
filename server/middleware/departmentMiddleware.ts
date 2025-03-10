import { Response, NextFunction } from "express";
import Joi from "joi";
import { AuthenticatedRequest } from "./authMiddleware.js";

// Define Joi validation schema
const departmentSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim().messages({
    "string.min": "Department name must be at least 2 characters long",
    "string.max": "Department name cannot exceed 100 characters",
    "any.required": "Department name is required",
  }),

  code: Joi.string()
    .pattern(/^[A-Z0-9]{2,10}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Department code must be 2-10 uppercase letters/numbers",
      "any.required": "Department code is required",
    }),

  description: Joi.string().min(10).max(500).required().trim().messages({
    "string.min": "Description must be at least 10 characters long",
    "string.max": "Description cannot exceed 500 characters",
    "any.required": "Description is required",
  }),

  headOfDepartment: Joi.string().required().messages({
    "any.required": "Head of department is required",
  }),

  location: Joi.string().min(2).max(100).required().trim().messages({
    "string.min": "Location must be at least 2 characters long",
    "string.max": "Location cannot exceed 100 characters",
    "any.required": "Location is required",
  }),

  email: Joi.string().email().optional().messages({
    "string.email": "Please provide a valid email address",
  }),

  phone: Joi.string()
    .optional()
    .pattern(/^\+?[\d\s-]+$/)
    .messages({
      "string.pattern.base": "Please provide a valid phone number",
    }),
});

// Fix the type issues by properly typing the middleware
export const validateDepartment = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  const { error, value } = departmentSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
    return;
  }

  // Update the request body with validated and sanitized data
  req.body = value;
  next();
};
