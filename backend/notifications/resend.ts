import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import { secret } from "encore.dev/config";

const resendApiKey = secret("ResendApiKey");

interface SendEmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: Array<{ name: string; value: string }>;
}

interface SendEmailResponse {
  id: string;
  success: boolean;
}

interface SendWelcomeEmailRequest {
  userEmail: string;
  userName: string;
}

interface SendWelcomeEmailResponse {
  success: boolean;
}

interface SendRecordingNotificationRequest {
  userEmail: string;
  recordingTitle: string;
  recordingId: number;
  summary: string;
}

interface SendRecordingNotificationResponse {
  success: boolean;
}

interface SendBillingNotificationRequest {
  userEmail: string;
  type: "payment_success" | "payment_failed" | "subscription_cancelled" | "trial_ending";
  details: Record<string, any>;
}

interface SendBillingNotificationResponse {
  success: boolean;
}

// Sends a custom email using Resend.
export const sendEmail = api<SendEmailRequest, SendEmailResponse>(
  { auth: true, expose: true, method: "POST", path: "/notifications/email" },
  async (req) => {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey()}`,
        },
        body: JSON.stringify({
          from: req.from || "SCRIBE AI <noreply@scribeai.com>",
          to: req.to,
          subject: req.subject,
          html: req.html,
          text: req.text,
          reply_to: req.replyTo,
          cc: req.cc,
          bcc: req.bcc,
          tags: req.tags,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      const result = await response.json();
      return { id: result.id, success: true };
    } catch (error) {
      console.error("Send email error:", error);
      throw APIError.internal("Failed to send email");
    }
  }
);

// Sends a welcome email to new users.
export const sendWelcomeEmail = api<SendWelcomeEmailRequest, SendWelcomeEmailResponse>(
  { expose: true, method: "POST", path: "/notifications/welcome" },
  async (req) => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to SCRIBE AI</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #14b8a6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .features { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .feature { margin: 15px 0; padding-left: 25px; position: relative; }
            .feature:before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to SCRIBE AI!</h1>
              <p>Your AI-powered voice intelligence platform is ready</p>
            </div>
            <div class="content">
              <h2>Hi ${req.userName}!</h2>
              <p>Thank you for joining SCRIBE AI. You now have access to the most advanced AI-powered voice recording and transcription platform.</p>
              
              <div class="features">
                <h3>🚀 What you can do now:</h3>
                <div class="feature">Record meetings, calls, and interviews with one click</div>
                <div class="feature">Get instant AI transcriptions in 50+ languages</div>
                <div class="feature">Receive intelligent summaries with key points and action items</div>
                <div class="feature">Search through all your recordings with smart AI search</div>
                <div class="feature">Chat with your recordings using our AI assistant</div>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.VITE_APP_URL || 'http://localhost:5173'}/dashboard" class="button">
                  Start Recording Now →
                </a>
              </p>

              <p><strong>Pro Tips:</strong></p>
              <ul>
                <li>For best results, speak clearly and minimize background noise</li>
                <li>Try our real-time transcription feature for live meetings</li>
                <li>Use tags to organize your recordings by project or topic</li>
                <li>Export your transcripts in multiple formats (PDF, Word, etc.)</li>
              </ul>

              <p>Need help getting started? Reply to this email or check out our <a href="#">help center</a>.</p>
              
              <p>Happy recording!<br>
              The SCRIBE AI Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey()}`,
        },
        body: JSON.stringify({
          from: "SCRIBE AI <welcome@scribeai.com>",
          to: req.userEmail,
          subject: "🎉 Welcome to SCRIBE AI - Your AI Voice Intelligence Platform",
          html,
          tags: [
            { name: "category", value: "welcome" },
            { name: "user_type", value: "new_user" },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Send welcome email error:", error);
      throw APIError.internal("Failed to send welcome email");
    }
  }
);

