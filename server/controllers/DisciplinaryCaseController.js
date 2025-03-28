import DisciplinaryCase from "../models/DisciplinaryCase.js"; // Use ES module import
import multer from "multer";

// Multer configuration to handle files and text
const upload = multer({ storage: multer.memoryStorage() });
// Create a new disciplinary case
// Create a new disciplinary case
export const createCase = async (req, res) => {
  try {
    const { title, incidentDetails, employee, date } = req.body;
    
    // Multer handles the file and attaches it to req.file if uploaded
    const evidencePath = req.file ? `/uploads/${req.file.filename}` : "";

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
      evidence: evidencePath, // Save the file path in the database
    });

    await newCase.save();
    res.status(201).json(newCase);
  } catch (error) {
    console.error("Error saving case:", error);
    res.status(500).json({ error: "Failed to create the case" });
  }
};

  export const getAllCases = async (req, res) => {
    try {
      const activeCases = await DisciplinaryCase.find({ status: "Active" }).populate("employee", "firstName lastName");
      res.status(200).json(activeCases);
    } catch (error) {
      console.error("Error fetching active cases:", error);
      res.status(500).json({ error: "Failed to fetch active cases. Please try again later." });
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

  export const deleteAllCases = async (req, res) => {
    try {
      const result = await DisciplinaryCase.deleteMany({});
      res.status(200).json({ message: `${result.deletedCount} cases deleted successfully.` });
    } catch (error) {
      console.error("Error deleting all cases:", error);
      res.status(500).json({ error: "Failed to delete cases. Please try again later." });
    }
  };

  // Controller for chart data
export const getCaseStatistics = async (req, res) => {
  try {
    const activeCount = await DisciplinaryCase.countDocuments({ status: "Active" });
    const resolvedCount = await DisciplinaryCase.countDocuments({ status: "Resolved" });
    const pendingCount = await DisciplinaryCase.countDocuments({ status: "Pending" });

    res.status(200).json({
      labels: ["Active", "Resolved", "Pending"],
      counts: [activeCount, resolvedCount, pendingCount],
    });
  } catch (error) {
    console.error("Error fetching case statistics:", error);
    res.status(500).json({ error: "Failed to fetch case statistics." });
  }
};

