const { Server } = require('socket.io');
const { ChatMessage } = require('./models');
const crypto = require('crypto');

// Helper function to generate message hash for deduplication
const generateMessageHash = (senderEmail, receiverEmail, message, timestamp) => {
  const data = `${senderEmail}:${receiverEmail || 'admin'}:${message}:${timestamp}`;
  return crypto.createHash('md5').update(data).digest('hex');
};

function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: '*' },
  });

  
  const connectedUsers = new Map();
  const connectedAdmins = new Map(); // email -> socket
  const offlineMessages = new Map(); // adminEmail -> array of messages
  const guestUsers = new Map(); // guestId -> user info

  io.on('connection', (socket) => {
    console.log(`Socket ${socket.id} connected`);

    socket.on('identify', (payload) => {
      let email = payload;
      let role = 'user';
      let isGuest = false;
      
      if (typeof payload === 'object') {
        email = payload.email || payload.userEmail;
        role = payload.role || 'user';
        isGuest = payload.isGuest || false;
      }
      
      if (email) {
        connectedUsers.set(email, socket);
        
        // Handle guest users
        if (isGuest) {
          guestUsers.set(email, {
            id: email,
            connectedAt: new Date().toISOString(),
            socket: socket
          });
          console.log(`[SOCKET] Guest user ${email} connected. Total guests: ${guestUsers.size}`);
        }
        
        if (role === 'admin') {
          connectedAdmins.set(email, socket);
          console.log(`[SOCKET] Admin ${email} connected. Total admins: ${connectedAdmins.size}`);
          
          // Deliver offline messages to admin when they come online
          if (offlineMessages.has(email)) {
            const messages = offlineMessages.get(email);
            console.log(`[SOCKET] Delivering ${messages.length} offline messages to admin ${email}`);
            
            messages.forEach(msg => {
              socket.emit('message', msg);
            });
            
            // Clear offline messages after delivery
            offlineMessages.delete(email);
          }
        }
        
        console.log(`[SOCKET] User ${email} identified as ${role}${isGuest ? ' (guest)' : ''}. Total users: ${connectedUsers.size}`);
      } else {
        console.log(`[SOCKET] Warning: No email provided in identify payload:`, payload);
      }
    });

    socket.on('sendMessage', async ({ senderEmail, receiverEmail, message, timestamp }) => {
      try {
        if (!senderEmail || !message) {
          return socket.emit('error', { message: 'Missing required fields' });
        }

        // Create message with proper timestamp and hash
        const messageTimestamp = timestamp || new Date().toISOString();
        const messageHash = generateMessageHash(senderEmail, receiverEmail, message, messageTimestamp);
        
        // Check if message already exists (deduplication)
        const existingMessage = await ChatMessage.findOne({
          where: { messageHash }
        });

        if (existingMessage) {
          console.log(`[SOCKET] Duplicate message detected, skipping: ${messageHash}`);
          return; // Don't process duplicate messages
        }

        const messageData = {
          senderEmail,
          receiverEmail: receiverEmail || 'admin',
          message,
          timestamp: messageTimestamp,
          messageHash
        };

        const newMessage = await ChatMessage.create(messageData);
        const messageToEmit = {
          ...newMessage.toJSON(),
          timestamp: messageData.timestamp
        };

        console.log(`[SOCKET] Message from ${senderEmail} to ${receiverEmail || 'admin'}: ${message}`);

        // Check if this is a message to admin (null, undefined, or admin patterns)
        const isToAdmin = !receiverEmail || 
                         receiverEmail === null ||
                         receiverEmail === undefined ||
                         receiverEmail === 'admin' || 
                         receiverEmail === 'admin@killswitch.us' ||
                         (typeof receiverEmail === 'string' && receiverEmail.includes('admin'));

        if (isToAdmin) {
          // Broadcast to ALL connected admins - no hardcoded emails
          let adminMessageSent = false;
          console.log(`[SOCKET] Broadcasting message from ${senderEmail} to ALL admins. Connected admins: ${connectedAdmins.size}`);
          
          if (connectedAdmins.size > 0) {
            // Send to online admins
            for (const [adminEmail, adminSocket] of connectedAdmins.entries()) {
              if (adminSocket !== socket) {
                console.log(`[SOCKET] → Sending to online admin: ${adminEmail}`);
                adminSocket.emit('message', {
                  ...messageToEmit,
                  receiverEmail: adminEmail, // Set the specific admin's email as receiver
                });
                adminMessageSent = true;
              }
            }
            console.log(`[SOCKET] ✅ Message broadcast to ${connectedAdmins.size} online admin(s)`);
          } else {
            // No admins online - store message for offline delivery
            console.log(`[SOCKET] ⚠️  No admins online - storing message for offline delivery`);
            
            // Store message for ALL admin emails (you can customize this list)
            const adminEmails = ['admin@killswitch.us', 'contact@killswitch.us']; // Add your admin emails here
            
            adminEmails.forEach(adminEmail => {
              if (!offlineMessages.has(adminEmail)) {
                offlineMessages.set(adminEmail, []);
              }
              
              offlineMessages.get(adminEmail).push({
                ...messageToEmit,
                receiverEmail: adminEmail,
                isOfflineMessage: true,
                storedAt: new Date().toISOString()
              });
              
              console.log(`[SOCKET] 📥 Stored offline message for admin: ${adminEmail}`);
            });
            
            // Also store in database for persistence across server restarts
            try {
              await ChatMessage.create({
                ...messageData,
                receiverEmail: 'admin',
                isOfflineMessage: true
              });
              console.log(`[SOCKET] 💾 Message persisted to database for offline delivery`);
            } catch (dbError) {
              console.error(`[SOCKET] ❌ Failed to persist offline message:`, dbError);
            }
          }
        } else {
          // Route to specific receiver if provided and connected
          const receiverSocket = connectedUsers.get(receiverEmail);
          if (receiverSocket && receiverSocket !== socket) {
            console.log(`[SOCKET] Sending message to specific receiver: ${receiverEmail}`);
            receiverSocket.emit('message', messageToEmit);
          } else {
            console.log(`[SOCKET] Receiver ${receiverEmail} not connected`);
          }
        }

        // Don't emit back to sender to avoid duplicates - sender already added message to their UI

      } catch (err) {
        console.error('Error sending message:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', () => {
      for (let [email, sock] of connectedUsers.entries()) {
        if (sock === socket) {
          connectedUsers.delete(email);
          connectedAdmins.delete(email);
          
          // Clean up guest users
          if (guestUsers.has(email)) {
            guestUsers.delete(email);
            console.log(`Guest user ${email} disconnected`);
          } else {
            console.log(`User ${email} disconnected`);
          }
          break;
        }
      }
      console.log(`Socket ${socket.id} disconnected`);
    });
  });

}

module.exports = { setupSocket };
