// utils/sendEmail.js - Using Brevo API (ES6)
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

// Configure the API key
const emailAPI = new TransactionalEmailsApi();
emailAPI.authentications.apiKey.apiKey = process.env.BREVO_API_KEY;

const sendEmail = async (to, subject, html) => {
  try {
    const message = new SendSmtpEmail();
    message.subject = subject;
    message.htmlContent = html;
    message.sender = {
      name: "Kivelo",
      email: "dawoduolalekanfatai@gmail.com", // Must be a verified sender in your Brevo account
    };
    message.to = [{ email: to }];

    const response = await emailAPI.sendTransacEmail(message);
    console.log(`✅ Email sent successfully to ${to}`);
    return { success: true, response };

  } catch (error) {
    console.error('❌ Brevo API error:', error.message);
    
    // More detailed error logging
    if (error.response) {
      console.error('Brevo API response:', error.response.body);
    }
    
    return { 
      success: false, 
      error: error.message,
      details: error.response?.body 
    };
  }
};

export default sendEmail;