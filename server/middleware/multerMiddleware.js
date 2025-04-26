import multer from "multer";
import path from "path";
import { ApiError } from "../utils/errorHandler.js";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = path.join(process.cwd(), "uploads", "profiles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
    return cb(
      new ApiError(400, "Only image files (jpg, jpeg, png, gif) are allowed!")
    );
  }

  // Check file size (5MB limit)
  if (file.size > 5 * 1024 * 1024) {
    return cb(new ApiError(400, "File size must be less than 5MB"));
  }

  cb(null, true);
};

// Create multer instance
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});
