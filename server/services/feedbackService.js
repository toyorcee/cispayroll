import { ApiError } from "../utils/errorHandler.js";
import Feedback from "../models/Feedback.js";
import Survey from "../models/Survey.js";
import Incident from "../models/Incident.js";
import SurveyResponse from "../models/SurveyResponse.js";
import Department from "../models/Department.js";
import mongoose from "mongoose";

export class FeedbackService {
  static async createFeedback(data) {
    try {
      const feedbackData = {...data};
      
      // Check if recipientDepartment is a string and not already an ObjectId
      if (feedbackData.recipientDepartment && 
          typeof feedbackData.recipientDepartment === 'string' && 
          !mongoose.isValidObjectId(feedbackData.recipientDepartment)) {
        
        // Look up department by name or code
        const department = await Department.findOne({ 
          $or: [
            { name: feedbackData.recipientDepartment },
            { code: feedbackData.recipientDepartment }
          ]
        });
        
        if (department) {
          feedbackData.recipientDepartment = department._id;
        } else {
          // If no department found, set to null or remove
          delete feedbackData.recipientDepartment;
        }
      }
      
      const feedback = await Feedback.create(feedbackData);
      return feedback;
    } catch (error) {
      console.error("Error creating feedback:", error);
      throw new ApiError(500, `Failed to create feedback: ${error.message}`);
    }
  }

  static async createIncident(data) {
    try {
      const incident = await Incident.create(data);
      return incident;
    } catch (error) {
      console.error("Error reporting incident:", error);
      throw new ApiError(500, `Failed to report incident: ${error.message}`);
    }
  }

