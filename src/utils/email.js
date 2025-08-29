const nodemailer = require("nodemailer");

// --- CHANGE: The function now accepts one "options" object ---
const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Or GMAIL_USER
      pass: process.env.EMAIL_PASS,   // Or GMAIL_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: `"Your App Name" <${process.env.EMAIL_USER}>`,
    to: options.email,       // --- CHANGE: Use options.email ---
    subject: options.subject,  // --- CHANGE: Use options.subject ---
    text: options.message,     // --- CHANGE: Use options.message ---
  };

  await transporter.sendMail(mailOptions);
};

// If you are using named exports, keep this
module.exports = { sendEmail };

