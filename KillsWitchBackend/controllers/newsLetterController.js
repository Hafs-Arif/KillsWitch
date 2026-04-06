const { ActivityLog, Newsletter, User } = require('../models');
const { sendEmail } = require('../utils/email');

const handleNewsletterSubscription = async (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'Valid email is required' });
  }

  try {
    // Check if email already exists
    const existingSubscription = await Newsletter.findOne({ where: { email } });
    
    if (existingSubscription) {
      return res.status(400).json({ 
        success: false, 
        error: 'This email is already subscribed to our newsletter' 
      });
    }

    // Create newsletter subscription
    const newsletter = await Newsletter.create({ email });

    // Log activity; include user_email only if a matching user exists
    const logEntry = {
      activity: 'New Newsletter Subscription',
      details: { email },
    };

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      logEntry.user_email = email;
    }

    try {
      await ActivityLog.create(logEntry);
    } catch (logError) {
      // logging failure shouldn't block newsletter subscription
      console.error('Failed to record activity log for newsletter subscription:', logError);
    }

    // Send welcome email to subscriber
    const welcomeSubject = '🎉 Welcome to KillSwitch Newsletter!';
    const welcomeBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #c70007 0%, #a50005 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #c70007; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎮 Welcome to KillSwitch!</h1>
          </div>
          <div class="content">
            <p><strong>Hi there!</strong></p>
            <p>Thank you for subscribing to the <strong>KillSwitch Newsletter</strong>! 🎉</p>
            <p>You're now part of our gaming community and will be the first to know about:</p>
            <ul>
              <li>🎮 New gaming hardware releases</li>
              <li>💰 Exclusive deals and discounts</li>
              <li>🔥 Hot gaming trends and tips</li>
              <li>⚡ Special promotions just for subscribers</li>
            </ul>
            <p style="text-align: center;">
              <a href="https://www.killswitch.us/products" class="button">Browse Our Products</a>
            </p>
            <p>Stay tuned for exciting updates!</p>
            <p><strong>Game On!</strong><br>The KillSwitch Team</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} KillSwitch. All rights reserved.</p>
            <p>8408/8409 Rise Commercial District, 7840 Tyler Boulevard, Mentor Ohio. 44060</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send admin notification email
    const adminSubject = '📩 New Newsletter Subscription Alert';
    const adminBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #c70007; color: white; padding: 20px; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px; }
          .info-box { background: white; padding: 15px; border-left: 4px solid #c70007; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>📩 New Newsletter Subscription</h2>
          </div>
          <div class="content">
            <p><strong>Dear Admin,</strong></p>
            <p>A new user has subscribed to the <strong>KillSwitch Newsletter</strong>! 🎉</p>
            <div class="info-box">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Subscribed At:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p><em>This is an automated notification.</em></p>
          </div>
        </div>
      </body>
      </html>
    `;

    try {
      // Send welcome email to subscriber
      await sendEmail(
        process.env.SMTP_FROM || process.env.email_user,
        email,
        welcomeSubject,
        welcomeBody
      );

      // Send notification to admin
      await sendEmail(
        process.env.SMTP_FROM || process.env.email_user,
        process.env.email_user || 'contact@killswitch.us',
        adminSubject,
        adminBody
      );

      console.log('Newsletter subscription emails sent successfully');
    } catch (emailError) {
      console.error('Error sending newsletter emails:', emailError);
      // Don't fail the subscription if email fails
    }

    res.status(200).json({ 
      success: true, 
      message: 'Successfully subscribed to newsletter',
      newsletter 
    });
  } catch (err) {
    console.error('Newsletter subscription error:', err);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to subscribe. Please try again later.' 
    });
  }
};

const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Newsletter.findAll({
      attributes: ['newsletter_id', 'email', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']]
    });

    // Map newsletter_id to id and normalize timestamps for frontend
    const mappedData = subscriptions.map(sub => ({
      id: sub.newsletter_id,
      email: sub.email,
      createdAt: sub.created_at,
      updatedAt: sub.updated_at
    }));

    res.status(200).json({
      success: true,
      data: mappedData,
      total: mappedData.length
    });
  } catch (err) {
    console.error('Error fetching newsletter subscriptions:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscriptions'
    });
  }
};

const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Subscriber ID is required'
      });
    }

    const subscriber = await Newsletter.findOne({
      where: { newsletter_id: id }
    });
    
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        error: 'Subscriber not found'
      });
    }

    await subscriber.destroy();

    res.status(200).json({
      success: true,
      message: 'Subscriber deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting subscriber:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete subscriber'
    });
  }
};

module.exports = { handleNewsletterSubscription, getAllSubscriptions, deleteSubscription };