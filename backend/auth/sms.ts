import { secret } from "encore.dev/config";

const twilioAccountSid = secret("TwilioAccountSid");
const twilioAuthToken = secret("TwilioAuthToken");
const twilioPhoneNumber = secret("TwilioPhoneNumber");

export async function sendSMS(phone: string, message: string): Promise<void> {
  // In a real implementation, use Twilio, AWS SNS, or another SMS service
  console.log(`Sending SMS to ${phone}: ${message}`);
  
  try {
    // Mock SMS sending for demo
    // In production, integrate with Twilio:
    /*
    const twilio = require('twilio')(twilioAccountSid(), twilioAuthToken());
    
    await twilio.messages.create({
      body: message,
      from: twilioPhoneNumber(),
      to: phone
    });
    */
    
    // For demo purposes, just log the message
    console.log(`SMS sent successfully to ${phone}`);
  } catch (error) {
    console.error("Failed to send SMS:", error);
    throw new Error("Failed to send SMS verification");
  }
}
