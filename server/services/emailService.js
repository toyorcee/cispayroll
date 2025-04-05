import nodemailer from "nodemailer";
import { config } from "dotenv";
import { UserLifecycleState } from "../models/User.js";
import { ApiError } from "../utils/errorHandler.js";
import { UserRole } from "../models/User.js";

// Load environment variables
config();

export class EmailService {
  static transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  static async sendInvitationEmail(email, invitationToken, role) {
    try {
      const inviteLink = `${process.env.CLIENT_URL}/auth/complete-registration/${invitationToken}`;
      const userType = role === UserRole.ADMIN ? "Admin" : "Employee";

      await EmailService.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: `Welcome to Personnel Management System - Complete Your ${userType} Account Setup`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <div style="text-align: center; padding: 32px 0; background: linear-gradient(to right, #f8fafc, #ffffff);">
              <div style="margin: 0 auto; width: fit-content;">
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="48" height="48" viewBox="0 0 32 32">
                  <image xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAXVJREFUWEdjZICB/wyM4ou9Iv8zMiQz/GcwZWBk4IXLUYPxn+EzAyPDacb/DHNfxm5bzsDI8B9kLCOIEFriycfyn3ENAwODKzXsIsKM3X8Y/4e8i9n+CeQORrElXjvpaDnMfbtfxWxzZxRf5BX1n5FhKRGuproSxv8M0Yxii732MjAwOFHddOIM3McotsjrE9UTHHGWMzD8Z/gMCgFalwoMDQdwM7MylBvlMwQpuQMDrhV9/YyNJ6by/Dz72+SA5KsEGgzzWBIVvdFsWzuzc0MVadn0McBd8JXM/CycqFY9vn3NwaVlaEjxAEDHgUDkggr9GMZMrWCGDiY2fDG84+/vximX1vH0HFxMVHpgahcoM4vx3DIdzpRBsIU2W3OZLj58RFBPUQ5wEpcl2G9awdBw5AVBO6uYDj28jJBPaMOGA2BoRECA54NQXlpQAsigpmZAgVEpQEKzCeodVA0Sge2WT7gHZMB75qBUsnAdk5h6XSAuucAZL/ia4Blq2wAAAAASUVORK5CYII=" x="0" y="0" width="32" height="32"/>
                </svg>
                <h1 style="color: #16a34a; font-size: 28px; font-weight: 600; margin: 16px 0 0 0;">Personnel Management System</h1>
              </div>
            </div>

            <div style="background: linear-gradient(to bottom right, #ffffff, #f8fafc);
                        padding: 32px;
                        border-radius: 16px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        margin: 0 16px;">
              <h2 style="color: #334155; text-align: center; font-size: 24px; margin-bottom: 24px; font-weight: 500;">
                Welcome to Your ${userType} Account
              </h2>
              
              <p style="color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Your Personnel Management System account has been created. To begin your journey with us, please complete your account setup by clicking the button below:
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${inviteLink}" 
                   style="background-color: #16a34a; 
                          color: white; 
                          padding: 14px 36px; 
                          text-decoration: none; 
                          border-radius: 8px;
                          font-weight: 500;
                          display: inline-block;
                          transition: all 0.3s ease;
                          font-size: 16px;
                          box-shadow: 0 2px 4px rgba(22, 163, 74, 0.2);"
                   target="_blank"
                   rel="noopener noreferrer">
                  Complete Account Setup
                </a>
              </div>
              
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #475569; font-size: 16px; margin-bottom: 16px; font-weight: 500;">
                  As a member of our system, you'll have access to:
                </p>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin-top: 16px;">
                  <ul style="list-style-type: none; padding: 0; margin: 0; color: #475569;">
                    <li style="margin: 12px 0; display: flex; align-items: center;">
                      <span style="color: #16a34a; margin-right: 12px; font-size: 18px;">✓</span>
                      <span>Comprehensive Employee Profile Management</span>
                    </li>
                    <li style="margin: 12px 0; display: flex; align-items: center;">
                      <span style="color: #16a34a; margin-right: 12px; font-size: 18px;">✓</span>
                      <span>Advanced Leave & Attendance System</span>
                    </li>
                    <li style="margin: 12px 0; display: flex; align-items: center;">
                      <span style="color: #16a34a; margin-right: 12px; font-size: 18px;">✓</span>
                      <span>Performance Review & Feedback Tools</span>
                    </li>
                    <li style="margin: 12px 0; display: flex; align-items: center;">
                      <span style="color: #16a34a; margin-right: 12px; font-size: 18px;">✓</span>
                      <span>Secure Document Management Portal</span>
                    </li>
                  </ul>
                </div>
              </div>

              <p style="color: #64748b; font-size: 14px; margin-top: 24px; text-align: center; font-style: italic;">
                For security reasons, this invitation link will expire in 7 days.
              </p>
            </div>

            <div style="text-align: center; margin-top: 32px; padding: 24px;">
              <p style="color: #64748b; font-size: 14px; margin-bottom: 16px;">
                If you didn't expect this invitation, please ignore this email or contact your HR department.
              </p>
              <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
                <p style="color: #94a3b8; font-size: 13px; margin: 0;">
                  Powered by Century Information Systems
                </p>
              </div>
            </div>
          </div>
        `,
      });
    } catch (error) {
      console.error("Failed to send invitation email:", error);
      throw new ApiError(500, "Failed to send invitation email");
    }
  }

  static async sendLifecycleUpdateEmail(user, newState) {
    let emailContent;

    switch (newState) {
      case UserLifecycleState.REGISTERED:
        emailContent = {
          to: user.email,
          subject: "Registration Completed - Next Steps",
          html: this.getRegistrationCompletedTemplate(user),
        };
        break;

      case UserLifecycleState.ONBOARDING:
        // Send to both user and supervisor
        await this.sendEmail({
          to: user.email,
          subject: "Your Onboarding Process Has Started",
          html: this.getOnboardingStartedTemplate(user),
        });

        if (user.onboarding.supervisor) {
          const supervisor = await UserModel.findById(
            user.onboarding.supervisor
          );
          if (supervisor) {
            await this.sendEmail({
              to: supervisor.email,
              subject: `New Employee Onboarding: ${user.firstName} ${user.lastName}`,
              html: this.getSupervisorOnboardingTemplate(user, supervisor),
            });
          }
        }
        break;

      case UserLifecycleState.ACTIVE:
        emailContent = {
          to: user.email,
          subject: "Welcome Aboard! Onboarding Completed",
          html: this.getOnboardingCompletedTemplate(user),
        };
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
          offboardingEmails.push({
            to: user.reportingTo.email,
            subject: `Offboarding Process Started: ${user.firstName} ${user.lastName}`,
            html: this.getSupervisorOffboardingTemplate(user),
          });
        }

        // Send all offboarding notifications
        await Promise.all(
          offboardingEmails.map((email) => this.sendEmail(email))
        );
        return;
    }

    if (emailContent) {
      await this.sendEmail(emailContent);
    }
  }

  // Base email template header and footer
  static getBaseEmailTemplate(content) {
    return `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <div style="text-align: center; padding: 32px 0; background: linear-gradient(to right, #f8fafc, #ffffff);">
          <div style="margin: 0 auto; width: fit-content;">
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="48" height="48" viewBox="0 0 32 32">
              <image xlink:href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAXVJREFUWEdjZICB/wyM4ou9Iv8zMiQz/GcwZWBk4IXLUYPxn+EzAyPDacb/DHNfxm5bzsDI8B9kLCOIEFriycfyn3ENAwODKzXsIsKM3X8Y/4e8i9n+CeQORrElXjvpaDnMfbtfxWxzZxRf5BX1n5FhKRGuproSxv8M0Yxii732MjAwOFHddOIM3McotsjrE9UTHHGWMzD8Z/gMCgFalwoMDQdwM7MylBvlMwQpuQMDrhV9/YyNJ6by/Dz72+SA5KsEGgzzWBIVvdFsWzuzc0MVadn0McBd8JXM/CycqFY9vn3NwaVlaEjxAEDHgUDkggr9GMZMrWCGDiY2fDG84+/vximX1vH0HFxMVHpgahcoM4vx3DIdzpRBsIU2W3OZLj58RFBPUQ5wEpcl2G9awdBw5AVBO6uYDj28jJBPaMOGA2BoRECA54NQXlpQAsigpmZAgVEpQEKzCeodVA0Sge2WT7gHZMB75qBUsnAdk5h6XSAuucAZL/ia4Blq2wAAAAASUVORK5CYII=" x="0" y="0" width="32" height="32"/>
            </svg>
            <h1 style="color: #16a34a; font-size: 28px; font-weight: 600; margin: 16px 0 0 0;">Personnel Management System</h1>
          </div>
        </div>
        ${content}
        <div style="text-align: center; margin-top: 32px; padding: 24px;">
          <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
            <p style="color: #94a3b8; font-size: 13px; margin: 0;">
              Powered by Century Information Systems
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
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    const mailOptions = {
      from: process.env.EMAIL_FROM,
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
        month,
        year,
        basicSalary,
        earnings,
        deductions,
        totals,
      } = payslipData;

      // Convert ArrayBuffer to Buffer if needed
      const pdfContent = Buffer.from(pdfBuffer);

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
              background-color: #1a237e;
              color: white;
              border-radius: 5px 5px 0 0;
            }
            .header img {
              max-width: 150px;
              height: auto;
              margin-bottom: 10px;
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
              color: #1a237e;
            }
            .payslip-details {
              background-color: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 20px;
            }
            .payslip-details p {
              margin: 5px 0;
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
              background-color: #f8f9fa;
              color: #1a237e;
            }
            .earnings {
              color: #2e7d32;
            }
            .deductions {
              color: #c62828;
            }
            .net-pay {
              font-size: 18px;
              font-weight: bold;
              color: #1a237e;
              text-align: right;
              margin-top: 20px;
              padding: 10px;
              background-color: #e8eaf6;
              border-radius: 5px;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 12px;
              margin-top: 20px;
              border-top: 1px solid #eee;
            }
            .footer p {
              margin: 5px 0;
            }
            .contact-info {
              color: #1a237e;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://neovarsity.com/assets/images/logo.png" alt="Neovarsity Logo">
              <h2>Payslip for ${month} ${year}</h2>
            </div>
            
            <div class="content">
              <div class="greeting">
                Dear ${employee?.firstName} ${employee?.lastName},
              </div>
              
              <div class="payslip-details">
                <p><strong>Employee ID:</strong> ${employee?.employeeId}</p>
                <p><strong>Department:</strong> ${
                  employee?.department?.name || "N/A"
                }</p>
                <p><strong>Position:</strong> ${employee?.position || "N/A"}</p>
                <p><strong>Period:</strong> ${month} ${year}</p>
              </div>
              
              <div class="summary">
                <h3>Salary Summary</h3>
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
                    earnings?.bonus
                      ?.map(
                        (bonus) => `
                    <tr>
                      <td>${bonus.description}</td>
                      <td class="earnings">₦${bonus.amount.toFixed(2)}</td>
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
                      <td class="deductions">-₦${deduction.amount.toFixed(
                        2
                      )}</td>
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
              <p>This is an automated message. Please do not reply to this email.</p>
              <p>For any queries, please contact:</p>
              <p class="contact-info">HR Department</p>
              <p>Email: hr@centuryinfosystems.com</p>
              <p>Phone: +91 1234567890</p>
              <p>© ${new Date().getFullYear()} Century Information Systems. All rights reserved.</p>
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
}
