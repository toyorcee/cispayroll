import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { traceError, ApiError } from "./utils/errorHandler.js";
import multer from "multer";
import fs, { readdirSync, existsSync } from "fs";
import { startAutomatedPayrollTask } from "./services/AutomatedPayrollService.js";
import payrollSummaryRoutes from "./routes/payrollSummaryRoutes.js";

// Environment
dotenv.config();
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

// Express app setup
const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Uploads Directory Setup
const uploadsDir = path.join(process.cwd(), "uploads", "profiles");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// MongoDB Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`🟢 MongoDB Connected: ${conn.connection.host}`);
    mongoose.connection.on("error", (error) =>
      console.error("MongoDB Error:", error)
    );
    mongoose.connection.on("disconnected", () =>
      console.warn("MongoDB Disconnected")
    );
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    setTimeout(connectDB, 5000);
  }
};

// Global Process Error Listeners
process.on("unhandledRejection", (reason, promise) =>
  console.error("Unhandled Promise Rejection:", reason)
);
process.on("uncaughtException", (error) =>
  console.error("Uncaught Exception:", error)
);

// Middleware
app.use((req, _res, next) => {
  console.log(`📥 ${req.method} ${req.url}`);
  next();
});

app.use((req, res, next) => {
  const oldJson = res.json;
  res.json = function (data) {
    console.log(`📤 ${req.method} ${req.url} - Status: ${res.statusCode}`);
    return oldJson.call(this, data);
  };
  next();
});

app.use(
  cors({
    origin: isDevelopment ? "http://localhost:5173" : process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Content-Length",
      "X-Requested-With",
    ],
    exposedHeaders: ["Set-Cookie", "set-cookie"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);

app.use(cookieParser());
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
    limit: "50mb",
  })
);

// MIME Header Fix
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  if (req.url.endsWith(".ts")) {
    res.setHeader("Content-Type", "application/typescript");
  }
  next();
});

// Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    allowedTypes.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Invalid file type."));
  },
});

// Routes Import
import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import regularUserRoutes from "./routes/regularUserRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import invitationRoutes from "./routes/invitationRoutes.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";
import offboardingRoutes from "./routes/offboardingRoutes.js";
import disciplinaryRoutes from "./routes/disciplinaryRoutes.js";
import feedbackRoute from "./routes/feedbackRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import passwordRoutes from "./routes/passwordRoutes.js";
import deductionRoutes from "./routes/deductionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import notificationPreferenceRoutes from "./routes/notificationPreferenceRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import bonusRoutes from "./routes/BonusRoutes.js";
import allowanceRoutes from "./routes/allowanceRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";

// Error Wrapper
const routeErrorWrapper = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    console.error("🔴 Route Error:", error);
    next(error);
  }
};

// Route Registrations
app.use("/api/auth", routeErrorWrapper(authRoutes));
app.use("/api/super-admin", routeErrorWrapper(superAdminRoutes));
app.use("/api/admin", routeErrorWrapper(adminRoutes));
app.use("/api/regular-user", routeErrorWrapper(regularUserRoutes));
app.use("/api/employee", routeErrorWrapper(employeeRoutes));
app.use("/api/invitation", routeErrorWrapper(invitationRoutes));
app.use("/api/onboarding", routeErrorWrapper(onboardingRoutes));
app.use("/api/offboarding", routeErrorWrapper(offboardingRoutes));
app.use("/api/bonus", routeErrorWrapper(bonusRoutes));
app.use("/api/disciplinary", routeErrorWrapper(disciplinaryRoutes));
app.use("/api/feedback", routeErrorWrapper(feedbackRoute));
app.use("/api/departments", routeErrorWrapper(departmentRoutes));
app.use("/api/password", routeErrorWrapper(passwordRoutes));
app.use("/api/deductions", routeErrorWrapper(deductionRoutes));
app.use("/api/notifications", routeErrorWrapper(notificationRoutes));
app.use(
  "/api/notification-preferences",
  routeErrorWrapper(notificationPreferenceRoutes)
);
app.use("/api/approvals", routeErrorWrapper(approvalRoutes));
app.use("/api/audit", routeErrorWrapper(auditRoutes));
app.use("/api/leaves", routeErrorWrapper(leaveRoutes));
app.use("/api/allowances", routeErrorWrapper(allowanceRoutes));
app.use("/api/test", routeErrorWrapper(testRoutes));
app.use("/api/profile", profileRoutes);
app.use("/api/settings", routeErrorWrapper(settingsRoutes));
app.use("/api/payroll-summaries", payrollSummaryRoutes);