// Sends a notification email when a recording is processed.
export const sendRecordingNotification = api<SendRecordingNotificationRequest, SendRecordingNotificationResponse>(
  { expose: true, method: "POST", path: "/notifications/recording" },
  async (req) => {
    try {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Recording Processed - SCRIBE AI</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #14b8a6); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .summary-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .button { display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Recording Processed!</h1>
              <p>Your AI transcription and summary are ready</p>
            </div>
            <div class="content">
              <h2>📝 "${req.recordingTitle}"</h2>
              <p>Great news! Your recording has been successfully processed by our AI system.</p>
              
              <div class="summary-box">
                <h3>📋 AI Summary:</h3>
                <p>${req.summary}</p>
              </div>

              <p style="text-align: center;">
                <a href="${process.env.VITE_APP_URL || 'http://localhost:5173'}/note/${req.recordingId}" class="button">
                  View Full Transcript →
                </a>
              </p>

              <p><strong>What's included:</strong></p>
              <ul>
                <li>✅ Complete AI transcription</li>
                <li>✅ Intelligent summary with key points</li>
                <li>✅ Action items and decisions identified</li>
                <li>✅ Searchable content for future reference</li>
              </ul>

              <p>You can now search, share, and export your recording from your dashboard.</p>
              
              <p>Keep recording!<br>
              The SCRIBE AI Team</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey()}`,
        },
        body: JSON.stringify({
          from: "SCRIBE AI <notifications@scribeai.com>",
          to: req.userEmail,
          subject: `🎯 Recording "${req.recordingTitle}" is ready!`,
          html,
          tags: [
            { name: "category", value: "recording_notification" },
            { name: "recording_id", value: req.recordingId.toString() },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Send recording notification error:", error);
      throw APIError.internal("Failed to send recording notification");
    }
  }
);

// Sends billing-related notification emails.
export const sendBillingNotification = api<SendBillingNotificationRequest, SendBillingNotificationResponse>(
  { expose: true, method: "POST", path: "/notifications/billing" },
  async (req) => {
    try {
      let subject = "";
      let html = "";

      switch (req.type) {
        case "payment_success":
          subject = "✅ Payment Successful - SCRIBE AI";
          html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #10b981, #14b8a6); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1>✅ Payment Successful!</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Thank you! Your payment has been processed successfully.</p>
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p><strong>Amount:</strong> $${req.details.amount}</p>
                  <p><strong>Plan:</strong> ${req.details.plan}</p>
                  <p><strong>Next billing date:</strong> ${req.details.nextBillingDate}</p>
                </div>
                <p>Your premium features are now active. Enjoy unlimited recordings and advanced AI features!</p>
              </div>
            </div>
          `;
          break;

        case "payment_failed":
          subject = "⚠️ Payment Failed - SCRIBE AI";
          html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1>⚠️ Payment Failed</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>We were unable to process your payment for SCRIBE AI.</p>
                <p>Please update your payment method to continue enjoying premium features.</p>
                <p style="text-align: center;">
                  <a href="${process.env.VITE_APP_URL || 'http://localhost:5173'}/billing" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Update Payment Method
                  </a>
                </p>
              </div>
            </div>
          `;
          break;

        case "subscription_cancelled":
          subject = "Subscription Cancelled - SCRIBE AI";
          html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: #6b7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1>Subscription Cancelled</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Your SCRIBE AI subscription has been cancelled.</p>
                <p>You'll continue to have access to premium features until ${req.details.accessUntil}.</p>
                <p>We're sorry to see you go! If you change your mind, you can reactivate your subscription anytime.</p>
              </div>
            </div>
          `;
          break;

        case "trial_ending":
          subject = "⏰ Trial Ending Soon - SCRIBE AI";
          html = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1>⏰ Trial Ending Soon</h1>
              </div>
              <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
                <p>Your SCRIBE AI trial ends in ${req.details.daysLeft} days.</p>
                <p>Don't lose access to your AI-powered voice intelligence platform!</p>
                <p style="text-align: center;">
                  <a href="${process.env.VITE_APP_URL || 'http://localhost:5173'}/billing" style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
                    Upgrade Now
                  </a>
                </p>
              </div>
            </div>
          `;
          break;
      }

      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey()}`,
        },
        body: JSON.stringify({
          from: "SCRIBE AI <billing@scribeai.com>",
          to: req.userEmail,
          subject,
          html,
          tags: [
            { name: "category", value: "billing" },
            { name: "type", value: req.type },
          ],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Send billing notification error:", error);
      throw APIError.internal("Failed to send billing notification");
    }
  }
);
