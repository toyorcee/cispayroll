export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

export const handleError = (error: any) => {
  // Mongoose duplicate key error
  if (error.code === 11000) {
    return {
      statusCode: 400,
      message: "Duplicate field value entered",
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
    statusCode: 500,
    message: "Internal server error",
  };
};
