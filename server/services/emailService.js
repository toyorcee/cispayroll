import nodemailer from "nodemailer";
import { config } from "dotenv";

// Load environment variables
config();

export class EmailService {
  static transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST, 
    port: process.env.MAIL_PORT || 587,
    secure: false, 
    auth: {
      user: process.env.EMAIL_USER, 
      pass: process.env.EMAIL_PASSWORD, 
    },
    tls: {
      rejectUnauthorized: false, 
    },
  });

  static async sendInvitationEmail(email, token) {
    // Debug logs for environment variables
    console.log("MAIL_HOST:", process.env.MAIL_HOST);
    console.log("MAIL_PORT:", process.env.MAIL_PORT);
    console.log("EMAIL_USER:", process.env.EMAIL_USER);
    console.log("EMAIL_PASSWORD:", process.env.EMAIL_PASSWORD ? "****" : "NOT SET");
    console.log("EMAIL_FROM:", process.env.EMAIL_FROM);

    const invitationLink = `${process.env.CLIENT_URL}/auth/complete-registration/${token}`;

    const emailContent = {
      to: email,
      subject: "Welcome to PeopleMAX - Complete Your Account Setup",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #16a34a; font-size: 24px; font-weight: bold; margin: 12px 0;">PeopleMAX</h1>
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
      console.log("Email sent successfully");
    } catch (error) {
      console.error("Email sending failed:", error);
      throw new Error("Failed to send email");
    }
  }
}