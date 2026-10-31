/**
 * SMS Gateway Service for AgriMech
 * Supports:
 * 1. Fast2SMS (Direct Indian Mobile SMS - fast2sms.com)
 * 2. Twilio SMS
 * 3. Development / Test Mode (prominent terminal box & preview)
 */

export interface SmsSendResult {
  success: boolean;
  provider: 'fast2sms' | 'twilio' | 'dev_console';
  message: string;
}

declare const process: any;
declare const Buffer: any;

export class SmsService {
  /**
   * Dispatches OTP SMS to a mobile phone number
   * @param phone 10-digit Indian phone or with +91 prefix
   * @param otp 6-digit verification code
   */
  static async sendOtp(phone: string, otp: string): Promise<SmsSendResult> {
    const rawDigits = phone.replace(/\D/g, '').slice(-10);
    const internationalPhone = `+91${rawDigits}`;

    const fast2smsApiKey = process.env.FAST2SMS_API_KEY;
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

    // 1. If Fast2SMS API key is configured (Standard in India)
    if (fast2smsApiKey && fast2smsApiKey.trim().length > 5) {
      try {
        console.log(`[AgriMech SMS] Dispatching live SMS via Fast2SMS to +91 ${rawDigits}...`);
        const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
          method: 'POST',
          headers: {
            authorization: fast2smsApiKey.trim(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            route: 'otp',
            variables_values: otp,
            numbers: rawDigits
          })
        });

        const data: any = await response.json();
        if (data && (data.return === true || data.status_code === 200)) {
          console.log(`[AgriMech SMS] SMS successfully delivered to ${rawDigits} via Fast2SMS!`);
          return {
            success: true,
            provider: 'fast2sms',
            message: 'OTP delivered to your phone via Fast2SMS.'
          };
        } else {
          console.warn(`[AgriMech SMS Warning] Fast2SMS returned:`, data);
        }
      } catch (err: any) {
        console.error(`[AgriMech SMS Error] Fast2SMS API error:`, err.message);
      }
    }

    // 2. If Twilio credentials are configured
    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        console.log(`[AgriMech SMS] Dispatching live SMS via Twilio to ${internationalPhone}...`);
        const authHeader = 'Basic ' + Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString('base64');
        const formBody = new URLSearchParams({
          To: internationalPhone,
          From: twilioPhoneNumber,
          Body: `Your AgriMech verification code is ${otp}. Valid for 5 minutes. Do not share this OTP.`
        });

        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formBody.toString()
          }
        );

        if (response.ok) {
          console.log(`[AgriMech SMS] Twilio message dispatched to ${internationalPhone}!`);
          return {
            success: true,
            provider: 'twilio',
            message: 'OTP delivered to your phone via Twilio.'
          };
        }
      } catch (err: any) {
        console.error(`[AgriMech SMS Error] Twilio API error:`, err.message);
      }
    }

    // 3. Development / Safe Instant Mode (Formats cleanly in terminal and allows instant testing)
    console.log(`\n` +
      `========================================================================\n` +
      `  📱 [AGRIMECH REAL SMS GATEWAY - DEV CONSOLE]\n` +
      `  Recipient Mobile : +91 ${rawDigits}\n` +
      `  One-Time Code    : [ ${otp} ]\n` +
      `  Validity         : 5 Minutes (Expires at ${new Date(Date.now() + 5 * 60 * 1000).toLocaleTimeString()})\n` +
      `  Message          : "Your AgriMech verification OTP is ${otp}."\n` +
      `  Tip              : To receive on real SIM, add FAST2SMS_API_KEY in .env\n` +
      `========================================================================\n`
    );

    return {
      success: true,
      provider: 'dev_console',
      message: 'OTP generated and logged to console for testing.'
    };
  }
}
