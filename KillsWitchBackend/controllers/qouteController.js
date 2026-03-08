const { ActivityLog, Quote } = require("../models");
const { sendEmail } = require("../utils/email");

const handleQuoteRequest = async (req, res) => {
    const {
      name, email, phoneno, message, productcode,
      quantity, condition, target_price, status, recipient_email,
    } = req.body;
  
    try {
       await Quote.create({
        name, email, phoneno, message,
        productcode, quantity, condition, target_price, status, recipient_email,
      });
  
      await ActivityLog.create({
        user_email: email,
        activity: 'New Quote Added',
        details: {
          name, email, phoneno, message, productcode,
          quantity, condition, target_price, status,
        },
      });
  
      const subject = '📝 New Quote Request';
      const mailBody = `
        <p><strong>Dear Admin,</strong></p>
        <p>A new quote request has been received on <strong>KillSwitch</strong>! 📝</p>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phoneno}</li>
          <li><strong>Product Code:</strong> ${productcode}</li>
          <li><strong>Message:</strong> ${message}</li>
          <li><strong>Condition:</strong> ${condition}</li>
          <li><strong>Status:</strong> ${status}</li>
          <li><strong>Target Price:</strong> ${target_price}</li>
          <li><strong>Requested On:</strong> ${new Date().toLocaleString()}</li>
        </ul>
        <p>Please review the request and get back to the client.</p>
        <hr />
        <p><em>This is an automated email. No reply is needed.</em></p>
      `;
  
      const emailResponse = await sendEmail(email, recipient_email || process.env.MAIL_USER, subject, mailBody);
      res.status(200).json({ success: true, emailResponse });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
  
  module.exports = { handleQuoteRequest};