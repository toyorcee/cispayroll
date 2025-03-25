import nodemailer from "nodemailer";
import { config } from "dotenv";

// Load environment variables
config();

export class EmailService {
  static transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // For development/testing, you might want to add:
    tls: {
      rejectUnauthorized: false,
    },
  });

  static async sendInvitationEmail(email, token) {
    const invitationLink = `${process.env.CLIENT_URL}/auth/complete-registration/${token}`;

    const emailContent = {
      to: email,
      subject: "Welcome to PeopleMAX - Complete Your Account Setup",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <!-- Building icon and PeopleMAX text styled like our SignIn page -->
            <div style="margin: 20px 0;">
              <svg style="width: 32px; height: 32px; color: #16a34a;" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 6c0-1.1.9-2 2-2h14c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V6zm2 0v12h14V6H5zm2 4h10v2H7v-2zm0 4h7v2H7v-2z"/>
              </svg>
              <h1 style="color: #16a34a; font-size: 24px; font-weight: bold; margin: 12px 0;">PeopleMAX</h1>
            </div>
          </div>

          <div style="background: linear-gradient(to bottom right, #f8fafc, #f1f5f9);
                      padding: 24px;
                      border-radius: 12px;
                      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
            <h2 style="color: #334155; text-align: center; font-size: 20px; margin-bottom: 20px;">
              Complete Your Account Setup
            </h2>
            
            <p style="color: #475569; font-size: 16px; line-height: 1.5;">
              Your PeopleMAX account has been created. To get started, please set up your password by clicking the button below:
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="background-color: #16a34a; 
                        color: white; 
                        padding: 12px 32px; 
                        text-decoration: none; 
                        border-radius: 8px;
                        font-weight: 500;
                        display: inline-block;
                        transition: background-color 0.2s;">
                Set Up Password
              </a>
            </div>
            
            <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
              For security reasons, this link will expire in 7 days.
            </p>
            
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0;">
              <p style="color: #475569; font-size: 15px; margin-bottom: 16px;">
                With PeopleMAX, you'll have access to:
              </p>
              <ul style="list-style-type: none; padding: 0; color: #475569;">
                <li style="margin: 8px 0;">
                  <span style="color: #16a34a; margin-right: 8px;">✓</span> Personnel Management
                </li>
                <li style="margin: 8px 0;">
                  <span style="color: #16a34a; margin-right: 8px;">✓</span> Payroll & Benefits
                </li>
                <li style="margin: 8px 0;">
                  <span style="color: #16a34a; margin-right: 8px;">✓</span> Time & Attendance
                </li>
                <li style="margin: 8px 0;">
                  <span style="color: #16a34a; margin-right: 8px;">✓</span> Performance Management
                </li>
              </ul>
            </div>
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <p style="color: #64748b; font-size: 14px;">
              If you didn't expect this invitation, please ignore or contact your HR department.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 16px;">
              Powered by Century Information Systems
            </p>
          </div>
        </div>
      `,
    };

    await this.sendEmail(emailContent);
  }

  static async sendEmail(config) {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        ...config,
      });
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new Error("Failed to send email");
    }
  }
}