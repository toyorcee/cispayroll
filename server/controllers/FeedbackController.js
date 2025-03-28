import { handleError } from "../utils/errorHandler.js";
import { FeedbackService } from "../services/feedbackService.js";

export class FeedbackController {
  static async submitFeedback(req, res) {
    try {
      const { title, category, description, recipientDepartment } = req.body;
      const submittedBy = req.user.id;
      
      const feedback = await FeedbackService.createFeedback({
        title,
        category,
        description,
        recipientDepartment,
        submittedBy,
        isAnonymous: false
      });

      res.status(201).json({
        success: true,
        message: "Feedback submitted successfully",
        feedback
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async submitAnonymousFeedback(req, res) {
    try {
      const { title, category, description, recipientDepartment } = req.body;
      
      const feedback = await FeedbackService.createFeedback({
        title,
        category,
        description,
        recipientDepartment,
        isAnonymous: true
      });

      res.status(201).json({
        success: true,
        message: "Anonymous feedback submitted successfully",
        feedback
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async reportIncident(req, res) {
    try {
      const { title, description, severity, location, dateTime, involvedPersons } = req.body;
      const reportedBy = req.user.id;
      
      const incident = await FeedbackService.createIncident({
        title,
        description,
        severity,
        location,
        dateTime,
        involvedPersons,
        reportedBy
      });

      res.status(201).json({
        success: true,
        message: "Incident reported successfully",
        incident
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getAllFeedback(req, res) {
    try {
      const { page = 1, limit = 10, category, startDate, endDate, status } = req.query;
      
      const feedbackList = await FeedbackService.getAllFeedback({
        page: parseInt(page),
        limit: parseInt(limit),
        category,
        startDate,
        endDate,
        status
      });

      res.status(200).json({
        success: true,
        ...feedbackList
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getDepartmentFeedback(req, res) {
    try {
      const { departmentId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      
      const feedbackList = await FeedbackService.getDepartmentFeedback({
        departmentId,
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.status(200).json({
        success: true,
        ...feedbackList
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getFeedbackAnalytics(req, res) {
    try {
      const { startDate, endDate, departmentId } = req.query;
      
      const analytics = await FeedbackService.getFeedbackAnalytics({
        startDate,
        endDate,
        departmentId
      });

      res.status(200).json({
        success: true,
        analytics
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async createSurvey(req, res) {
    try {
      const { title, description, questions, targetDepartments, expiresAt } = req.body;
      const createdBy = req.user.id;
      
      const survey = await FeedbackService.createSurvey({
        title,
        description,
        questions,
        targetDepartments,
        expiresAt,
        createdBy
      });

      res.status(201).json({
        success: true,
        message: "Survey created successfully",
        survey
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getAllSurveys(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const userId = req.user.id;
      const departmentId = req.user.department;
      
      const surveys = await FeedbackService.getAllSurveys({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        userId,
        departmentId
      });

      res.status(200).json({
        success: true,
        ...surveys
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getSurveyById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const survey = await FeedbackService.getSurveyById(id, userId);

      res.status(200).json({
        success: true,
        survey
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async respondToSurvey(req, res) {
    try {
      const { id } = req.params;
      const { responses } = req.body;
      const userId = req.user.id;
      
      const result = await FeedbackService.respondToSurvey(id, userId, responses);

      res.status(200).json({
        success: true,
        message: "Survey response submitted successfully",
        result
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateFeedbackStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, comments } = req.body;
      const updatedBy = req.user.id;
      
      const feedback = await FeedbackService.updateFeedbackStatus(id, {
        status,
        comments,
        updatedBy
      });

      res.status(200).json({
        success: true,
        message: `Feedback ${status.toLowerCase()} successfully`,
        feedback
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async getAllIncidents(req, res) {
    try {
      const { page = 1, limit = 10, status, startDate, endDate } = req.query;
      
      const incidentsList = await FeedbackService.getAllIncidents({
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        ...incidentsList
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateIncidentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, comments } = req.body;
      const updatedBy = req.user.id;
      
      const incident = await FeedbackService.updateIncidentStatus(id, {
        status,
        comments,
        updatedBy
      });

      res.status(200).json({
        success: true,
        message: `Incident ${status.toLowerCase()} successfully`,
        incident
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async updateSurvey(req, res) {
    try {
      const { id } = req.params;
      const { title, description, questions, targetDepartments, expiresAt, status } = req.body;
      const updatedBy = req.user.id;
      
      const survey = await FeedbackService.updateSurvey(id, {
        title,
        description,
        questions,
        targetDepartments,
        expiresAt,
        status,
        updatedBy
      });

      res.status(200).json({
        success: true,
        message: "Survey updated successfully",
        survey
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }

  static async deleteSurvey(req, res) {
    try {
      const { id } = req.params;
      
      const result = await FeedbackService.deleteSurvey(id);

      res.status(200).json({
        success: true,
        message: "Survey deleted successfully"
      });
    } catch (error) {
      const { statusCode, message } = handleError(error);
      res.status(statusCode).json({ success: false, message });
    }
  }
} 