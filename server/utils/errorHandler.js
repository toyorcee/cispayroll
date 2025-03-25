/**
 * Custom API Error class for handling application-specific errors
 */
export class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code for the error
   * @param {string} message - Error message
   */
  constructor(statusCode, message) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
  }
}

/**
 * Handles different types of errors and returns appropriate error responses
 * @param {Error} error - The error object to handle
 * @returns {Object} Formatted error response with status code and message
 */
export const handleError = (error) => {
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
        .map((err) => err.message)
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

/**
 * Traces and logs error details with context
 * @param {Error} error - The error object to trace
 * @param {string} context - The context where the error occurred
 * @returns {Error} The original error object
 */
export const traceError = (error, context) => {
  console.error(`🔍 Error in ${context}:`, {
    message: error.message,
    stack: error.stack,
    code: error.code,
    name: error.name,
  });
  return error;
};

/**
 * Wraps async route handlers to catch and forward errors
 * @param {Function} fn - The async route handler function
 * @returns {Function} Wrapped route handler with error handling
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
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