  static async getAllFeedback(options) {
    try {
      const { page, limit, category, startDate, endDate, status } = options;
      
      const query = {};
      
      if (category) query.category = category;
      if (status) query.status = status;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      const totalCount = await Feedback.countDocuments(query);
      const feedback = await Feedback.find(query)
        .populate("submittedBy", "firstName lastName")
        .populate("recipientDepartment", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      
      return {
        feedback,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      console.error("Error fetching feedback:", error);
      throw new ApiError(500, `Failed to fetch feedback: ${error.message}`);
    }
  }

  static async getDepartmentFeedback(options) {
    try {
      const { departmentId, page, limit } = options;
      
      const query = {
        recipientDepartment: departmentId
      };
      
      const totalCount = await Feedback.countDocuments(query);
      const feedback = await Feedback.find(query)
        .populate("submittedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      
      return {
        feedback,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      console.error("Error fetching department feedback:", error);
      throw new ApiError(500, `Failed to fetch department feedback: ${error.message}`);
    }
  }

  static async getFeedbackAnalytics(options) {
    try {
      const { startDate, endDate, departmentId } = options;
      
      const timeQuery = {};
      if (startDate || endDate) {
        timeQuery.createdAt = {};
        if (startDate) timeQuery.createdAt.$gte = new Date(startDate);
        if (endDate) timeQuery.createdAt.$lte = new Date(endDate);
      }
      
      // Base queries
      const feedbackQuery = { ...timeQuery };
      const incidentQuery = { ...timeQuery };
      
      // Add department filter if provided
      if (departmentId) {
        feedbackQuery.recipientDepartment = departmentId;
        incidentQuery.department = departmentId;
      }
      
      // Get counts
      const totalFeedback = await Feedback.countDocuments(feedbackQuery);
      const totalIncidents = await Incident.countDocuments(incidentQuery);
      const resolvedFeedback = await Feedback.countDocuments({
        ...feedbackQuery,
        status: "Resolved"
      });
      const pendingFeedback = await Feedback.countDocuments({
        ...feedbackQuery,
        status: "Pending"
      });
      
      // Category breakdown
      const categoryBreakdown = await Feedback.aggregate([
        { $match: feedbackQuery },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $project: { name: "$_id", count: 1, _id: 0 } }
      ]);
      
      // Department breakdown if no specific department is selected
      let departmentBreakdown = [];
      if (!departmentId) {
        departmentBreakdown = await Feedback.aggregate([
          { $match: feedbackQuery },
          { $group: { _id: "$recipientDepartment", count: { $sum: 1 } } },
          { $project: { name: "$_id", count: 1, _id: 0 } }
        ]);
      }
      
      return {
        totalFeedback,
        totalIncidents,
        resolvedFeedback,
        pendingFeedback,
        categoryBreakdown,
        departmentBreakdown
      };
    } catch (error) {
      console.error("Error generating feedback analytics:", error);
      throw new ApiError(500, `Failed to generate analytics: ${error.message}`);
    }
  }

  static async createSurvey(data) {
    try {
      const survey = await Survey.create(data);
      return survey;
    } catch (error) {
      console.error("Error creating survey:", error);
      throw new ApiError(500, `Failed to create survey: ${error.message}`);
    }
  }

  static async getAllSurveys(options) {
    try {
      const { page, limit, status, userId, departmentId } = options;
      
      const query = {};
      
      if (status) query.status = status;
      
      // For regular users, only show surveys targeted to their department
      if (departmentId) {
        query.$or = [
          { targetDepartments: { $in: [departmentId] } },
          { targetDepartments: { $size: 0 } } // Empty array means all departments
        ];
      }
      
      const totalCount = await Survey.countDocuments(query);
      const surveys = await Survey.find(query)
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      
      // For each survey, check if the user has already responded
      const surveysWithResponseStatus = await Promise.all(
        surveys.map(async (survey) => {
          const surveyObj = survey.toObject();
          if (userId) {
            const response = await SurveyResponse.findOne({
              survey: survey._id,
              respondent: userId
            });
            surveyObj.hasResponded = !!response;
          }
          return surveyObj;
        })
      );
      
      return {
        surveys: surveysWithResponseStatus,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      console.error("Error fetching surveys:", error);
      throw new ApiError(500, `Failed to fetch surveys: ${error.message}`);
    }
  }

  static async getSurveyById(id, userId) {
    try {
      const survey = await Survey.findById(id)
        .populate("createdBy", "firstName lastName");
      
      if (!survey) {
        throw new ApiError(404, "Survey not found");
      }
      
      const surveyObj = survey.toObject();
      
      // Check if user has already responded
      if (userId) {
        const response = await SurveyResponse.findOne({
          survey: survey._id,
          respondent: userId
        });
        surveyObj.hasResponded = !!response;
        surveyObj.userResponse = response;
      }
      
      return surveyObj;
    } catch (error) {
      console.error("Error fetching survey:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to fetch survey: ${error.message}`);
    }
  }

  static async respondToSurvey(surveyId, userId, responses) {
    try {
      // Check if survey exists
      const survey = await Survey.findById(surveyId);
      if (!survey) {
        throw new ApiError(404, "Survey not found");
      }
      
      // Check if user has already responded
      const existingResponse = await SurveyResponse.findOne({
        survey: surveyId,
        respondent: userId
      });
      
      if (existingResponse) {
        throw new ApiError(400, "You have already responded to this survey");
      }
      
      // Create response
      const surveyResponse = await SurveyResponse.create({
        survey: surveyId,
        respondent: userId,
        responses
      });
      
      return surveyResponse;
    } catch (error) {
      console.error("Error responding to survey:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to respond to survey: ${error.message}`);
    }
  }

  static async updateFeedbackStatus(id, data) {
    try {
      const { status, comments, updatedBy } = data;
      
      const feedback = await Feedback.findById(id);
      if (!feedback) {
        throw new ApiError(404, "Feedback not found");
      }
      
      feedback.status = status;
      if (comments) feedback.adminComments = comments;
      feedback.updatedBy = updatedBy;
      feedback.updatedAt = new Date();
      
      await feedback.save();
      
      return feedback;
    } catch (error) {
      console.error("Error updating feedback status:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to update feedback status: ${error.message}`);
    }
  }

  static async getAllIncidents(options) {
    try {
      const { page, limit, status, startDate, endDate } = options;
      
      const query = {};
      
      if (status) query.status = status;
      
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }
      
      const totalCount = await Incident.countDocuments(query);
      const incidents = await Incident.find(query)
        .populate("reportedBy", "firstName lastName")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);
      
      return {
        incidents,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page
      };
    } catch (error) {
      console.error("Error fetching incidents:", error);
      throw new ApiError(500, `Failed to fetch incidents: ${error.message}`);
    }
  }

  static async updateIncidentStatus(id, data) {
    try {
      const { status, comments, updatedBy } = data;
      
      const incident = await Incident.findById(id);
      if (!incident) {
        throw new ApiError(404, "Incident not found");
      }
      
      incident.status = status;
      if (comments) incident.adminComments = comments;
      incident.updatedBy = updatedBy;
      incident.updatedAt = new Date();
      
      await incident.save();
      
      return incident;
    } catch (error) {
      console.error("Error updating incident status:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to update incident status: ${error.message}`);
    }
  }

  static async updateSurvey(id, data) {
    try {
      const survey = await Survey.findById(id);
      if (!survey) {
        throw new ApiError(404, "Survey not found");
      }
      
      // Update the survey with new data
      Object.keys(data).forEach(key => {
        survey[key] = data[key];
      });
      
      await survey.save();
      return survey;
    } catch (error) {
      console.error("Error updating survey:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to update survey: ${error.message}`);
    }
  }

  static async deleteSurvey(id) {
    try {
      const survey = await Survey.findById(id);
      if (!survey) {
        throw new ApiError(404, "Survey not found");
      }
      
      // Delete all responses to this survey
      await SurveyResponse.deleteMany({ survey: id });
      
      // Delete the survey
      await Survey.findByIdAndDelete(id);
      
      return { success: true };
    } catch (error) {
      console.error("Error deleting survey:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError(500, `Failed to delete survey: ${error.message}`);
    }
  }
} 