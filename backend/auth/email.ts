import { secret } from "encore.dev/config";

const emailApiKey = secret("EmailAPIKey");
const emailFromAddress = secret("EmailFromAddress");

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  // In a real implementation, use a service like SendGrid, Mailgun, or AWS SES
  console.log(`Sending verification email to ${email} with code: ${code}`);
  
  // Mock email sending for demo
  const emailContent = {
    to: email,
    from: emailFromAddress(),
    subject: "Verify your SCRIBE AI account",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Welcome to SCRIBE AI!</h2>
        <p>Thank you for signing up. Please verify your email address by entering this code:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #1f2937; font-size: 32px; margin: 0; letter-spacing: 4px;">${code}</h1>
        </div>
        <p>This code will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          The SCRIBE AI Team
        </p>
      </div>
    `
  };
  
  // Here you would integrate with your email service
  // await emailService.send(emailContent);
}

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  console.log(`Sending password reset email to ${email} with token: ${resetToken}`);
  
  const resetUrl = `https://app.scribeai.com/reset-password?token=${resetToken}`;
  
  const emailContent = {
    to: email,
    from: emailFromAddress(),
    subject: "Reset your SCRIBE AI password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">Password Reset Request</h2>
        <p>We received a request to reset your password for your SCRIBE AI account.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p>If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, please ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          Best regards,<br>
          The SCRIBE AI Team
        </p>
      </div>
    `
  };
  
  // Here you would integrate with your email service
  // await emailService.send(emailContent);
}
