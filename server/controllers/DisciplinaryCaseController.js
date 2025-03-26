import DisciplinaryCase from "../models/DisciplinaryCase.js"; // Use ES module import
import multer from "multer";

// Multer configuration to handle files and text
const upload = multer({ storage: multer.memoryStorage() });
// Create a new disciplinary case
// Create a new disciplinary case
    export const createCase = async (req, res) => {
        upload.single("evidenceFiles")(req, res, async (err) => {
        if (err) {
            return res.status(500).json({ error: "File upload error" });
        }
    
        try {
            const { title, incidentDetails, employee, date } = req.body;
            const evidence = req.file ? req.file.originalname : ""; // Handle file name
    
            // Validation
            if (!title || !incidentDetails || !employee || !date) {
            return res.status(400).json({ error: "All fields are required except evidence." });
            }
    
            // Create and save case
            const newCase = new DisciplinaryCase({
            title,
            description: incidentDetails,
            employee,
            date,
            evidence,
            });
    
            await newCase.save();
            res.status(201).json(newCase);
        } catch (error) {
            console.error("Error saving case:", error);
            res.status(500).json({ error: "Failed to create the case" });
        }
        });
    };

// Get all cases
export const getAllCases = async (req, res) => {
  try {
    const cases = await DisciplinaryCase.find();
    res.status(200).json(cases);
  } catch (error) {
    console.error("Error fetching cases:", error);
    res.status(500).json({ error: "Failed to fetch cases. Please try again later." });
  }
};

// Get case by ID
export const getCaseById = async (req, res) => {
  try {
    const caseId = req.params.id;

    // Handle invalid or missing ID
    if (!caseId) return res.status(400).json({ error: "Case ID is required." });

    const caseDetails = await DisciplinaryCase.findById(caseId);
    if (!caseDetails) {
      return res.status(404).json({ error: "Case not found." });
    }
    res.status(200).json(caseDetails);
  } catch (error) {
    console.error("Error fetching case details:", error);
    res.status(500).json({ error: "Failed to fetch case details. Please try again later." });
  }
};

// Update a case (resolve or approve)
export const updateCaseStatus = async (req, res) => {
  try {
    const caseId = req.params.id;
    const { status, updateMessage } = req.body;

    // Handle missing or invalid input
    if (!status || !updateMessage) {
      return res.status(400).json({ error: "Status and update message are required." });
    }

    const updatedCase = await DisciplinaryCase.findByIdAndUpdate(
      caseId,
      { status, $push: { tracking: { update: updateMessage } } },
      { new: true, runValidators: true } // Apply validation and return updated doc
    );
    if (!updatedCase) {
      return res.status(404).json({ error: "Case not found." });
    }
    res.status(200).json({ message: "Case updated successfully!", case: updatedCase });
  } catch (error) {
    console.error("Error updating case status:", error);
    res.status(500).json({ error: "Failed to update case status. Please try again later." });
  }
};
