import Joi from "joi";
import { handleError } from "../utils/errorHandler.js";

// Separate schema for creation (without HOD requirement)
const createDepartmentSchema = Joi.object({
  name: Joi.string().required().trim(),
  code: Joi.string().required().trim(),
  description: Joi.string().required().trim(),
  location: Joi.string().required().trim(),
});

// Schema for updates (with optional HOD)
const updateDepartmentSchema = Joi.object({
  name: Joi.string().trim(),
  code: Joi.string().trim(),
  description: Joi.string().trim(),
  location: Joi.string().trim(),
  headOfDepartment: Joi.string(), 
});

export const validateCreateDepartment = (req, res, next) => {
  try {
    const { error } = createDepartmentSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }
    next();
  } catch (error) {
    handleError(error, res);
  }
};

export const validateUpdateDepartment = (req, res, next) => {
  try {
    const { error } = updateDepartmentSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: error.details.map((err) => err.message),
      });
    }
    next();
  } catch (error) {
    handleError(error, res);
  }
};
