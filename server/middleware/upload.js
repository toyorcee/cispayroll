import multer from "multer";
import path from "path";

// Set storage engine for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Files will be saved to the 'uploads/' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname); // Ensure unique filenames by prepending a timestamp
  },
});

// Configure Multer
export const upload = multer({ storage });