// Health Check
app.get("/api/health", (_req, res) =>
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  })
);

// Email Configuration Test (No auth required for quick testing)
app.get("/api/email-test", async (_req, res) => {
  try {
    console.log("🧪 [Server] Testing email configuration...");

    // Check environment variables
    const config = {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT || 587,
      encryption: process.env.MAIL_ENCRYPTION,
      username: process.env.MAIL_USERNAME || process.env.EMAIL_USER,
      password:
        process.env.MAIL_PASSWORD || process.env.EMAIL_PASSWORD
          ? "***SET***"
          : "NOT SET",
      fromAddress: process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM,
      fromName: process.env.MAIL_FROM_NAME || "Personnel Management System",
    };

    console.log("🔧 [Server] Email configuration:", config);

    // Check for missing required variables
    const missing = [];
    if (!config.host) missing.push("MAIL_HOST");
    if (!config.username) missing.push("MAIL_USERNAME or EMAIL_USER");
    if (!config.password || config.password === "NOT SET")
      missing.push("MAIL_PASSWORD or EMAIL_PASSWORD");
    if (!config.fromAddress) missing.push("MAIL_FROM_ADDRESS or EMAIL_FROM");

    if (missing.length > 0) {
      return res.json({
        success: false,
        error: `Missing environment variables: ${missing.join(", ")}`,
        config: { ...config, password: "***HIDDEN***" },
      });
    }

    // Import EmailService dynamically to avoid circular dependencies
    const { EmailService } = await import("./services/emailService.js");
    const result = await EmailService.testEmailConfiguration();

    res.json({
      success: true,
      message: "Email configuration test completed",
      result,
    });
  } catch (error) {
    console.error("❌ [Server] Email configuration test failed:", error);
    res.status(500).json({
      success: false,
      message: "Email configuration test failed",
      error: error.message,
    });
  }
});

// Static Files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get(
  "/uploads/profiles/:filename",
  (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  },
  express.static(path.join(process.cwd(), "uploads", "profiles"))
);

// Production: Serve React App
if (isProduction) {
  const clientBuildPath = path.join(__dirname, "../client/dist");
  console.log("🔍 Production client path:", clientBuildPath);

  if (existsSync(clientBuildPath)) {
    console.log("📂 Client build found, serving static files");

    // Serve static files from the React build
    app.use(express.static(clientBuildPath));

    // Handle React routing, return all requests to React app
    app.get("*", (req, res) => {
      res.sendFile(path.join(clientBuildPath, "index.html"));
    });
  } else {
    console.error("❌ Client build not found at:", clientBuildPath);
    console.log(
      "📂 Available directories:",
      readdirSync(path.dirname(clientBuildPath))
    );
  }
} else {
  // Development: Default Route
  app.get("/", (req, res) => {
    res.send("API is running...");
  });
}

// 404 Route (only for development or if production static serving fails)
if (!isProduction) {
  app.use((_req, res) => {
    res.status(404).json({ message: "Route not found" });
  });
}

// Error Handler
app.use((err, req, res, next) => {
  const error = traceError(
    err,
    `Global Error Handler: ${req.method} ${req.url}`
  );
  const statusCode = error.statusCode || 500;
  const message =
    error instanceof ApiError
      ? error.message
      : error.message || "Internal server error";
  res.status(statusCode).json({
    success: false,
    message,
    error:
      process.env.NODE_ENV === "development"
        ? { message: error.message, stack: error.stack }
        : undefined,
  });
});

// Dev Routes
if (isDevelopment) {
  import("./routes/testRoutes.js").then((testRoutes) => {
    app.use("/api/test", testRoutes.default);
  });
}

// Connect to DB and start server
connectDB().then(() => {
  startAutomatedPayrollTask();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
});
