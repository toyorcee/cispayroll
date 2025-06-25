import nodemailer from "nodemailer";
import { config } from "dotenv";
import { UserLifecycleState } from "../models/User.js";
import { ApiError } from "../utils/errorHandler.js";
import { UserRole } from "../models/User.js";
import UserModel from "../models/User.js";
import * as NotificationPreferenceImport from "../models/NotificationPreference.js";
const NotificationPreference = NotificationPreferenceImport.default;

// Load environment variables
config();

export class EmailService {
  static transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT) || 587,
    secure: process.env.MAIL_ENCRYPTION === "ssl",
    auth: {
      user: process.env.MAIL_USERNAME || process.env.EMAIL_USER,
      pass: process.env.MAIL_PASSWORD || process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
    debug: true,
  });

  static async testEmailConfiguration() {
    console.log("🧪 [EmailService] Testing email configuration...");

    // Check environment variables (support both new and legacy names)
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
      clientUrl: process.env.CLIENT_URL,
    };

    console.log("🔧 [EmailService] Current configuration:", config);

    // Check for missing required variables
    const missing = [];
    if (!config.host) missing.push("MAIL_HOST");
    if (!config.username) missing.push("MAIL_USERNAME or EMAIL_USER");
    if (!config.password || config.password === "NOT SET")
      missing.push("MAIL_PASSWORD or EMAIL_PASSWORD");
    if (!config.fromAddress) missing.push("MAIL_FROM_ADDRESS or EMAIL_FROM");

    if (missing.length > 0) {
      console.error(
        "❌ [EmailService] Missing required environment variables:",
        missing
      );
      return {
        success: false,
        error: `Missing environment variables: ${missing.join(", ")}`,
        config,
      };
    }

    try {
      // Test SMTP connection
      console.log("🔍 [EmailService] Testing SMTP connection...");
      await this.transporter.verify();
      console.log("✅ [EmailService] SMTP connection successful");

      return {
        success: true,
        message: "Email configuration is valid and connection successful",
        config: {
          ...config,
          password: "***HIDDEN***",
        },
      };
    } catch (error) {
      console.error("❌ [EmailService] SMTP connection failed:", {
        error: error.message,
        code: error.code,
        command: error.command,
      });

      return {
        success: false,
        error: error.message,
        code: error.code,
        command: error.command,
        config: {
          ...config,
          password: "***HIDDEN***",
        },
      };
    }
  }

  static async sendInvitationEmail(email, token, role) {
    console.log("📧 [EmailService] Starting invitation email sending process");
    console.log("📧 [EmailService] Email details:", {
      email,
      role,
      tokenPreview: token.substring(0, 8) + "...",
    });

    // Check if user should receive email notifications
    const userId = await EmailService.getUserIdFromEmail(email);
    if (userId) {
      const shouldSend = await EmailService.shouldSendEmail(
        userId,
        "INVITATION"
      );
      if (!shouldSend) {
        console.log(
          `🔕 [EmailService] Skipping invitation email for user ${userId} (preferences disabled)`
        );
        return; // Exit early but don't throw error
      }
    }

    // Diagnostic logging for email configuration
    console.log("🔧 [EmailService] Email configuration check:", {
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT || 587,
      encryption: process.env.MAIL_ENCRYPTION,
      username:
        process.env.MAIL_USERNAME || process.env.EMAIL_USER ? "SET" : "NOT SET",
      password:
        process.env.MAIL_PASSWORD || process.env.EMAIL_PASSWORD
          ? "SET"
          : "NOT SET",
      fromAddress: process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM,
      fromName: process.env.MAIL_FROM_NAME || "Personnel Management System",
      clientUrl: process.env.CLIENT_URL,
    });

    // Check if required environment variables are set
    const host = process.env.MAIL_HOST;
    const username = process.env.MAIL_USERNAME || process.env.EMAIL_USER;
    const password = process.env.MAIL_PASSWORD || process.env.EMAIL_PASSWORD;

    if (!host || !username || !password) {
      console.error("❌ [EmailService] Missing required email configuration:", {
        MAIL_HOST: !!host,
        MAIL_USERNAME: !!username,
        MAIL_PASSWORD: !!password,
      });
      throw new ApiError(500, "Email service not properly configured");
    }

    try {
      const setupLink = `${process.env.CLIENT_URL}/auth/complete-registration/${token}`;
      console.log("🔗 [EmailService] Setup link generated:", setupLink);

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Welcome to Personnel Management System</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #16a34a;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .content {
              padding: 20px;
              background-color: #f9f9f9;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #16a34a;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Personnel Management System</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You have been invited to join the Personnel Management System as a ${role}.</p>
              <p>To complete your account setup, please click the button below:</p>
              <p style="text-align: center;">
                <a href="${setupLink}" class="button">Complete Account Setup</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p>${setupLink}</p>
              <p>This invitation link will expire in 7 days.</p>
              <p>If you did not request this invitation, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Personnel Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      console.log("📝 [EmailService] HTML template prepared");

      const mailOptions = {
        from: {
          name: process.env.MAIL_FROM_NAME || "Personnel Management System",
          address: process.env.MAIL_FROM_ADDRESS || process.env.EMAIL_FROM,
        },
        to: email,
        subject:
          "Welcome to Personnel Management System - Complete Your Account Setup",
        html: html,
        headers: {
          "List-Unsubscribe": `<mailto:${
            process.env.MAIL_USERNAME || process.env.EMAIL_USER
          }>`,
          Precedence: "bulk",
          "X-Auto-Response-Suppress": "OOF, DR, RN, NRN, AutoReply",
          "X-Mailer": "Personnel Management System",
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
          Importance: "high",
          "Content-Type": "text/html; charset=UTF-8",
        },
      };

      console.log("📤 [EmailService] Mail options prepared:", {
        from: mailOptions.from,
        to: mailOptions.to,
        subject: mailOptions.subject,
      });

      // Retry mechanism for email sending
      const maxRetries = 3;
      let lastError = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(
            `📤 [EmailService] Attempting to send email (attempt ${attempt}/${maxRetries})...`
          );

          // Test connection first
          console.log("🔍 [EmailService] Testing SMTP connection...");
          await this.transporter.verify();
          console.log(
            "✅ [EmailService] SMTP connection verified successfully"
          );

          // Send email
          await this.transporter.sendMail(mailOptions);
          console.log(
            `✅ [EmailService] Invitation email sent successfully on attempt ${attempt}`
          );
          return; // Success, exit retry loop
        } catch (error) {
          lastError = error;
          console.error(`❌ [EmailService] Email attempt ${attempt} failed:`, {
            error: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response,
          });

          if (attempt < maxRetries) {
            const delay = attempt * 2000; // 2s, 4s, 6s delays
            console.log(`⏳ [EmailService] Waiting ${delay}ms before retry...`);
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }

      // All retries failed
      console.error("❌ [EmailService] All email attempts failed:", {
        maxRetries,
        lastError: lastError.message,
        code: lastError.code,
        command: lastError.command,
      });
      throw new ApiError(
        500,
        "Failed to send invitation email after multiple attempts"
      );
    } catch (error) {
      console.error("❌ [EmailService] Error sending invitation email:", error);
      console.error("❌ [EmailService] Email error details:", {
        email,
        error: error.message,
        stack: error.stack,
        code: error.code,
        command: error.command,
        responseCode: error.responseCode,
        response: error.response,
      });
      throw new ApiError(500, "Failed to send invitation email");
    }
  }

  static async sendInvitation(user, token) {
    try {
      const setupLink = `${process.env.CLIENT_URL}/auth/complete-registration/${token}`;

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
          <title>Welcome to Personnel Management System</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background-color: #16a34a;
              color: white;
              padding: 20px;
              text-align: center;
            }
            .content {
              padding: 20px;
              background-color: #f9f9f9;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #16a34a;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Personnel Management System</h1>
            </div>
            <div class="content">
              <p>Hello ${user.firstName},</p>
              <p>You have been invited to join the Personnel Management System as a ${
                user.role
              }.</p>
              <p>To complete your account setup, please click the button below:</p>
              <p style="text-align: center;">
                <a href="${setupLink}" class="button">Complete Account Setup</a>
              </p>
              <p>Or copy and paste this link into your browser:</p>
              <p>${setupLink}</p>
              <p>This invitation link will expire in 7 days.</p>
              <p>If you did not request this invitation, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>This is an automated message, please do not reply to this email.</p>
              <p>© ${new Date().getFullYear()} Personnel Management System. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: {
          name: "Personnel Management System",
          address: process.env.EMAIL_FROM,
        },
        to: user.email,
        subject:
          "Welcome to Personnel Management System - Complete Your Account Setup",
        html: html,
        headers: {
          "List-Unsubscribe": `<mailto:${process.env.EMAIL_USER}>`,
          Precedence: "bulk",
          "X-Auto-Response-Suppress": "OOF, DR, RN, NRN, AutoReply",
          "X-Mailer": "Personnel Management System",
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
          Importance: "high",
          "Content-Type": "text/html; charset=UTF-8",
        },
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending invitation email:", error);
      throw new ApiError(500, "Failed to send invitation email");
    }
  }

  static async sendLifecycleUpdateEmail(user, newState) {
    try {
      // Check if user should receive email notifications
      const shouldSend = await EmailService.shouldSendEmail(user._id, newState);
      if (!shouldSend) {
        console.log(
          `🔕 [EmailService] Skipping lifecycle email for user ${user._id} (preferences disabled)`
        );
        return; // Exit early but don't throw error
      }

      switch (newState) {
        case UserLifecycleState.REGISTERED:
          await this.sendEmail({
            to: user.email,
            subject: "Registration Completed - Next Steps",
            html: this.getRegistrationCompletedTemplate(user),
          });
          break;

        case UserLifecycleState.ONBOARDING:
          // Send to both user and supervisor
          await this.sendEmail({
            to: user.email,
            subject: "Your Onboarding Process Has Started",
            html: this.getOnboardingStartedTemplate(user),
          });

          if (user.onboarding && user.onboarding.supervisor) {
            const supervisor = await UserModel.findById(
              user.onboarding.supervisor
            );
            if (supervisor) {
              // Check supervisor preferences too
              const supervisorShouldSend = await EmailService.shouldSendEmail(
                supervisor._id,
                "ONBOARDING"
              );
              if (supervisorShouldSend) {
                await this.sendEmail({
                  to: supervisor.email,
                  subject: `New Employee Onboarding: ${user.firstName} ${user.lastName}`,
                  html: this.getSupervisorOnboardingTemplate(user, supervisor),
                });
              }
            }
          }
          break;

        case UserLifecycleState.ACTIVE:
          await this.sendEmail({
            to: user.email,
            subject: "Welcome Aboard! Onboarding Completed",
            html: this.getOnboardingCompletedTemplate(user),
          });
          break;

        case UserLifecycleState.OFFBOARDING:
          // Send to user, supervisor, and HR
          const offboardingEmails = [
            {
              to: user.email,
              subject: "Important: Your Offboarding Process Has Started",
              html: this.getOffboardingStartedTemplate(user),
            },
          ];

          // Add supervisor notification if exists
          if (user.reportingTo) {
            const supervisor = await UserModel.findById(user.reportingTo);
            if (supervisor) {
              // Check supervisor preferences
              const supervisorShouldSend = await EmailService.shouldSendEmail(
                supervisor._id,
                "OFFBOARDING"
              );
              if (supervisorShouldSend) {
                offboardingEmails.push({
                  to: supervisor.email,
                  subject: `Offboarding Process Started: ${user.firstName} ${user.lastName}`,
                  html: this.getSupervisorOffboardingTemplate(user),
                });
              }
            }
          }

          // Send all offboarding notifications
          await Promise.all(
            offboardingEmails.map((email) => this.sendEmail(email))
          );
          break;

        default:
          console.log(`No email template for lifecycle state: ${newState}`);
      }
    } catch (error) {
      console.error("Error sending lifecycle update email:", error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  // Base email template header and footer
  static getBaseEmailTemplate(content) {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="text-align: center; padding: 32px 0; background: #ffffff;">
          <div style="margin: 0 auto; width: fit-content;">
            <h1 style="color: #16a34a; font-size: 28px; font-weight: 600; margin: 16px 0 0 0;">PMS</h1>
          </div>
        </div>
        ${content}
        <div style="text-align: center; margin-top: 32px; padding: 24px;">
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">
              © ${new Date().getFullYear()} Century Information Systems
            </p>
          </div>
        </div>
      </div>
    `;
  }

  static getRegistrationCompletedTemplate(user) {
    const content = `
      <div style="background: linear-gradient(to bottom right, #ffffff, #f8fafc);
                  padding: 32px;
                  border-radius: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  margin: 0 16px;">
        <h2 style="color: #334155; text-align: center; font-size: 24px; margin-bottom: 24px; font-weight: 500;">
          Registration Completed Successfully
        </h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Dear ${user.firstName},
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Welcome to the Personnel Management System! Your registration is complete, and your onboarding process will begin shortly.
        </p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="color: #475569; font-size: 16px; margin-bottom: 16px; font-weight: 500;">
            Here's what to expect next:
          </p>
          <ul style="list-style-type: none; padding: 0; margin: 0; color: #475569;">
            <li style="margin: 12px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px; font-size: 18px;">1.</span>
              <span>Welcome meeting with your supervisor</span>
            </li>
            <li style="margin: 12px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px; font-size: 18px;">2.</span>
              <span>Department introduction and team meet</span>
            </li>
            <li style="margin: 12px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px; font-size: 18px;">3.</span>
              <span>System access and tools setup</span>
            </li>
            <li style="margin: 12px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px; font-size: 18px;">4.</span>
              <span>Policy documentation review</span>
            </li>
          </ul>
        </div>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center; margin-top: 24px;">
          Your supervisor will contact you soon to begin the onboarding process.
        </p>
      </div>
    `;
    return this.getBaseEmailTemplate(content);
  }

  static getOnboardingStartedTemplate(user) {
    const content = `
      <div style="background: linear-gradient(to bottom right, #ffffff, #f8fafc);
                  padding: 32px;
                  border-radius: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  margin: 0 16px;">
        <h2 style="color: #334155; text-align: center; font-size: 24px; margin-bottom: 24px; font-weight: 500;">
          Your Onboarding Journey Begins
        </h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Dear ${user.firstName},
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Your onboarding process has officially begun! We've prepared a personalized onboarding plan to help you get started.
        </p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 24px 0;">
          <p style="color: #475569; font-size: 16px; margin-bottom: 16px; font-weight: 500;">
            Your Onboarding Tasks:
          </p>
          ${user.onboarding.tasks
            .map(
              (task) => `
            <div style="background-color: white; padding: 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
              <strong style="color: #334155; display: block; margin-bottom: 8px;">📋 ${task.name}</strong>
              <p style="color: #64748b; margin: 0;">${task.description}</p>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div style="text-align: center; margin-top: 24px; padding: 16px; background-color: #f1f5f9; border-radius: 8px;">
          <p style="color: #475569; font-size: 16px; margin: 0;">
            <strong>Expected Completion Date:</strong><br>
            ${new Date(
              user.onboarding.expectedCompletionDate
            ).toLocaleDateString()}
          </p>
        </div>
      </div>
    `;
    return this.getBaseEmailTemplate(content);
  }

  // Supervisor notification template
  static getSupervisorOnboardingTemplate(user, supervisor) {
    const content = `
      <div style="background: linear-gradient(to bottom right, #ffffff, #f8fafc);
                  padding: 32px;
                  border-radius: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  margin: 0 16px;">
        <h2 style="color: #334155; text-align: center; font-size: 24px; margin-bottom: 24px; font-weight: 500;">
          New Employee Onboarding Assignment
        </h2>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Dear ${supervisor.firstName},
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          You have been assigned as the onboarding supervisor for a new team member.
        </p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h3 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">Employee Details</h3>
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 8px 0; color: #334155;">
              <strong style="display: inline-block; width: 120px;">Name:</strong> 
              <span>${user.firstName} ${user.lastName}</span>
            </p>
            <p style="margin: 8px 0; color: #334155;">
              <strong style="display: inline-block; width: 120px;">Position:</strong> 
              <span>${user.position}</span>
            </p>
            <p style="margin: 8px 0; color: #334155;">
              <strong style="display: inline-block; width: 120px;">Department:</strong> 
              <span>${user.department}</span>
            </p>
            <p style="margin: 8px 0; color: #334155;">
              <strong style="display: inline-block; width: 120px;">Start Date:</strong> 
              <span>${new Date(user.dateJoined).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin-top: 24px;">
          <h3 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">Next Steps</h3>
          <ul style="list-style-type: none; padding: 0; margin: 0; color: #475569;">
            <li style="margin: 8px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px;">1.</span>
              <span>Schedule welcome meeting</span>
            </li>
            <li style="margin: 8px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px;">2.</span>
              <span>Prepare onboarding documentation</span>
            </li>
            <li style="margin: 8px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px;">3.</span>
              <span>Set up system access requirements</span>
            </li>
            <li style="margin: 8px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px;">4.</span>
              <span>Plan department introduction</span>
            </li>
          </ul>
        </div>
      </div>
    `;
    return this.getBaseEmailTemplate(content);
  }

  // Onboarding completed template
  static getOnboardingCompletedTemplate(user) {
    const content = `
      <div style="background: linear-gradient(to bottom right, #ffffff, #f8fafc);
                  padding: 32px;
                  border-radius: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  margin: 0 16px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 48px;">🎉</span>
          <h2 style="color: #334155; font-size: 24px; margin: 16px 0; font-weight: 500;">
            Onboarding Completed Successfully!
          </h2>
        </div>

        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Dear ${user.firstName},
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Congratulations on completing your onboarding process! You are now fully set up in our system and ready to begin your journey with us.
        </p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h3 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">Your Information</h3>
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 8px 0; color: #334155;">
              <strong style="display: inline-block; width: 140px;">Completed On:</strong> 
              <span>${new Date().toLocaleDateString()}</span>
            </p>
            <p style="margin: 8px 0; color: #334155;">
              <strong style="display: inline-block; width: 140px;">Position:</strong> 
              <span>${user.position}</span>
            </p>
            <p style="margin: 8px 0; color: #334155;">
              <strong style="display: inline-block; width: 140px;">Department:</strong> 
              <span>${user.department}</span>
            </p>
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px; padding: 20px; background-color: #f1f5f9; border-radius: 12px;">
          <p style="color: #475569; font-size: 16px; margin: 0;">
            Welcome to the team! We're excited to have you on board.
          </p>
        </div>
      </div>
    `;
    return this.getBaseEmailTemplate(content);
  }

  // Offboarding started template
  static getOffboardingStartedTemplate(user) {
    const content = `
      <div style="background: linear-gradient(to bottom right, #ffffff, #f8fafc);
                  padding: 32px;
                  border-radius: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  margin: 0 16px;">
        <h2 style="color: #334155; text-align: center; font-size: 24px; margin-bottom: 24px; font-weight: 500;">
          Offboarding Process Initiated
        </h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Dear ${user.firstName},
        </p>
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          Your offboarding process has been initiated. To ensure a smooth transition, please complete the following tasks:
        </p>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h3 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">Offboarding Checklist</h3>
          ${user.offboarding.checklist
            .map(
              (item, index) => `
            <div style="background-color: white; padding: 16px; border-radius: 8px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
              <div style="display: flex; align-items: center;">
                <span style="color: #16a34a; margin-right: 12px; font-weight: 500;">${
                  index + 1
                }.</span>
                <span style="color: #334155; font-weight: 500;">${
                  item.task
                }</span>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div style="text-align: center; margin-top: 24px; padding: 20px; background-color: #f1f5f9; border-radius: 12px;">
          <p style="color: #475569; font-size: 16px; margin: 0;">
            <strong>Target Completion Date:</strong><br>
            ${new Date(user.offboarding.targetExitDate).toLocaleDateString()}
          </p>
        </div>
      </div>
    `;
    return this.getBaseEmailTemplate(content);
  }

  // Supervisor offboarding notification template
  static getSupervisorOffboardingTemplate(user) {
    const content = `
      <div style="background: linear-gradient(to bottom right, #ffffff, #f8fafc);
                  padding: 32px;
                  border-radius: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  margin: 0 16px;">
        <h2 style="color: #334155; text-align: center; font-size: 24px; margin-bottom: 24px; font-weight: 500;">
          Employee Offboarding Notice
        </h2>
        
        <div style="background-color: #f8fafc; padding: 24px; border-radius: 12px; margin: 24px 0;">
          <h3 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">Employee Details</h3>
          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 8px 0; color: #334155;">
              <strong style="display: inline-block; width: 120px;">Employee:</strong> 
              <span>${user.firstName} ${user.lastName}</span>
            </p>
            <p style="margin: 8px 0; color: #334155;">
              <strong style="display: inline-block; width: 120px;">Position:</strong> 
              <span>${user.position}</span>
            </p>
            <p style="margin: 8px 0; color: #334155;">
              <strong style="display: inline-block; width: 120px;">Department:</strong> 
              <span>${user.department}</span>
            </p>
            <p style="margin: 8px 0; color: #334155;">
              <strong style="display: inline-block; width: 120px;">Exit Date:</strong> 
              <span>${new Date(
                user.offboarding.targetExitDate
              ).toLocaleDateString()}</span>
            </p>
          </div>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; border-radius: 12px; margin-top: 24px;">
          <h3 style="color: #334155; font-size: 18px; margin: 0 0 16px 0;">Supervisor Actions Required</h3>
          <ul style="list-style-type: none; padding: 0; margin: 0; color: #475569;">
            <li style="margin: 8px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px;">•</span>
              <span>Schedule exit interview</span>
            </li>
            <li style="margin: 8px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px;">•</span>
              <span>Review knowledge transfer documentation</span>
            </li>
            <li style="margin: 8px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px;">•</span>
              <span>Collect company assets</span>
            </li>
            <li style="margin: 8px 0; display: flex; align-items: center;">
              <span style="color: #16a34a; margin-right: 12px;">•</span>
              <span>Complete final performance review</span>
            </li>
          </ul>
        </div>
      </div>
    `;
    return this.getBaseEmailTemplate(content);
  }

  async sendEmail(config) {
    try {
      // Check if user should receive email notifications
      const userId = await EmailService.getUserIdFromEmail(config.to);
      if (userId) {
        // Try to determine email type from subject or content
        let emailType = "general";
        if (config.subject) {
          const subject = config.subject.toLowerCase();
          if (subject.includes("payslip") || subject.includes("payroll")) {
            emailType = "PAYROLL";
          } else if (subject.includes("leave")) {
            emailType = "LEAVE";
          } else if (subject.includes("allowance")) {
            emailType = "ALLOWANCE";
          } else if (subject.includes("bonus")) {
            emailType = "BONUS";
          } else if (
            subject.includes("onboarding") ||
            subject.includes("offboarding")
          ) {
            emailType = subject.includes("onboarding")
              ? "ONBOARDING"
              : "OFFBOARDING";
          } else if (
            subject.includes("password") ||
            subject.includes("reset") ||
            subject.includes("invitation")
          ) {
            emailType = "SYSTEM";
          }
        }

        const shouldSend = await EmailService.shouldSendEmail(
          userId,
          emailType
        );
        if (!shouldSend) {
          console.log(
            `🔕 [EmailService] Skipping email for user ${userId} (preferences disabled) - Subject: ${config.subject}`
          );
          return; // Exit early but don't throw error
        }
      }

      await EmailService.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        ...config,
      });
      console.log("Email sent successfully to:", config.to);
    } catch (error) {
      console.error("Email sending failed:", error);
      // Don't throw error to prevent process interruption
      // but log it for monitoring
      console.error("Email error details:", {
        to: config.to,
        subject: config.subject,
        error: error.message,
      });
    }
  }

  async sendPasswordResetEmail(to, resetToken) {
    // Check if user should receive email notifications
    const userId = await EmailService.getUserIdFromEmail(to);
    if (userId) {
      const shouldSend = await EmailService.shouldSendEmail(
        userId,
        "PASSWORD_RESET"
      );
      if (!shouldSend) {
        console.log(
          `🔕 [EmailService] Skipping password reset email for user ${userId} (preferences disabled)`
        );
        return true;
      }
    }

    const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject: "Password Reset Request",
      html: EmailService.getPasswordResetTemplate(resetUrl),
    };

    try {
      await EmailService.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  }

  async sendPasswordChangedEmail(to) {
    // Check if user should receive email notifications
    const userId = await EmailService.getUserIdFromEmail(to);
    if (userId) {
      const shouldSend = await EmailService.shouldSendEmail(
        userId,
        "PASSWORD_CHANGED"
      );
      if (!shouldSend) {
        console.log(
          `🔕 [EmailService] Skipping password changed email for user ${userId} (preferences disabled)`
        );
        return true; // Return success to avoid breaking the flow
      }
    }

    const content = `
      <div style="background: linear-gradient(to bottom right, #ffffff, #f8fafc);
                  padding: 32px;
                  border-radius: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  margin: 0 16px;">
        <h2 style="color: #334155; text-align: center; font-size: 24px; margin-bottom: 24px; font-weight: 500;">
          Password Changed Successfully
        </h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6; text-align: center;">
          Your password has been changed successfully.
        </p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-top: 24px; text-align: center;">
          <p style="color: #ef4444; font-size: 14px; margin: 0;">
            If you didn't make this change, please contact support immediately.
          </p>
        </div>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to,
      subject: "Password Changed Successfully",
      html: EmailService.getBaseEmailTemplate(content),
    };

    try {
      await EmailService.transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Email sending failed:", error);
      return false;
    }
  }

  // Password reset template
  static getPasswordResetTemplate(resetUrl) {
    const content = `
      <div style="background: linear-gradient(to bottom right, #ffffff, #f8fafc);
                  padding: 32px;
                  border-radius: 16px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                  margin: 0 16px;">
        <h2 style="color: #334155; text-align: center; font-size: 24px; margin-bottom: 24px; font-weight: 500;">
          Password Reset Request
        </h2>
        
        <p style="color: #475569; font-size: 16px; line-height: 1.6;">
          You have requested to reset your password. Click the button below to proceed:
        </p>
        
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetUrl}" 
             style="background-color: #16a34a; 
                    color: white; 
                    padding: 14px 36px; 
                    text-decoration: none; 
                    border-radius: 8px;
                    font-weight: 500;
                    display: inline-block;
                    transition: all 0.3s ease;
                    font-size: 16px;
                    box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);">
            Reset Password
          </a>
        </div>
        
        <p style="color: #64748b; font-size: 14px; margin-top: 24px; text-align: center; font-style: italic;">
          This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
        </p>
      </div>
    `;
    return this.getBaseEmailTemplate(content);
  }

  async sendPayslipEmail(to, payslipData, pdfBuffer) {
    try {
      const {
        employee,
        department,
        month,
        year,
        basicSalary,
        earnings,
        deductions,
        totals,
      } = payslipData;

      // Check if user should receive email notifications
      const userId = await EmailService.getUserIdFromEmail(to);
      if (userId) {
        const shouldSend = await EmailService.shouldSendEmail(
          userId,
          "PAYSLIP"
        );
        if (!shouldSend) {
          console.log(
            `🔕 [EmailService] Skipping payslip email for user ${userId} (preferences disabled)`
          );
          return true; // Return success to avoid breaking the flow
        }
      }

      const pdfContent = Buffer.from(pdfBuffer);

      // Merge and deduplicate bonuses
      const allBonuses = [
        ...(earnings?.bonus || []),
        ...(payslipData.personalBonuses || []),
      ];
      const uniqueBonuses = [];
      const seenBonusDescriptions = new Set();
      allBonuses.forEach((bonus) => {
        if (!seenBonusDescriptions.has(bonus.description)) {
          uniqueBonuses.push(bonus);
          seenBonusDescriptions.add(bonus.description);
        }
      });

      // Merge all allowances
      const allAllowances = [
        ...(payslipData.gradeAllowances || []),
        ...(payslipData.additionalAllowances || []),
      ];

      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payslip for ${month} ${year}</title>
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #ffffff;
            }
            .header {
              text-align: center;
              padding: 20px 0;
              background-color: #ffffff;
              color: #16a34a;
              border-radius: 5px 5px 0 0;
            }
            .header h2 {
              color: #16a34a;
              font-size: 28px;
              margin: 10px 0;
            }
            .content {
              padding: 20px;
              background-color: #ffffff;
              border-radius: 0 0 5px 5px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #16a34a;
            }
            .payslip-details {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .payslip-details p {
              margin: 5px 0;
              color: #475569;
            }
            .summary {
              margin: 20px 0;
            }
            .summary-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
            }
            .summary-table th, .summary-table td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #ddd;
            }
            .summary-table th {
              background-color: #16a34a;
              color: #ffffff;
            }
            .earnings {
              color: #16a34a;
            }
            .deductions {
              color: #475569;
            }
            .net-pay {
              font-size: 18px;
              font-weight: bold;
              color: #16a34a;
              text-align: right;
              margin-top: 20px;
              padding: 10px;
              background-color: #f8f9fa;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #94a3b8;
              font-size: 12px;
              margin-top: 20px;
              border-top: 1px solid #eee;
            }
            .footer p {
              margin: 5px 0;
            }
            .contact-info {
              color: #16a34a;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>PMS</h2>
              <h3>Payslip for ${month} ${year}</h3>
            </div>
            
            <div class="content">
              <div class="greeting">
                Dear ${employee?.firstName} ${employee?.lastName},
              </div>
              
              <div class="payslip-details">
                <p><strong>Employee ID:</strong> ${employee?.employeeId}</p>
                <p><strong>Department:</strong> ${department?.name || "N/A"}</p>
                <p><strong>Position:</strong> ${employee?.position || "N/A"}</p>
                <p><strong>Period:</strong> ${month} ${year}</p>
              </div>
              
              <div class="summary">
                <h3 style="color: #16a34a;">Salary Summary</h3>
                <table class="summary-table">
                  <tr>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                  <tr>
                    <td>Basic Salary</td>
                    <td class="earnings">₦${basicSalary.toFixed(2)}</td>
                  </tr>
                  ${
                    earnings?.overtime?.amount > 0
                      ? `
                  <tr>
                    <td>Overtime (${earnings.overtime.hours}hrs)</td>
                    <td class="earnings">₦${earnings.overtime.amount.toFixed(
                      2
                    )}</td>
                  </tr>
                `
                      : ""
                  }
                  ${
                    uniqueBonuses
                      .map(
                        (bonus) => `
                  <tr>
                    <td>${bonus.description}</td>
                    <td class="earnings">₦${bonus.amount.toFixed(2)}</td>
                  </tr>
                `
                      )
                      .join("") || ""
                  }
                  ${
                    allAllowances
                      .map(
                        (allowance) => `
                  <tr>
                    <td>${allowance.name}</td>
                    <td class="earnings">₦${allowance.amount.toFixed(2)}</td>
                  </tr>
                `
                      )
                      .join("") || ""
                  }
                  <tr>
                    <td>PAYE Tax</td>
                    <td class="deductions">-₦${deductions?.tax?.amount.toFixed(
                      2
                    )}</td>
                  </tr>
                  <tr>
                    <td>Pension</td>
                    <td class="deductions">-₦${deductions?.pension?.amount.toFixed(
                      2
                    )}</td>
                  </tr>
                  <tr>
                    <td>NHF</td>
                    <td class="deductions">-₦${deductions?.nhf?.amount.toFixed(
                      2
                    )}</td>
                  </tr>
                  ${
                    deductions?.loans
                      ?.map(
                        (loan) => `
                  <tr>
                    <td>${loan.description}</td>
                    <td class="deductions">-₦${loan.amount.toFixed(2)}</td>
                  </tr>
                `
                      )
                      .join("") || ""
                  }
                  ${
                    deductions?.others
                      ?.map(
                        (deduction) => `
                  <tr>
                    <td>${deduction.description}</td>
                    <td class="deductions">-₦${deduction.amount.toFixed(2)}</td>
                  </tr>
                `
                      )
                      .join("") || ""
                  }
                </table>
                
                <div class="net-pay">
                  Net Pay: ₦${totals?.netPay.toFixed(2)}
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>This is a computer generated document</p>
              <p>For any queries, please contact:</p>
              <p class="contact-info">HR Department</p>
              <p>Email: hr@centuryinfosystems.com</p>
              <p>© ${new Date().getFullYear()} Century Information Systems</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject: `Your Payslip for ${month} ${year}`,
        html,
        attachments: [
          {
            filename: `payslip_${month}_${year}.pdf`,
            content: pdfContent,
          },
        ],
      };

      await this.sendEmail(mailOptions);
      return true;
    } catch (error) {
      console.error("Error sending payslip email:", error);
      throw new ApiError(500, "Failed to send payslip email");
    }
  }

  // Helper method to check if user should receive email notifications
  static async shouldSendEmail(userId, type = "general") {
    try {
      // System-critical emails that should always be sent regardless of preferences
      const criticalEmailTypes = [
        "INVITATION",
        "ACCOUNT_SETUP",
        "REGISTRATION",
        "FIRST_LOGIN",
        "PASSWORD_RESET",
        "PASSWORD_CHANGED",
        "SECURITY_ALERT",
      ];

      if (criticalEmailTypes.includes(type.toUpperCase())) {
        console.log(
          `📧 [EmailService] Sending critical email of type ${type} to user ${userId} (bypassing preferences)`
        );
        return true;
      }

      // Get user's notification preferences
      const preferences = await NotificationPreference.getOrCreatePreferences(
        userId
      );

      // Check if email channel is enabled
      if (!preferences.preferences.email?.enabled) {
        console.log(
          `🔕 [EmailService] Email notifications disabled for user ${userId}`
        );
        return false;
      }

      // Check if user is in quiet hours
      if (preferences.isInQuietHours && preferences.isInQuietHours()) {
        console.log(`🔕 [EmailService] User ${userId} is in quiet hours`);
        return false;
      }

      // Check if do not disturb is active
      if (
        preferences.isDoNotDisturbActive &&
        preferences.isDoNotDisturbActive()
      ) {
        console.log(
          `🔕 [EmailService] Do not disturb active for user ${userId}`
        );
        return false;
      }

      // Determine notification category based on type
      let category = "general";
      if (type.includes("PAYROLL") || type.includes("PAYSLIP")) {
        category = "payroll";
      } else if (type.includes("LEAVE")) {
        category = "leave";
      } else if (type.includes("ALLOWANCE")) {
        category = "allowance";
      } else if (type.includes("BONUS")) {
        category = "bonus";
      } else if (type.includes("ONBOARDING") || type.includes("OFFBOARDING")) {
        category = type.toLowerCase().includes("onboarding")
          ? "onboarding"
          : "offboarding";
      } else if (type.includes("SYSTEM") || type.includes("ERROR")) {
        category = "system";
      }

      // Check if specific category is enabled for email
      const isCategoryEnabled = preferences.preferences.email.types[category];

      if (!isCategoryEnabled) {
        console.log(
          `🔕 [EmailService] ${category} email notifications disabled for user ${userId}`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error(
        `❌ [EmailService] Error checking email preferences for user ${userId}:`,
        error
      );
      // Default to true if there's an error checking preferences (reverse compatibility)
      return true;
    }
  }

  // Helper method to get user ID from email address
  static async getUserIdFromEmail(email) {
    try {
      const user = await UserModel.findOne({ email });
      return user?._id;
    } catch (error) {
      console.error(
        `❌ [EmailService] Error finding user by email ${email}:`,
        error
      );
      return null;
    }
  }
}
