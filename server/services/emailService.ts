import nodemailer from "nodemailer";
import { config } from "dotenv";

// Load environment variables
config();

interface EmailConfig {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  private static transporter = nodemailer.createTransport({
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

  static async sendInvitationEmail(email: string, token: string) {
    const invitationLink = `${process.env.CLIENT_URL}/auth/complete-registration/${token}`;

    const emailContent = {
      to: email,
      subject: "Complete Your Payroll System Registration",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a73e8; text-align: center;">Welcome to Our Payroll System</h1>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #202124; font-size: 16px;">You have been invited to join our payroll system. To complete your registration, please click the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${invitationLink}" 
                 style="background-color: #1a73e8; 
                        color: white; 
                        padding: 12px 24px; 
                        text-decoration: none; 
                        border-radius: 4px;
                        display: inline-block;">
                Complete Registration
              </a>
            </div>
            
            <p style="color: #5f6368; font-size: 14px;">This link will expire in 7 days.</p>
            
            <p style="color: #5f6368; font-size: 14px;">If you can't click the button, copy and paste this link into your browser:</p>
            <p style="color: #202124; font-size: 14px; word-break: break-all;">${invitationLink}</p>
          </div>
          
          <p style="color: #5f6368; font-size: 12px; text-align: center;">
            If you didn't expect this invitation, please ignore this email.
          </p>
        </div>
      `,
    };

    await this.sendEmail(emailContent);
  }

  private static async sendEmail(config: EmailConfig) {
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
