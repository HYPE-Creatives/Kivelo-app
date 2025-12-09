// utils/sendEmail.js
import Brevo from "@getbrevo/brevo";

const apiInstance = new Brevo.TransactionalEmailsApi();

// 🔑 CORRECT way to set API key for 2024+ SDKs
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

export const sendEmail = async (to, subject, html) => {
  try {
    const email = new Brevo.SendSmtpEmail();

    email.sender = {
      name: "Kivelo",
      email: process.env.BREVO_SENDER_EMAIL,  // Must be VERIFIED sender!
    };

    email.to = [{ email: to }];
    email.subject = subject;
    email.htmlContent = html;

    const result = await apiInstance.sendTransacEmail(email);

    console.log("📧 Email sent!", result.messageId || result);
    return { success: true };
  } catch (err) {
    console.error("❌ Brevo Send Error:", err.response?.body || err.message);
    return {
      success: false,
      error: err.response?.body || err.message,
    };
  }
};
