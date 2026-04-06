const { ChatMessage, User } = require('../models');
const { Op } = require('sequelize');
const messageCleanupService = require('../services/messageCleanupService');
const crypto = require('crypto');

// Helper function to generate message hash for deduplication
const generateMessageHash = (senderEmail, receiverEmail, message, timestamp) => {
  const data = `${senderEmail}:${receiverEmail}:${message}:${timestamp}`;
  return crypto.createHash('md5').update(data).digest('hex');
};

const getAdmins = async (req, res) => {
  try {
    const admins = await User.findAll({ where: { role: 'admin' }, attributes: ['email', 'name', 'id'] });
    return res.json(admins);
  } catch (e) {
    return res.status(500).json({ error: 'Failed to fetch admins' });
  }
};

const getConversations = async (req, res) => {
  try {
    const { adminEmail } = req.query;
    if (!adminEmail) return res.status(400).json({ error: 'adminEmail is required' });

    console.log(`[CHAT] Getting conversations for admin: ${adminEmail}`);

    const msgs = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          { senderEmail: adminEmail },
          { receiverEmail: adminEmail },
          { receiverEmail: 'admin' },
          { receiverEmail: null }
        ]
      },
      order: [['createdAt', 'DESC']]
    });

    console.log(`[CHAT] Found ${msgs.length} total messages for admin conversations`);

    const users = new Map();
    msgs.forEach(m => {
      let other;
      if (m.senderEmail === adminEmail) {
        // Message from admin to user
        other = m.receiverEmail;
      } else {
        // Message from user to admin (including guest users)
        other = m.senderEmail;
      }
      
      if (other && other !== adminEmail && other !== 'admin' && other !== null) {
        if (!users.has(other)) {
          users.set(other, { 
            email: other,
            isGuest: other.startsWith('guest_'),
            lastMessage: m.message,
            lastMessageTime: m.createdAt
          });
          console.log(`[CHAT] Added conversation with user: ${other} (guest: ${other.startsWith('guest_')})`);
        }
      }
    });

    console.log(`[CHAT] Returning ${users.size} conversations`);
    return res.json(Array.from(users.values()));
  } catch (e) {
    console.error('[CHAT] Error fetching conversations:', e);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

const getMessages = async (req, res) => {
  try {
    const { adminEmail, userEmail } = req.query;
    if (!adminEmail || !userEmail) return res.status(400).json({ error: 'adminEmail and userEmail are required' });

    console.log(`[CHAT] Getting messages between admin: ${adminEmail} and user: ${userEmail}`);

    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          // Messages from admin to user
          { senderEmail: adminEmail, receiverEmail: userEmail },
          // Messages from user to admin (specific admin)
          { senderEmail: userEmail, receiverEmail: adminEmail },
          // Messages from user to admin (generic admin or null - for guest users)
          { 
            senderEmail: userEmail, 
            [Op.or]: [
              { receiverEmail: 'admin' },
              { receiverEmail: null }
            ]
          }
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    console.log(`[CHAT] Found ${messages.length} messages for conversation ${userEmail} <-> ${adminEmail}`);
    return res.json(messages);
  } catch (e) {
    console.error('[CHAT] Error fetching messages:', e);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Send a new chat message
const sendMessage = async (req, res) => {
  try {
    const { senderEmail, receiverEmail, message } = req.body;

    if (!senderEmail || !receiverEmail || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const newMessage = await ChatMessage.create({
      senderEmail,
      receiverEmail,
      message,
    });

    return res.status(201).json({ message: 'Message sent', data: newMessage });
  } catch (err) {
    console.error('Send Message Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Get chat history between two users
const getMessagesBetweenUsers = async (req, res) => {
  try {
    const { user1, user2 } = req.query;

    if (!user1 || !user2) {
      return res.status(400).json({ error: 'Both user emails are required' });
    }

    const messages = await ChatMessage.findAll({
      where: {
        [Op.or]: [
          { senderEmail: user1, receiverEmail: user2 },
          { senderEmail: user2, receiverEmail: user1 },
        ],
      },
      order: [['createdAt', 'ASC']],
    });

    return res.status(200).json({ messages });
  } catch (err) {
    console.error('Fetch Chat History Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Manual cleanup trigger (admin only)
const triggerCleanup = async (req, res) => {
  try {
    await messageCleanupService.manualCleanup();
    const stats = await messageCleanupService.getCleanupStats();
    return res.json({ 
      message: 'Cleanup completed successfully', 
      stats 
    });
  } catch (error) {
    console.error('Manual cleanup error:', error);
    return res.status(500).json({ error: 'Failed to perform cleanup' });
  }
};

// Get cleanup statistics
const getCleanupStats = async (req, res) => {
  try {
    const stats = await messageCleanupService.getCleanupStats();
    return res.json(stats);
  } catch (error) {
    console.error('Get cleanup stats error:', error);
    return res.status(500).json({ error: 'Failed to get cleanup stats' });
  }
};

// Get offline messages for admin when they come online
const getOfflineMessages = async (req, res) => {
  try {
    const { adminEmail } = req.query;
    if (!adminEmail) {
      return res.status(400).json({ error: 'adminEmail is required' });
    }

    console.log(`[CHAT] Getting offline messages for admin: ${adminEmail}`);

    // Get messages sent to admin while they were offline AND not seen yet
    const offlineMessages = await ChatMessage.findAll({
      where: {
        [Op.and]: [
          {
            [Op.or]: [
              { receiverEmail: adminEmail },
              { receiverEmail: 'admin' },
              { receiverEmail: null }
            ]
          },
          { isOfflineMessage: true },
          { seenByAdmin: false } // Only unseen messages
        ]
      },
      order: [['createdAt', 'ASC']]
    });

    console.log(`[CHAT] Found ${offlineMessages.length} unseen offline messages for ${adminEmail}`);

    // Group messages by sender to avoid showing duplicate conversations
    const messagesBySender = new Map();
    offlineMessages.forEach(msg => {
      if (!messagesBySender.has(msg.senderEmail)) {
        messagesBySender.set(msg.senderEmail, []);
      }
      messagesBySender.get(msg.senderEmail).push(msg);
    });

    // Return only the latest message from each sender to avoid overwhelming the admin
    const uniqueMessages = Array.from(messagesBySender.values()).map(messages => {
      return messages[messages.length - 1]; // Get the latest message from each sender
    });

    console.log(`[CHAT] Returning ${uniqueMessages.length} unique offline messages from ${messagesBySender.size} senders`);

    return res.json({
      messages: uniqueMessages,
      count: uniqueMessages.length,
      totalOfflineMessages: offlineMessages.length
    });
  } catch (error) {
    console.error('Get offline messages error:', error);
    return res.status(500).json({ error: 'Failed to get offline messages' });
  }
};

// Mark offline messages as delivered
const markOfflineMessagesDelivered = async (req, res) => {
  try {
    const { adminEmail, messageIds } = req.body;
    if (!adminEmail) {
      return res.status(400).json({ error: 'adminEmail is required' });
    }

    let whereClause = {
      isOfflineMessage: true
    };

    if (messageIds && messageIds.length > 0) {
      // Mark specific messages as delivered
      whereClause.id = { [Op.in]: messageIds };
    } else {
      // Mark all offline messages for this admin as delivered
      whereClause[Op.or] = [
        { receiverEmail: adminEmail },
        { receiverEmail: 'admin' }
      ];
    }

    const updatedCount = await ChatMessage.update(
      { isOfflineMessage: false, deliveredAt: new Date() },
      { where: whereClause }
    );

    return res.json({
      message: 'Offline messages marked as delivered',
      updatedCount: updatedCount[0]
    });
  } catch (error) {
    console.error('Mark offline messages delivered error:', error);
    return res.status(500).json({ error: 'Failed to mark messages as delivered' });
  }
};

// Mark messages as seen by admin when they open a conversation
const markMessagesAsSeen = async (req, res) => {
  try {
    const { adminEmail, userEmail } = req.body;
    if (!adminEmail || !userEmail) {
      return res.status(400).json({ error: 'adminEmail and userEmail are required' });
    }

    console.log(`[CHAT] Marking messages as seen for conversation: ${userEmail} -> ${adminEmail}`);

    // Mark all messages from this user to admin as seen
    const updatedCount = await ChatMessage.update(
      { 
        seenByAdmin: true, 
        seenAt: new Date(),
        isOfflineMessage: false // Also mark as no longer offline since admin has seen them
      },
      { 
        where: {
          senderEmail: userEmail,
          [Op.or]: [
            { receiverEmail: adminEmail },
            { receiverEmail: 'admin' },
            { receiverEmail: null }
          ],
          seenByAdmin: false
        }
      }
    );

    console.log(`[CHAT] Marked ${updatedCount[0]} messages as seen`);

    return res.json({
      message: 'Messages marked as seen',
      updatedCount: updatedCount[0]
    });
  } catch (error) {
    console.error('Mark messages as seen error:', error);
    return res.status(500).json({ error: 'Failed to mark messages as seen' });
  }
};

module.exports = {
  getAdmins,
  getConversations,
  getMessages,
  sendMessage,
  getMessagesBetweenUsers,
  triggerCleanup,
  getCleanupStats,
  getOfflineMessages,
  markOfflineMessagesDelivered,
  markMessagesAsSeen,
};
