const nodemailer = require('nodemailer');

// Check if email is configured
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('📧 Email service disabled - no credentials configured');
  module.exports = {
    sendAppointmentReminder: async () => console.log('Email skipped'),
    sendAppointmentConfirmation: async () => console.log('Email skipped')
  };
} else {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const sendAppointmentReminder = async (userEmail, userName, appointmentDetails) => {
    const { service, date, startTime } = appointmentDetails;
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Appointment Reminder',
        html: `<h2>Reminder</h2><p>Dear ${userName}, your ${service} appointment is on ${new Date(date).toLocaleDateString()} at ${startTime}</p>`
      });
      console.log('📧 Reminder sent');
    } catch (error) {
      console.error('Email error:', error.message);
    }
  };

  const sendAppointmentConfirmation = async (userEmail, userName, appointmentDetails) => {
    const { service, date, startTime } = appointmentDetails;
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: 'Appointment Confirmed',
        html: `<h2>Confirmed</h2><p>Dear ${userName}, your ${service} appointment is confirmed for ${new Date(date).toLocaleDateString()} at ${startTime}</p>`
      });
      console.log('📧 Confirmation sent');
    } catch (error) {
      console.error('Email error:', error.message);
    }
  };

  module.exports = { sendAppointmentReminder, sendAppointmentConfirmation };
}