"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import { Send, X, MessageSquare, Users, RefreshCw } from "lucide-react";
import { BASE_URL, API, enhancedApi } from "../../api/api";

export default function AdminChat() {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false); // Start closed by default
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const messagesEndRef = useRef(null);
  // Updated URL as per requirements
  const [retryCount, setRetryCount] = useState(0);
  
  // Notification system
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [showNotification, setShowNotification] = useState(false);
  const [lastNotificationMessage, setLastNotificationMessage] = useState(null);

  // Admin email derived from logged-in profile
  const [senderEmail, setSenderEmail] = useState("");
  const STORAGE_THREADS_KEY = 'admin_chat_threads';
  const STORAGE_USERS_KEY = 'admin_chat_users';
  const STORAGE_LAST_SEEN_KEY = 'admin_last_seen_conversations';

  // Enhanced notification functions with KillSwitch theming
  const playNotificationSound = () => {
    try {
      // Create a more sophisticated notification sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create multiple oscillators for a richer sound
      const oscillator1 = audioContext.createOscillator();
      const oscillator2 = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      const filter = audioContext.createBiquadFilter();
      
      // Connect the audio graph
      oscillator1.connect(filter);
      oscillator2.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure oscillators
      oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator1.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      oscillator1.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
      
      oscillator2.frequency.setValueAtTime(400, audioContext.currentTime);
      oscillator2.frequency.setValueAtTime(500, audioContext.currentTime + 0.1);
      oscillator2.frequency.setValueAtTime(300, audioContext.currentTime + 0.2);
      
      // Configure filter for a more pleasant sound
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, audioContext.currentTime);
      
      // Configure gain envelope
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
      
      // Start and stop oscillators
      oscillator1.start(audioContext.currentTime);
      oscillator2.start(audioContext.currentTime);
      oscillator1.stop(audioContext.currentTime + 0.4);
      oscillator2.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.log('[ADMIN] Could not play notification sound:', error );
    }
  };

  const showNewMessageNotification = (messageData) => {
    setLastNotificationMessage(messageData);
    setShowNotification(true);
    
    // Play notification sound
    playNotificationSound();
    
    // Auto-hide notification after 5 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 5000);
    
    // Browser notification if permission granted
    if (Notification.permission === 'granted') {
      const notificationTitle = messageData.isOfflineMessage 
        ? 'Offline Message - KillSwitch Admin' 
        : 'New Message - KillSwitch Admin';
      
      new Notification(notificationTitle, {
        body: `${messageData.senderEmail}: ${messageData.message.substring(0, 100)}${messageData.message.length > 100 ? '...' : ''}`,
        icon: '/favicon.ico',
        tag: 'admin-chat'
      });
    }
  };

  const handleNotificationClick = () => {
    if (lastNotificationMessage) {
      if (lastNotificationMessage.isSummary) {
        // For summary notifications, just open the chat
        setIsOpen(true);
        setShowNotification(false);
      } else {
        // For individual message notifications, open the specific conversation
        const userEmail = lastNotificationMessage.senderEmail;
        selectUser(userEmail);
        setIsOpen(true);
        setShowNotification(false);
      }
    }
  };

  const showOfflineMessagesSummary = (offlineMessages) => {
    if (offlineMessages.length === 0) return;
    
    // Group messages by sender
    const messagesBySender = offlineMessages.reduce((acc, msg) => {
      if (!acc[msg.senderEmail]) {
        acc[msg.senderEmail] = [];
      }
      acc[msg.senderEmail].push(msg);
      return acc;
    }, {});
    
    const senderCount = Object.keys(messagesBySender).length;
    const totalMessages = offlineMessages.length;
    
    // Show summary notification
    const firstUserEmail = Object.keys(messagesBySender)[0]; // Get first user for navigation
    const summaryMessage = {
      senderEmail: firstUserEmail, // Use first user's email for navigation
      message: `${senderCount} user${senderCount > 1 ? 's' : ''} sent ${totalMessages} message${totalMessages > 1 ? 's' : ''} while you were away`,
      timestamp: new Date().toISOString(),
      isOfflineMessage: true,
      isSummary: true,
      userCount: senderCount,
      messageCount: totalMessages
    };
    
    setTimeout(() => {
      setLastNotificationMessage(summaryMessage);
      setShowNotification(true);
      playNotificationSound();
      
      // Auto-hide after 7 seconds for summary
      setTimeout(() => {
        setShowNotification(false);
      }, 7000);
      
      // Browser notification for summary
      if (Notification.permission === 'granted') {
        new Notification('Offline Messages - KillSwitch Admin', {
          body: `You have ${totalMessages} new message${totalMessages > 1 ? 's' : ''} from ${senderCount} user${senderCount > 1 ? 's' : ''} while you were away`,
          icon: '/favicon.ico',
          tag: 'admin-chat-summary'
        });
      }
    }, 500); // Small delay after login
  };

  // Last seen conversation management
  const getLastSeenTimestamp = (userEmail) => {
    try {
      const lastSeen = JSON.parse(localStorage.getItem(STORAGE_LAST_SEEN_KEY) || '{}');
      return lastSeen[userEmail] || 0;
    } catch (error) {
      console.error('[ADMIN] Error getting last seen timestamp:', error);
      return 0;
    }
  };

  const setLastSeenTimestamp = (userEmail, timestamp = Date.now()) => {
    try {
      const lastSeen = JSON.parse(localStorage.getItem(STORAGE_LAST_SEEN_KEY) || '{}');
      lastSeen[userEmail] = timestamp;
      localStorage.setItem(STORAGE_LAST_SEEN_KEY, JSON.stringify(lastSeen));
    } catch (error) {
      console.error('[ADMIN] Error setting last seen timestamp:', error);
    }
  };

  const hasUnreadMessages = (userEmail) => {
    try {
      const lastSeenTime = getLastSeenTimestamp(userEmail);
      const threads = JSON.parse(localStorage.getItem(STORAGE_THREADS_KEY) || '{}');
      const userMessages = threads[userEmail] || [];
      
      // Check if there are messages newer than last seen time
      const unreadMessages = userMessages.filter(msg => {
        const messageTime = new Date(msg.timestamp || msg.createdAt).getTime();
        return messageTime > lastSeenTime && msg.senderEmail === userEmail; // Only count messages FROM user
      });
            return unreadMessages.length > 0;
    } catch (error) {
      console.error('[ADMIN] Error checking unread messages:', error);
      return false;
    }
  };

  const refreshAllUnreadStatus = () => {
    setActiveUsers((prevUsers) => {
      const updated = prevUsers.map((user) => ({
        ...user,
        unread: hasUnreadMessages(user.email)
      }));
      
      try { localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
  };

  const updateUnreadCount = () => {
    const totalUnread = activeUsers.reduce((count, user) => {
      return count + (user.unread ? 1 : 0);
    }, 0);
    setTotalUnreadCount(totalUnread);
  };

  // Initialize socket connection
  const initializeSocket = () => {
    try {
      // Disconnect any existing socket first
      if (socket) {
        socket.disconnect();
      }

      // Create socket instance with explicit namespace and admin role
      const socketInstance = io(BASE_URL, {
        transports: ["polling", "websocket"], // Try polling first, then websocket
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 30000, // Increase timeout
        forceNew: true, // Force a new connection
        query: {
          role: "admin",
          email: senderEmail,
        },
      });

      setSocket(socketInstance);
      setConnectionError(null);

      // Socket event listeners
      socketInstance.on("connect", () => {
        setIsConnected(true);
        setConnectionError(null);

        // Identify admin to the server
        socketInstance.emit("identify", { userEmail: senderEmail, email: senderEmail, role: 'admin' });

        // Load persisted active users and offline messages
        (async () => {
          try {
            if (senderEmail) {
              // Load conversations
              const convos = await enhancedApi.call(`${BASE_URL}/chat/conversations?adminEmail=${encodeURIComponent(senderEmail)}`);
              const mapped = Array.isArray(convos) ? convos.map(c => ({ 
                email: c.email, 
                unread: hasUnreadMessages(c.email) // Check if user actually has unread messages
              })) : [];
              setActiveUsers(mapped);
              try { localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(mapped)); } catch (_) {}

              // Load offline messages
              try {
                const offlineResponse = await enhancedApi.call(`${BASE_URL}/chat/offline-messages?adminEmail=${encodeURIComponent(senderEmail)}`);
                if (offlineResponse.messages && offlineResponse.messages.length > 0) {
                  
                  // Show summary notification for offline messages
                  showOfflineMessagesSummary(offlineResponse.messages);
                  
                  // Process offline messages with enhanced deduplication
                  offlineResponse.messages.forEach(msg => {
                    // Add to messages state
                    setMessages((prevMessages) => {
                      const isDuplicate = prevMessages.some(existingMsg => {
                        // Check by ID if available (most reliable)
                        if (msg.id && existingMsg.id) {
                          return existingMsg.id === msg.id;
                        }
                        
                        // Fallback to strict content matching
                        return (
                          existingMsg.message === msg.message && 
                          existingMsg.senderEmail === msg.senderEmail && 
                          existingMsg.timestamp === msg.timestamp &&
                          existingMsg.receiverEmail === msg.receiverEmail
                        );
                      });
                      
                      if (!isDuplicate) {
                        const offlineMessageWithId = { 
                          ...msg, 
                          isOfflineMessage: true,
                          id: msg.id || `offline_${msg.senderEmail}_${msg.timestamp}_${Date.now()}`
                        };
                        
                        return [...prevMessages, offlineMessageWithId];
                      } else {
                        console.log(`[ADMIN] ❌ Duplicate offline message detected from`);
                      }
                      return prevMessages;
                    });

                    // Add sender to active users if not already there
                    setActiveUsers((prevUsers) => {
                      if (!prevUsers.some((user) => user.email === msg.senderEmail)) {
                        const updated = [...prevUsers, { email: msg.senderEmail, unread: true }];
                        try { localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated)); } catch (_) {}
                        return updated;
                      }
                      return prevUsers;
                    });
                  });

                  // Mark messages as delivered
                  const messageIds = offlineResponse.messages.map(msg => msg.id);
                  await enhancedApi.call(`${BASE_URL}/chat/offline-messages/delivered`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminEmail: senderEmail, messageIds })
                  });
                  
                  
                  // Refresh unread status for all users after processing offline messages
                  setTimeout(() => {
                    refreshAllUnreadStatus();
                  }, 1000);
                }
              } catch (offlineError) {
                console.error('[ADMIN] Failed to load offline messages:', offlineError);
              }
            }
          } catch (e) {
            console.error('[ADMIN] Failed to load conversations:', e);
          }
        })();
      });

      socketInstance.on("connect_error", (error) => {
        setConnectionError(error?.message ? `Connection error: ${error.message}` : 'Connection error');
        setIsConnected(false);
      });

      socketInstance.on("connect_timeout", (timeout) => {
        console.error(`[ADMIN] Connection timeout after ${timeout}ms`);
        setConnectionError(`Connection timeout after ${timeout}ms`);
        setIsConnected(false);
      });

      socketInstance.on("error", (error) => {
        console.error(`[ADMIN] Socket error:`, error);
        setConnectionError(`Socket error: ${error}`);
      });

      socketInstance.on("disconnect", (reason) => {
        console.log(
          `[ADMIN] Disconnected from socket server. Reason`
        );
        setIsConnected(false);

        // Try to reconnect if the disconnection was not intentional
        if (reason === "io server disconnect" || reason === "transport close") {
          socketInstance.connect();
        }
      });

      socketInstance.on("message", (data) => {
        
        // Check if sender is a guest user
        if (data.senderEmail && data.senderEmail.startsWith('guest_')) {
          console.log(`[ADMIN] 🎯 This is a GUEST USER message from`);
        }

        // Only add messages that are FOR this admin and not FROM this admin
        if (data.receiverEmail === senderEmail && data.senderEmail !== senderEmail) {
          setMessages((prevMessages) => {
            // Enhanced duplicate detection using multiple criteria
            const isDuplicate = prevMessages.some(msg => {
              // Check by ID if available (most reliable)
              if (data.id && msg.id) {
                return msg.id === data.id;
              }
              
              // Fallback to content + timestamp + sender (strict matching)
              return (
                msg.message === data.message && 
                msg.senderEmail === data.senderEmail && 
                msg.timestamp === data.timestamp &&
                msg.receiverEmail === data.receiverEmail
              );
            });
            
            if (!isDuplicate) {
              // Add unique identifier if not present
              const messageWithId = {
                ...data,
                id: data.id || `${data.senderEmail}_${data.timestamp}_${Date.now()}`
              };
              
              // Show notification for new message (only if chat is closed or user not selected)
              if (!isOpen || selectedUser !== data.senderEmail) {
                showNewMessageNotification(messageWithId);
              }
              
              return [...prevMessages, messageWithId];
            } else {
              console.log(`[ADMIN] ❌ Duplicate message detected, not adding:`);
            }
            return prevMessages;
          });

          // Persist threads per user - CRITICAL for message display
          try {
            const threads = JSON.parse(localStorage.getItem(STORAGE_THREADS_KEY) || '{}');
            const userKey = data.senderEmail;
            const userThread = Array.isArray(threads[userKey]) ? threads[userKey] : [];
            
            // Enhanced duplicate detection for localStorage threads
            const isDuplicateInThread = userThread.some(msg => {
              // Check by ID if available (most reliable)
              if (data.id && msg.id) {
                return msg.id === data.id;
              }
              
              // Fallback to strict content matching
              return (
                msg.message === data.message && 
                msg.senderEmail === data.senderEmail && 
                msg.timestamp === data.timestamp &&
                msg.receiverEmail === data.receiverEmail
              );
            });
            
            if (!isDuplicateInThread) {
              // Add unique identifier if not present
              const messageWithId = {
                ...data,
                id: data.id || `${data.senderEmail}_${data.timestamp}_${Date.now()}`
              };
              const updatedThread = [...userThread, messageWithId];
              threads[userKey] = updatedThread;
              localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(threads));
            } else {
              console.log(`[ADMIN] ❌ Message already exists in localStorage thread for`);
            }
          } catch (e) {
            console.error('[ADMIN] Failed to persist thread:', e);
          }

          // Add user to active users if not already there
          setActiveUsers((prevUsers) => {
            if (!prevUsers.some((user) => user.email === data.senderEmail)) {
              const updated = [...prevUsers, { email: data.senderEmail, unread: true }];
              try { localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated)); } catch (_) {}
              return updated;
            }

            // Mark user as having unread messages if not currently selected
            const updated = prevUsers.map((user) => {
              if (user.email === data.senderEmail) {
                // Only mark as unread if this user is not currently selected
                const shouldMarkUnread = selectedUser !== data.senderEmail;
                if (shouldMarkUnread) {

                  return { ...user, unread: true };
                } else {
                  // Update last seen timestamp since user is actively viewing
                  setLastSeenTimestamp(data.senderEmail);
                }
              }
              return user;
            });
            try { localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated)); } catch (_) {}
            return updated;
          });

          // If this user is currently selected, mark their messages as read
          if (selectedUser === data.senderEmail) {
      
            setActiveUsers((prevUsers) =>
              prevUsers.map((user) =>
                user.email === data.senderEmail
                  ? { ...user, unread: false }
                  : user
              )
            );
          }
        }
      });

      return socketInstance;
    } catch (error) {
      console.error("[ADMIN] Error initializing socket:", error);
      setConnectionError(`Error initializing socket: ${error.message}`);
      return null;
    }
  };

  // Connect to socket and derive admin email
  useEffect(() => {
    const fetchAdmin = async () => {
      try {
        const profile = await API.auth.getProfile();
        const email = profile?.user?.email || profile?.email || '';
        setSenderEmail(email);
      } catch (_) {
        setSenderEmail("");
      }
    };

    fetchAdmin();
    
    // Cleanup old messages from localStorage on component mount
    cleanupOldMessages();
    
    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
      });
    }
  }, []);

  // Update unread count when activeUsers changes
  useEffect(() => {
    updateUnreadCount();
  }, [activeUsers]);

  // Force unread count update on component mount
  useEffect(() => {
    if (activeUsers.length > 0) {
      updateUnreadCount();
    }
  }, []);

  // Cleanup old messages from localStorage (2 days retention to match backend)
  const cleanupOldMessages = () => {
    try {
      const RETENTION_HOURS = 48; // 2 days (matches backend retention)
      const cutoffTime = Date.now() - (RETENTION_HOURS * 60 * 60 * 1000);
      
      // Clean up stored threads
      const storedThreads = localStorage.getItem(STORAGE_THREADS_KEY);
      if (storedThreads) {
        const parsedThreads = JSON.parse(storedThreads);
        let cleanedCount = 0;
        
        Object.keys(parsedThreads).forEach(userEmail => {
          const userThread = parsedThreads[userEmail];
          if (Array.isArray(userThread)) {
            const recentMessages = userThread.filter(msg => {
              const messageTime = new Date(msg.timestamp || msg.createdAt).getTime();
              return messageTime > cutoffTime;
            });
            
            if (recentMessages.length !== userThread.length) {
              cleanedCount += userThread.length - recentMessages.length;
              parsedThreads[userEmail] = recentMessages;
            }
          }
        });
        
        if (cleanedCount > 0) {
          localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(parsedThreads));
        }
      }
    } catch (error) {
      console.error('[ADMIN] Error cleaning up old messages:', error);
    }
  };

  // Initialize socket only after senderEmail is available
  useEffect(() => {
    if (!senderEmail) {
      return;
    }

    const socketInstance = initializeSocket();

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [senderEmail, retryCount]);

  // Update filtered messages when selected user changes
  useEffect(() => {
    if (selectedUser) {
      // Mark user's messages as read
      setActiveUsers((prevUsers) => {
        const updated = prevUsers.map((user) =>
          user.email === selectedUser ? { ...user, unread: false } : user
        );
        try { localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated)); } catch (_) {}
        return updated;
      });

      // Load messages for this user from backend (persisted)
      (async () => {
        try {
          if (senderEmail && selectedUser) {
            
            // First, mark messages from this user as seen
            try {
              await enhancedApi.call(`${BASE_URL}/chat/messages/seen`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  adminEmail: senderEmail, 
                  userEmail: selectedUser 
                })
              });
            } catch (seenError) {
              console.error('[ADMIN] Failed to mark messages as seen:', seenError);
            }
            
            const apiUrl = `${BASE_URL}/chat/messages?adminEmail=${encodeURIComponent(senderEmail)}&userEmail=${encodeURIComponent(selectedUser)}`;
            
            const msgs = await enhancedApi.call(apiUrl);
            
            if (!Array.isArray(msgs)) {
              console.log(`[ADMIN] ⚠️ API did not return an array. Response type:`);
            }
            
            // Don't immediately overwrite messages - we'll merge them below
            const backendMessages = Array.isArray(msgs) ? msgs : [];
            
            // Also check localStorage for any additional messages
            try {
              const threads = JSON.parse(localStorage.getItem(STORAGE_THREADS_KEY) || '{}');
              const localMessages = threads[selectedUser] || [];
              
              setMessages(currentMessages => {
                
                // Start with backend messages
                const allMessages = [...backendMessages];
                
                // Add localStorage messages that aren't duplicates
                localMessages.forEach(localMsg => {
                  const isDuplicate = allMessages.some(msg => {
                    // Check by ID first if available
                    if (msg.id && localMsg.id && msg.id === localMsg.id) {
                      return true;
                    }
                    // Fallback to content + sender + time comparison
                    return msg.message === localMsg.message && 
                           msg.senderEmail === localMsg.senderEmail &&
                           Math.abs(new Date(msg.timestamp || msg.createdAt) - new Date(localMsg.timestamp || localMsg.createdAt)) < 1000;
                  });
                  if (!isDuplicate) {
                    allMessages.push(localMsg);
                  }
                });
                
                // Add current state messages that aren't duplicates (recent socket messages)
                currentMessages.forEach(currentMsg => {
                  // Only include messages for this conversation
                  const isFromUser = currentMsg.senderEmail === selectedUser && 
                    (currentMsg.receiverEmail === senderEmail || 
                     currentMsg.receiverEmail === null || 
                     currentMsg.receiverEmail === undefined || 
                     currentMsg.receiverEmail === 'admin' || 
                     currentMsg.receiverEmail === 'admin@killswitch.com');
                  
                  const isToUser = currentMsg.senderEmail === senderEmail && currentMsg.receiverEmail === selectedUser;
                  const isRelevant = isFromUser || isToUser;
                  
                  if (isRelevant) {
                    const isDuplicate = allMessages.some(msg => {
                      // Check by ID first if available
                      if (msg.id && currentMsg.id && msg.id === currentMsg.id) {
                        return true;
                      }
                      // Fallback to content + sender + time comparison
                      return msg.message === currentMsg.message && 
                             msg.senderEmail === currentMsg.senderEmail &&
                             Math.abs(new Date(msg.timestamp || msg.createdAt) - new Date(currentMsg.timestamp || currentMsg.createdAt)) < 1000;
                    });
                    if (!isDuplicate) {
                      allMessages.push(currentMsg);
                    }
                  }
                });
                
                // Sort by timestamp
                allMessages.sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));
                
                // Update localStorage with merged messages
                try {
                  const threads = JSON.parse(localStorage.getItem(STORAGE_THREADS_KEY) || '{}');
                  threads[selectedUser] = allMessages;
                  localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(threads));
                } catch (storageError) {
                  console.error('[ADMIN] Error updating localStorage:', storageError);
                }
                
                return allMessages;
              });
            } catch (storageError) {
              console.error('[ADMIN] Error handling localStorage messages:', storageError);
            }
          }
        } catch (e) {
          console.error('[ADMIN] Failed to load messages:', e);
          
          // Fallback: Use current state messages + localStorage
          setMessages(currentMessages => {
            
            try {
              const threads = JSON.parse(localStorage.getItem(STORAGE_THREADS_KEY) || '{}');
              const localMessages = threads[selectedUser] || [];
              
              // Merge current state messages with localStorage messages
              const allMessages = [...currentMessages];
              
              localMessages.forEach(localMsg => {
                const isDuplicate = allMessages.some(msg => 
                  msg.message === localMsg.message && 
                  msg.senderEmail === localMsg.senderEmail && 
                  msg.timestamp === localMsg.timestamp
                );
                if (!isDuplicate) {
                  allMessages.push(localMsg);
                }
              });
              
              // Filter for this conversation only
              const conversationMessages = allMessages.filter(msg => {
                const isFromUser = msg.senderEmail === selectedUser && 
                  (msg.receiverEmail === senderEmail || 
                   msg.receiverEmail === null || 
                   msg.receiverEmail === undefined || 
                   msg.receiverEmail === 'admin' || 
                   msg.receiverEmail === 'admin@killswitch.com');
                
                const isToUser = msg.senderEmail === senderEmail && msg.receiverEmail === selectedUser;
                return isFromUser || isToUser;
              });
              
              // Sort by timestamp
              conversationMessages.sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));
              
              
              return conversationMessages;
            } catch (fallbackError) {
              console.error('[ADMIN] Fallback failed:', fallbackError);
              // Return current messages filtered for this conversation
              return currentMessages.filter(msg => {
                const isFromUser = msg.senderEmail === selectedUser && 
                  (msg.receiverEmail === senderEmail || 
                   msg.receiverEmail === null || 
                   msg.receiverEmail === undefined || 
                   msg.receiverEmail === 'admin' || 
                   msg.receiverEmail === 'admin@killswitch.com');
                
                const isToUser = msg.senderEmail === senderEmail && msg.receiverEmail === selectedUser;
                return isFromUser || isToUser;
              });
            }
          });
        }
      })();
    }
  }, [selectedUser]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim() && socket && isConnected && selectedUser) {
      const messageData = {
        senderEmail: senderEmail,
        receiverEmail: selectedUser,
        message: message,
        timestamp: new Date().toISOString(),
      };

      socket.emit("sendMessage", messageData);

      setMessages((prevMessages) => {
        // Check for duplicates before adding
        const isDuplicate = prevMessages.some(msg => 
          msg.message === messageData.message && 
          msg.senderEmail === messageData.senderEmail && 
          msg.timestamp === messageData.timestamp
        );
        
        if (!isDuplicate) {
          return [...prevMessages, messageData];
        }
        return prevMessages;
      });

      // Persist to localStorage
      try {
        const threads = JSON.parse(localStorage.getItem(STORAGE_THREADS_KEY) || '{}');
        const userThread = Array.isArray(threads[selectedUser]) ? threads[selectedUser] : [];
        
        // Check for duplicates in persisted threads too
        const isDuplicateInThread = userThread.some(msg => 
          msg.message === messageData.message && 
          msg.senderEmail === messageData.senderEmail && 
          msg.timestamp === messageData.timestamp
        );
        
        if (!isDuplicateInThread) {
          threads[selectedUser] = [...userThread, messageData];
          localStorage.setItem(STORAGE_THREADS_KEY, JSON.stringify(threads));
        }
      } catch (e2) {
        console.error('[ADMIN] Failed to persist sent message:', e2);
      }

      // Clear input
      setMessage("");
    } else {
      console.log(`[ADMIN] Cannot send message:`);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const selectUser = (email) => {
    
    // Force load messages from localStorage immediately
    try {
      const threads = JSON.parse(localStorage.getItem(STORAGE_THREADS_KEY) || '{}');
      const userMessages = threads[email] || [];
      
      if (userMessages.length > 0) {
        // Set messages immediately from localStorage
        setMessages(userMessages);
      }
    } catch (error) {
      console.error('[ADMIN] Error force loading messages:', error);
    }
    
    setSelectedUser(email);

    // Set last seen timestamp for this conversation
    setLastSeenTimestamp(email);

    // Mark user's messages as read
    setActiveUsers((prevUsers) => {
      const updated = prevUsers.map((user) =>
        user.email === email ? { ...user, unread: false } : user
      );
      try { localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(updated)); } catch (_) {}
      return updated;
    });
  };

  const retryConnection = () => {
    setConnectionError(null);
    setRetryCount((prev) => prev + 1);
  };

  // Get messages for the selected user - try multiple sources
  const getConversationMessages = () => {
    if (!selectedUser || !senderEmail) return [];
    
    // 1. Try to get from current messages state
    const stateMessages = messages.filter(
      (msg) => {
        // Messages FROM user TO admin (receiverEmail can be null, "admin", or specific admin email)
        const isFromUser = msg.senderEmail === selectedUser && 
          (msg.receiverEmail === senderEmail || 
           msg.receiverEmail === null || 
           msg.receiverEmail === undefined || 
           msg.receiverEmail === 'admin' || 
           msg.receiverEmail === 'admin@killswitch.com');
        
        // Messages FROM admin TO user
        const isToUser = msg.senderEmail === senderEmail && msg.receiverEmail === selectedUser;
        
        return isFromUser || isToUser;
      }
    );
    
    // 2. Also try to get from localStorage as backup
    try {
      const threads = JSON.parse(localStorage.getItem(STORAGE_THREADS_KEY) || '{}');
      const localMessages = threads[selectedUser] || [];
      
      // Merge state messages with localStorage messages
      const allMessages = [...stateMessages];
      
      localMessages.forEach(localMsg => {
        const isDuplicate = allMessages.some(msg => {
          // Enhanced duplicate detection using multiple criteria
          if (msg.id && localMsg.id) {
            return msg.id === localMsg.id;
          }
          
          // Fallback to strict content matching
          return (
            msg.message === localMsg.message && 
            msg.senderEmail === localMsg.senderEmail && 
            msg.timestamp === localMsg.timestamp &&
            msg.receiverEmail === localMsg.receiverEmail
          );
        });
        
        if (!isDuplicate) {
          // Add unique ID if not present
          const messageWithId = {
            ...localMsg,
            id: localMsg.id || `local_${localMsg.senderEmail}_${localMsg.timestamp}_${Date.now()}`
          };
          allMessages.push(messageWithId);
        }
      });
      
      // Sort by timestamp
      allMessages.sort((a, b) => new Date(a.timestamp || a.createdAt) - new Date(b.timestamp || b.createdAt));
      
      return allMessages;
    } catch (error) {
      console.error('[ADMIN] Error getting conversation messages:', error);
      return stateMessages;
    }
  };
  
  const filteredMessages = getConversationMessages();

  // Debug logging for message filtering
  useEffect(() => {
    if (selectedUser) {
      
      if (messages.length > 0) {
        messages.forEach((msg, index) => {
          const isFromUser = msg.senderEmail === selectedUser && 
            (msg.receiverEmail === senderEmail || 
             msg.receiverEmail === null || 
             msg.receiverEmail === undefined || 
             msg.receiverEmail === 'admin' || 
             msg.receiverEmail === 'admin@killswitch.com');
          
          const isToUser = msg.senderEmail === senderEmail && msg.receiverEmail === selectedUser;
          const included = isFromUser || isToUser;
          
        });
      }
      
      if (filteredMessages.length === 0 && messages.length > 0) {
        console.log(`[ADMIN] ⚠️ WARNING: No messages are being filtered for this conversation!`);
        console.log(`[ADMIN] This suggests a filtering logic issue.`);
      }
    }
  }, [messages, selectedUser, senderEmail, filteredMessages.length]);

  return (
    <>
      {/* Enhanced KillSwitch-themed notification popup */}
      {showNotification && lastNotificationMessage && (
        <motion.div
          initial={{ opacity: 0, x: 300, scale: 0.8, rotateY: 15 }}
          animate={{ opacity: 1, x: 0, scale: 1, rotateY: 0 }}
          exit={{ opacity: 0, x: 300, scale: 0.8, rotateY: -15 }}
          onClick={handleNotificationClick}
          className="fixed top-4 right-4 z-[60] rounded-2xl p-4 shadow-2xl max-w-sm cursor-pointer transition-all duration-300 hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #1c1816 0%, #2a2520 100%)',
            border: '1px solid rgba(199, 0, 7, 0.3)',
            boxShadow: '0 20px 40px rgba(199, 0, 7, 0.1), 0 0 0 1px rgba(199, 0, 7, 0.1)'
          }}
        >
          {/* Animated border effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'linear-gradient(45deg, #c70007, #ff4444, #c70007)',
              opacity: 0.1
            }}
            animate={{
              background: [
                'linear-gradient(45deg, #c70007, #ff4444, #c70007)',
                'linear-gradient(45deg, #ff4444, #c70007, #ff4444)',
                'linear-gradient(45deg, #c70007, #ff4444, #c70007)'
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <div className="relative z-10 flex items-start gap-3">
            <motion.div 
              className="p-2 rounded-full flex items-center justify-center"
              style={{backgroundColor: '#c70007'}}
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2 }}
            >
              <MessageSquare className="w-4 h-4 text-white" />
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <motion.p 
                className="text-white font-bold text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                {lastNotificationMessage.isSummary ? '📬 Offline Messages' : 
                 lastNotificationMessage.isOfflineMessage ? '💬 Offline Message' : '🔔 New Message'}
              </motion.p>
              
              <motion.p 
                className="text-gray-300 text-xs truncate mt-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {lastNotificationMessage.isSummary ? 
                  `${lastNotificationMessage.userCount} user${lastNotificationMessage.userCount > 1 ? 's' : ''}` : 
                  `From: ${lastNotificationMessage.senderEmail}`}
              </motion.p>
              
              <motion.p 
                className="text-gray-400 text-xs mt-1 line-clamp-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                {lastNotificationMessage.message}
              </motion.p>
              
              <motion.div
                className="mt-2 flex items-center gap-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="w-2 h-2 rounded-full" style={{backgroundColor: '#c70007'}} />
                <p className="text-xs font-medium" style={{color: '#c70007'}}>
                  {lastNotificationMessage.isSummary ? 'Click to view conversations →' : 'Click to open conversation →'}
                </p>
              </motion.div>
            </div>
            
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotification(false);
              }}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>
      )}

      <div className="fixed bottom-4 right-4 z-50">
      {/* Enhanced KillSwitch-themed chat toggle button */}
      <motion.button
        onClick={toggleChat}
        className="relative overflow-hidden rounded-2xl p-4 text-white transition-all duration-300 flex items-center justify-center gap-2"
        style={{
          background: 'linear-gradient(135deg, #1c1816 0%, #2a2520 100%)',
          border: '1px solid rgba(199, 0, 7, 0.3)',
          boxShadow: '0 8px 32px rgba(199, 0, 7, 0.2)'
        }}
        whileHover={{ 
          scale: 1.05,
          boxShadow: '0 12px 40px rgba(199, 0, 7, 0.3)'
        }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Animated background effect */}
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(45deg, #c70007, #ff4444, #c70007)',
            opacity: 0
          }}
          whileHover={{ opacity: 0.1 }}
          transition={{ duration: 0.3 }}
        />
        
        {/* Icon */}
        <div className="relative z-10">
          {isOpen ? (
            <motion.div
              animate={{ rotate: [0, 90, 0] }}
              transition={{ duration: 0.3 }}
            >
              <X className="w-6 h-6" style={{color: '#c70007'}} />
            </motion.div>
          ) : (
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <MessageSquare className="w-6 h-6" style={{color: '#c70007'}} />
            </motion.div>
          )}
        </div>
        
        {/* Enhanced notification badge */}
        {totalUnreadCount > 0 && !isOpen && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: [0, 1.2, 1],
              rotate: [0, 360]
            }}
            className="absolute -top-2 -right-2 text-white text-xs font-bold rounded-full w-7 h-7 flex items-center justify-center border-2"
            style={{
              background: 'linear-gradient(135deg, #c70007, #ff4444)',
              borderColor: '#000000',
              boxShadow: '0 4px 12px rgba(199, 0, 7, 0.4)'
            }}
          >
            <motion.span
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </motion.span>
          </motion.div>
        )}
        
        {/* Pulse effect for unread messages */}
        {totalUnreadCount > 0 && !isOpen && (
          <motion.div
            className="absolute -top-2 -right-2 w-7 h-7 rounded-full"
            style={{backgroundColor: '#c70007'}}
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.7, 0, 0.7]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.button>

      {/* Enhanced KillSwitch-themed chat window */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95, rotateX: -10 }}
          animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
          exit={{ opacity: 0, y: 20, scale: 0.95, rotateX: 10 }}
          transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
          className="absolute bottom-16 right-0 w-80 sm:w-96 rounded-2xl overflow-hidden shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #1c1816 0%, #2a2520 100%)',
            border: '1px solid rgba(199, 0, 7, 0.3)',
            boxShadow: '0 20px 60px rgba(199, 0, 7, 0.2), 0 0 0 1px rgba(199, 0, 7, 0.1)'
          }}
        >
          {/* Enhanced KillSwitch-themed chat header */}
          <div className="relative z-10 p-4 border-b border-gray-500/30" style={{backgroundColor: '#1c1816'}}>
            {/* Animated header background */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, rgba(199, 0, 7, 0.05) 0%, transparent 50%, rgba(199, 0, 7, 0.05) 100%)'
              }}
              animate={{
                background: [
                  'linear-gradient(90deg, rgba(199, 0, 7, 0.05) 0%, transparent 50%, rgba(199, 0, 7, 0.05) 100%)',
                  'linear-gradient(90deg, transparent 0%, rgba(199, 0, 7, 0.1) 50%, transparent 100%)',
                  'linear-gradient(90deg, rgba(199, 0, 7, 0.05) 0%, transparent 50%, rgba(199, 0, 7, 0.05) 100%)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            <div className="relative z-10 flex items-center gap-3">
              <motion.div 
                className="p-2 rounded-full flex items-center justify-center"
                style={{backgroundColor: '#c70007'}}
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 4 }}
              >
                {selectedUser ? (
                  <MessageSquare className="w-5 h-5 text-white" />
                ) : (
                  <Users className="w-5 h-5 text-white" />
                )}
              </motion.div>
              
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">
                  {selectedUser ? `Chat with ${selectedUser}` : "Admin Chat Center"}
                </h3>
                <div className="flex items-center gap-2">
                  {isConnected ? (
                    <>
                      <motion.span 
                        className="w-2 h-2 rounded-full inline-block"
                        style={{backgroundColor: '#10b981'}}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                      />
                      <span className="text-green-400 text-xs font-medium">
                        Connected as {senderEmail}
                      </span>
                    </>
                  ) : (
                    <>
                      <motion.span 
                        className="w-2 h-2 rounded-full inline-block"
                        style={{backgroundColor: '#ef4444'}}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      />
                      <span className="text-red-400 text-xs font-medium">
                        Disconnected
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <motion.button
                onClick={toggleChat}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-5 h-5 text-gray-400" />
              </motion.button>
            </div>
          </div>

          {/* Enhanced connection status */}
          {!isConnected && (
            <motion.div 
              className="relative z-10 p-3 border-b border-gray-500/30"
              style={{backgroundColor: 'rgba(239, 68, 68, 0.1)'}}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <div className="flex items-center gap-2 mb-2">
                <motion.div
                  className="w-2 h-2 rounded-full"
                  style={{backgroundColor: '#ef4444'}}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                <p className="text-xs text-red-400 font-medium">Connection Lost</p>
              </div>
              <p className="text-xs text-gray-300 mb-2">
                {connectionError || `Attempting to reconnect... Socket ID: ${socket?.id || "Not connected"}`}
              </p>
              <motion.button
                onClick={retryConnection}
                className="text-xs px-3 py-1 rounded-lg mx-auto block transition-colors"
                style={{
                  backgroundColor: 'rgba(199, 0, 7, 0.2)',
                  border: '1px solid rgba(199, 0, 7, 0.3)',
                  color: '#c70007'
                }}
                whileHover={{ 
                  backgroundColor: 'rgba(199, 0, 7, 0.3)',
                  scale: 1.05
                }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="w-3 h-3 inline mr-1" /> Retry Connection
              </motion.button>
            </motion.div>
          )}
          {/* Enhanced user list or messages container */}
          <div className="relative z-10 h-96 overflow-y-auto p-4 text-white" style={{backgroundColor: '#000000'}}>
            {!selectedUser ? (
              // Enhanced user list view
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5" style={{color: '#c70007'}} />
                  <h4 className="text-sm font-bold text-white">
                    Active Conversations
                  </h4>
                  <div className="ml-auto px-2 py-1 rounded-full text-xs font-medium" style={{backgroundColor: 'rgba(199, 0, 7, 0.2)', color: '#c70007'}}>
                    {activeUsers.length}
                  </div>
                </div>
                
                {activeUsers.length === 0 ? (
                  <motion.div 
                    className="h-64 flex flex-col items-center justify-center text-center text-gray-400"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <Users className="w-12 h-12 text-gray-600 mb-3" />
                    </motion.div>
                    <p className="text-lg font-medium mb-2">No Active Conversations</p>
                    <p className="text-xs text-gray-500">
                      Users will appear here when they message you
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    {activeUsers.map((user, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => selectUser(user.email)}
                        className="p-3 rounded-xl border border-gray-500/30 hover:border-[#c70007]/50 cursor-pointer transition-all duration-300 flex items-center justify-between group"
                        style={{backgroundColor: '#1c1816'}}
                        whileHover={{ 
                          scale: 1.02,
                          boxShadow: '0 8px 25px rgba(199, 0, 7, 0.1)'
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <motion.div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold`}
                            style={{
                              backgroundColor: user.email.startsWith('guest_') ? 'rgba(251, 146, 60, 0.8)' : '#c70007'
                            }}
                            whileHover={{ scale: 1.1 }}
                          >
                            {user.email.startsWith('guest_') ? '👤' : user.email.charAt(0).toUpperCase()}
                          </motion.div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {user.email.startsWith('guest_') ? `Guest User` : user.email}
                            </p>
                            {user.email.startsWith('guest_') && (
                              <p className="text-xs text-gray-400">{user.email}</p>
                            )}
                          </div>
                        </div>
                        {user.unread && (
                          <motion.div
                            className="relative"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                          >
                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: '#c70007'}} />
                            <motion.div
                              className="absolute inset-0 w-3 h-3 rounded-full"
                              style={{backgroundColor: '#c70007'}}
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.7, 0, 0.7]
                              }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                            />
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              // Enhanced messages view for selected user
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={() => setSelectedUser(null)}
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                      whileHover={{ scale: 1.1, rotate: -5 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </motion.button>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        Conversation with {selectedUser?.startsWith('guest_') ? 'Guest User' : selectedUser}
                      </h4>
                      {selectedUser?.startsWith('guest_') && (
                        <p className="text-xs text-gray-400">{selectedUser}</p>
                      )}
                    </div>
                  </div>
                  <motion.button
                    onClick={() => {
                      setSelectedUser(null);
                      setTimeout(() => setSelectedUser(selectedUser), 100);
                    }}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    title="Refresh conversation"
                    whileHover={{ scale: 1.1, rotate: 180 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                  </motion.button>
                </div>


                {filteredMessages.length === 0 ? (
                  <motion.div 
                    className="h-64 flex flex-col items-center justify-center text-center text-gray-400"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                    >
                      <MessageSquare className="w-12 h-12 text-gray-600 mb-3" />
                    </motion.div>
                    <p className="text-lg font-medium mb-2">No Messages Yet</p>
                    <p className="text-xs text-gray-500 mb-4">
                      Send a message to start the conversation
                    </p>
                    <motion.button
                      onClick={() => {
                        try {
                          const threads = JSON.parse(localStorage.getItem(STORAGE_THREADS_KEY) || '{}');
                          const userMessages = threads[selectedUser] || [];
                          if (userMessages.length > 0) {
                            setMessages(userMessages);
                          }
                        } catch (e) {
                          console.error('[ADMIN] Force refresh error:', e);
                        }
                      }}
                      className="px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: 'rgba(199, 0, 7, 0.2)',
                        border: '1px solid rgba(199, 0, 7, 0.3)',
                        color: '#c70007'
                      }}
                      whileHover={{ 
                        backgroundColor: 'rgba(199, 0, 7, 0.3)',
                        scale: 1.05
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🔄 Force Refresh
                    </motion.button>
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    {filteredMessages.map((msg, index) => {
                      const isAdmin = msg.senderEmail === senderEmail;
                      const messageDate = msg.timestamp ? new Date(msg.timestamp) : new Date();
                      const showDateSeparator = index === 0 || 
                        (filteredMessages[index - 1] && 
                         new Date(filteredMessages[index - 1].timestamp || 0).toDateString() !== messageDate.toDateString());
                      
                      return (
                        <div key={msg.id || index}>
                          {/* Date Separator */}
                          {showDateSeparator && (
                            <div className="flex items-center justify-center my-4">
                              <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-gray-500/30"></div>
                                <span className="text-xs text-gray-500 px-2">
                                  {messageDate.toLocaleDateString('en-US', { 
                                    weekday: 'long', 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                  })}
                                </span>
                                <div className="h-px flex-1 bg-gray-500/30"></div>
                              </div>
                            </div>
                          )}
                          
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.03 }}
                            className={`flex items-end gap-2 ${
                              isAdmin ? "flex-row-reverse" : "flex-row"
                            }`}
                          >
                            {/* Avatar */}
                            <div 
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                                isAdmin ? 'order-2' : 'order-1'
                              }`}
                              style={{
                                backgroundColor: isAdmin ? '#c70007' : 'rgba(199, 0, 7, 0.6)'
                              }}
                            >
                              {isAdmin ? 'A' : (msg.senderEmail?.charAt(0).toUpperCase() || 'U')}
                            </div>
                            
                            {/* Message Container */}
                            <div 
                              className={`flex flex-col max-w-[75%] ${
                                isAdmin ? "items-end" : "items-start"
                              }`}
                            >
                              {/* Sender Name */}
                              <span className={`text-xs font-medium mb-1 px-1 ${
                                isAdmin ? "text-[#c70007]" : "text-gray-400"
                              }`}>
                                {isAdmin ? "You" : (msg.senderEmail?.startsWith('guest_') ? "Guest User" : msg.senderEmail?.split('@')[0] || "User")}
                              </span>
                              
                              {/* Message Bubble */}
                              <div
                                className={`p-3 rounded-2xl shadow-sm ${
                                  isAdmin
                                    ? "rounded-br-sm bg-gradient-to-br from-[#c70007]/30 to-[#c70007]/20 border border-[#c70007]/40"
                                    : "rounded-bl-sm bg-[#1c1816] border border-gray-500/30"
                                }`}
                              >
                                <p className={`text-sm leading-relaxed break-words ${
                                  isAdmin ? "text-white" : "text-gray-200"
                                }`}>
                                  {msg.message}
                                </p>
                              </div>
                              
                              {/* Timestamp */}
                              <span className={`text-xs text-gray-500 mt-1 px-1 ${
                                isAdmin ? "text-right" : "text-left"
                              }`}>
                                {messageDate.toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit',
                                  hour12: true 
                                })}
                              </span>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Enhanced KillSwitch-themed message input */}
          {selectedUser && (
            <div className="relative z-10 p-4 border-t border-gray-500/30" style={{backgroundColor: '#1c1816'}}>
              <form
                onSubmit={handleSendMessage}
                className="flex items-center gap-3"
              >
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full bg-black border border-gray-500/30 text-white rounded-xl px-4 py-3 outline-none transition-all duration-300 focus:border-[#c70007] focus:ring-2 focus:ring-[#c70007]/20"
                    style={{backgroundColor: '#000000'}}
                    disabled={!isConnected}
                  />
                  {!isConnected && (
                    <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                      <span className="text-xs text-gray-400">Disconnected</span>
                    </div>
                  )}
                </div>
                
                <motion.button
                  type="submit"
                  disabled={!isConnected || !message.trim()}
                  className="p-3 rounded-xl text-white transition-all duration-300 flex items-center justify-center overflow-hidden relative disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: message.trim() && isConnected ? '#c70007' : 'rgba(199, 0, 7, 0.3)',
                    border: '1px solid rgba(199, 0, 7, 0.5)'
                  }}
                  whileHover={{ 
                    scale: message.trim() && isConnected ? 1.05 : 1,
                    boxShadow: message.trim() && isConnected ? '0 8px 25px rgba(199, 0, 7, 0.3)' : 'none'
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="w-5 h-5 text-white" />
                  
                  {/* Animated send effect */}
                  {message.trim() && isConnected && (
                    <motion.div
                      className="absolute inset-0 rounded-xl"
                      style={{
                        background: 'linear-gradient(45deg, #c70007, #ff4444, #c70007)',
                        opacity: 0
                      }}
                      whileHover={{ opacity: 0.2 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                </motion.button>
              </form>
            </div>
          )}
        </motion.div>
      )}
      </div>
    </>
  );
}
