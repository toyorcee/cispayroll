// server.ts
import express, { Express, Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { traceError } from "./utils/errorHandler.js";

// Route Imports
import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import regularUserRoutes from "./routes/regularUserRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";

// Load environment variables
dotenv.config();

// Enhanced error tracking
const logServerError = (error: any, context: string) => {
  console.error(`🔴 ${context}:`, {
    message: error.message,
    stack: error.stack,
    time: new Date().toISOString(),
  });
};

// Request logger middleware
const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
};

// Response logger middleware
const responseLogger = (req: Request, res: Response, next: NextFunction) => {
  const oldJson = res.json;
  res.json = function (data) {
    console.log(
      `📤 ${new Date().toISOString()} - ${req.method} ${req.url} - Status: ${
        res.statusCode
      }`
    );
    return oldJson.call(this, data);
  };
  next();
};

// Database connection with enhanced logging
const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!);
    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);

    // Monitor database events
    mongoose.connection.on("error", (error) => {
      logServerError(error, "MongoDB Error");
    });

    mongoose.connection.on("disconnected", () => {
      console.log("🔴 MongoDB Disconnected");
    });
  } catch (error) {
    logServerError(error, "MongoDB Connection Error");
    console.error("❌ Error details:", error);
    setTimeout(connectDB, 5000);
  }
};

// Initialize Express with enhanced error handling
const app: Express = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Global error handlers with more detail
process.on("unhandledRejection", (reason, promise) => {
  logServerError({ reason, promise }, "Unhandled Promise Rejection");
  console.error("🔴 Promise details:", promise);
});

process.on("uncaughtException", (error) => {
  logServerError(error, "Uncaught Exception");
  console.error("🔴 Error details:", error);
});

// Middleware with logging
app.use(requestLogger);
app.use(responseLogger);
app.use(
  cors({
    credentials: true,
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json());

// Route error wrapper
const routeErrorWrapper = (handler: Function) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      logServerError(error, `Route Error: ${req.method} ${req.url}`);
      next(error);
    }
  };
};

// Wrap your route handlers
app.use("/api/auth", routeErrorWrapper(authRoutes));
app.use("/api/admin", routeErrorWrapper(adminRoutes));
app.use("/api/super-admin", routeErrorWrapper(superAdminRoutes));
app.use("/api/leave", routeErrorWrapper(leaveRoutes));
app.use("/api/users", routeErrorWrapper(regularUserRoutes));
app.use("/api/employees", routeErrorWrapper(employeeRoutes));
app.use("/api/invitation", routeErrorWrapper(invitationRoutes));
app.use("/api/onboarding", routeErrorWrapper(onboardingRoutes));

// Enhanced health check
app.get("/api/health", (_req: Request, res: Response) => {
  const health = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };
  res.json(health);
});

// Enhanced error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const error = traceError(
    err,
    `Global Error Handler: ${req.method} ${req.url}`
  );
  console.error("❌ Full error details:", {
    error,
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
    headers: req.headers,
  });

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "development"
        ? {
            message: error.message,
            stack: error.stack,
          }
        : undefined,
  });
});

// Not Found Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Route not found" });
});

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Your test route for development
if (process.env.NODE_ENV === "development") {
  import("./routes/testRoutes.js").then((testRoutes) => {
    app.use("/api/test", testRoutes.default);
  });
}

// Start server with enhanced logging
const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`
🚀 Server is running!
📡 Port: ${PORT}
🌍 Environment: ${process.env.NODE_ENV}
🔗 Client URL: ${process.env.CLIENT_URL || "http://localhost:5173"}
      `);
    });
  } catch (error) {
    logServerError(error, "Server Startup Error");
    process.exit(1);
  }
};

startServer();

// Update your package.json to include this debug script:
// "debug": "NODE_ENV=development DEBUG=* nodemon --inspect server.ts"
