const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Email templates
const emailTemplates = {
  applicationSubmitted: (userName, jobTitle, company) => ({
    subject: `Application Submitted - ${jobTitle} at ${company}`,
    html: `
      <h2>Application Submitted Successfully</h2>
      <p>Dear ${userName},</p>
      <p>Your application for the position of <strong>${jobTitle}</strong> at <strong>${company}</strong> has been successfully submitted.</p>
      <p>We will review your application and get back to you soon.</p>
      <p>Best regards,<br>Job Portal Team</p>
    `
  }),

  applicationStatusUpdate: (userName, jobTitle, company, status) => ({
    subject: `Application Status Update - ${jobTitle}`,
    html: `
      <h2>Application Status Update</h2>
      <p>Dear ${userName},</p>
      <p>Your application status for <strong>${jobTitle}</strong> at <strong>${company}</strong> has been updated to: <strong>${status}</strong>.</p>
      <p>You can check your application details in your dashboard.</p>
      <p>Best regards,<br>Job Portal Team</p>
    `
  }),

  newApplication: (employerName, applicantName, jobTitle) => ({
    subject: `New Application Received - ${jobTitle}`,
    html: `
      <h2>New Application Received</h2>
      <p>Dear ${employerName},</p>
      <p>A new application has been submitted for <strong>${jobTitle}</strong> by ${applicantName}.</p>
      <p>You can review the application in your dashboard.</p>
      <p>Best regards,<br>Job Portal Team</p>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const { subject, html } = emailTemplates[template](...data);

    const mailOptions = {
      from: `"Job Portal" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to}`);
  } catch (error) {
    logger.error('Email sending failed:', error);
    throw error;
  }
};

module.exports = {
  // Send application confirmation to applicant
  sendApplicationConfirmation: async (user, job) => {
    await sendEmail(
      user.email,
      'applicationSubmitted',
      [user.name, job.title, job.company]
    );
  },

  // Send application status update to applicant
  sendStatusUpdate: async (user, job, status) => {
    await sendEmail(
      user.email,
      'applicationStatusUpdate',
      [user.name, job.title, job.company, status]
    );
  },

  // Notify employer about new application
  notifyEmployerNewApplication: async (employer, applicant, job) => {
    await sendEmail(
      employer.email,
      'newApplication',
      [employer.name, applicant.name, job.title]
    );
  }
};