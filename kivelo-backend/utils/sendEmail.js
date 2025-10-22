// utils/sendEmail.js
import nodemailer from 'nodemailer';

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465, // Changed to 465 with SSL
      secure: true, // Set to true for port 465
      auth: {
        user: process.env.GMAIL_USER, // Your Gmail address
        pass: process.env.GMAIL_APP_PASSWORD, // Your 16-character App Password
      },
      connectionTimeout: 30000, // Reduced to 30 seconds
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });

    // The "from" address MUST be the same as your auth user.
    // Gmail will ignore this and use your authenticated email, but the display name "Kivelo" will be shown.
    const mailOptions = {
      from: `"Kivelo" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    };

    const response = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}`);
    return { success: true, response };
    
  } catch (error) {
    console.error('❌ Gmail error:', error.message);
    return { success: false, error: error.message };
  }
};

export default sendEmail;