import { Request, Response, NextFunction } from "express";

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const handleError = (error: any) => {
  console.error("Error details:", error);

  // Handle MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    const value = error.keyValue[field];
    return {
      statusCode: 400,
      message: `${
        field.charAt(0).toUpperCase() + field.slice(1)
      } '${value}' already exists`,
    };
  }

  // Mongoose validation error
  if (error.name === "ValidationError") {
    return {
      statusCode: 400,
      message: Object.values(error.errors)
        .map((err: any) => err.message)
        .join(", "),
    };
  }

  // Custom API error
  if (error instanceof ApiError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
    };
  }

  // Default server error
  console.error("Server Error:", error);
  return {
    statusCode: error.statusCode || 500,
    message: error.message || "Internal server error",
  };
};

export const traceError = (error: any, context: string) => {
  console.error(`🔍 Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    code: error.code,
    name: error.name,
  });
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error("🚨 AsyncHandler caught error:", {
        path: req.path,
        error: error.message,
        stack: error.stack,
      });
      next(error);
    });
  };
};
