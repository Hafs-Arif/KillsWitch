const { ActivityLog, Contact } = require("../models");
const { sendEmail } = require("../utils/email");

const handleContactRequest = async (req, res) => {
    const { name, email, message, phoneno, subject, recipient_email } = req.body;
    try {
      const newContact = await Contact.create({ name, email, message, phoneno });
  
      const activity = await ActivityLog.create({
        user_email: email,
        activity: subject || 'New Contact Request',
        details: { name, email, message, phoneno },
      });
  
      const emailSubject = `📩 New Contact Request from ${name}`;
      const emailBody = `
        <p><strong>Dear Admin,</strong></p>
        <p>You have received a new contact inquiry from <strong>KillSwitch</strong>!</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Message:</strong> ${message}</li>
          <li><strong>Phone:</strong> ${phoneno}</li>
          <li><strong>Submitted On:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <hr />
        <p><em>This is an automated email. No reply is needed.</em></p>
      `;
  
      // use fixed from address; include user email as reply-to so admin can easily respond
      const fromAddress = process.env.SMTP_FROM || process.env.email_user || 'contact@killswitch.us';
      const replyTo = email; // original sender

      try {
        await sendEmail(
          fromAddress,
          recipient_email || process.env.MAIL_USER || 'contact@killswitch.us',
          emailSubject,
          emailBody,
          null,
          { replyTo }
        );
      } catch (mailErr) {
        console.error('Contact request admin email failed:', mailErr);
        // don't abort the request; just log
      }

      // send confirmation to user
      const userSubject = '📧 Your message has been received';
      const userBody = `
        <p>Hi ${name},</p>
        <p>Thanks for reaching out to KillSwitch! We have received your message and will get back to you shortly.</p>
        <p>Here is a copy of what you sent:</p>
        <blockquote>${message}</blockquote>
        <p>— The KillSwitch Team</p>
      `;
      try {
        await sendEmail(fromAddress, email, userSubject, userBody);
      } catch (userMailErr) {
        console.error('Contact request user confirmation failed:', userMailErr);
      }

      res.status(200).json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
  module.exports = { handleContactRequest};