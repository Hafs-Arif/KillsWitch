"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import {
  Send,
  X,
  MessageSquare,
  RefreshCw,
  MessageCircle,
  HeadphonesIcon,
  Minimize2,
  Bot,
  User,
  Settings,
} from "lucide-react";
import ChatbotComponent from "./ChatbotComponent";
import { BASE_URL, API, chatbotAPI } from "../../api/api";

export default function UserChat() {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const messagesEndRef = useRef(null);
  const [senderEmail, setSenderEmailState] = useState("");
  
  // Helper function to always get email as string
  const getSafeEmail = (email) => {
    if (typeof email === 'object' && email?.email) {
      return email.email;
    }
    return email || "";
  };
  
  // Custom setter that ensures we never set an object
  const setSenderEmail = (value) => {
    const safeValue = getSafeEmail(value);
    setSenderEmailState(safeValue);
  };
  const [receiverEmail, setReceiverEmail] = useState(null); // No hardcoded admin email
  const [retryCount, setRetryCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isGuest, setIsGuest] = useState(false);
  
  // UserChat with mode switching between admin and AI
  const [sessionId, setSessionId] = useState("");
  const [chatMode, setChatMode] = useState("admin"); // "admin" or "ai"
  const [isTyping, setIsTyping] = useState(false);
  const [chatbotWelcomed, setChatbotWelcomed] = useState(false);

  // Function to decode JWT token
  const decodeJWT = (token) => {
    try {
      if (!token) {
        return null;
      }

      const parts = token.split(".");
      if (parts.length !== 3) {
        return null;
      }

      const payload = parts[1];
      const decodedPayload = JSON.parse(
        atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
      );
      return decodedPayload;
    } catch (error) {
      console.error("[USER] Error decoding JWT:", error);
      return null;
    }
  };

  // Generate unique guest user identifier
  const generateGuestId = () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const guestId = `guest_${timestamp}_${randomStr}`;
    return guestId;
  };

  // Extract email from profile or generate guest ID
  const getEmailFromToken = async () => {
    try {
      const profile = await API.auth.getProfile();
      const email = profile?.user?.email || profile?.email;
      
      if (email) {
        return { email, isGuest: false };
      }
      
      console.warn("[USER] No email found in profile, checking for stored guest ID");
      
      // Check if we have a stored guest ID first
      const storedGuestId = localStorage.getItem('killswitch_guest_id');
      if (storedGuestId) {
        return { email: storedGuestId, isGuest: true };
      }
      
      // Generate new guest ID only if none exists
      const guestId = generateGuestId();
      
      // Store guest ID in localStorage for session persistence
      localStorage.setItem('killswitch_guest_id', guestId);
      
      return { email: guestId, isGuest: true };
    } catch (error) {
      console.error("[USER] Error getting email from profile:", error);
      
      // Check if we have a stored guest ID
      const storedGuestId = localStorage.getItem('killswitch_guest_id');
      if (storedGuestId) {
        return { email: storedGuestId, isGuest: true };
      }
      
      // Generate new guest ID
      const guestId = generateGuestId();
      localStorage.setItem('killswitch_guest_id', guestId);
      return { email: guestId, isGuest: true };
    }
  };

  // Generate session ID and cleanup old messages
  useEffect(() => {
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    // Remove old localStorage keys that might cause conflicts (but NOT chatbot keys)
    localStorage.removeItem('userChatMessages');
    localStorage.removeItem('enhancedUserChatMessages');
    // NOTE: We deliberately do NOT remove 'killswitch_chatbot_messages' to preserve chatbot data
    
    // Cleanup old messages from localStorage on component mount
    cleanupOldMessages();
  }, []);

  // Cleanup old messages from localStorage (2 days retention to match backend)
  const cleanupOldMessages = () => {
    try {
      const RETENTION_HOURS = 48; // 2 days (matches backend retention)
      const cutoffTime = Date.now() - (RETENTION_HOURS * 60 * 60 * 1000);
      
      // Clean up stored messages
      const storedMessages = localStorage.getItem('killswitch_user_admin_messages');
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        const recentMessages = parsedMessages.filter(msg => {
          const messageTime = new Date(msg.timestamp).getTime();
          return messageTime > cutoffTime;
        });
        
        if (recentMessages.length !== parsedMessages.length) {
          localStorage.setItem('killswitch_user_admin_messages', JSON.stringify(recentMessages));
        }
      }
    } catch (error) {
      console.error('[USER] Error cleaning up old messages:', error);
    }
  };

  // Debug function to check localStorage
  const debugLocalStorage = () => {
    const adminKey = 'killswitch_user_admin_messages';
    const aiKey = 'killswitch_chatbot_messages';
    
    const adminMessages = localStorage.getItem(adminKey);
    const aiMessages = localStorage.getItem(aiKey);
    
    if (adminMessages) {
      try {
        const parsed = JSON.parse(adminMessages);
      } catch (e) {
        console.error('[USER] Error parsing admin messages:', e);
      }
    }
    
    if (aiMessages) {
      try {
        const parsed = JSON.parse(aiMessages);
      } catch (e) {
        console.error('[USER] Error parsing AI messages:', e);
      }
    }
  };

  // Fix guest ID mismatch in stored messages
  const fixGuestIdMismatch = () => {
    try {
      const currentGuestId = getSafeEmail(senderEmail);
      if (!currentGuestId || !currentGuestId.startsWith('guest_')) {
        return;
      }

      const storageKey = 'killswitch_user_admin_messages';
      const storedMessages = localStorage.getItem(storageKey);
      
      if (!storedMessages) {
        return;
      }

      const parsedMessages = JSON.parse(storedMessages);
      let fixedCount = 0;
      
      const fixedMessages = parsedMessages.map(msg => {
        if (msg.senderEmail && msg.senderEmail.startsWith('guest_') && msg.senderEmail !== currentGuestId) {
          fixedCount++;
          return { ...msg, senderEmail: currentGuestId };
        }
        return msg;
      });

      if (fixedCount > 0) {
        localStorage.setItem(storageKey, JSON.stringify(fixedMessages));
        
        // Update current messages state
        setMessages(fixedMessages);
      } else {
        console.log('[USER] No guest ID mismatches found');
      }
    } catch (error) {
      console.error('[USER] Error fixing guest ID mismatch:', error);
    }
  };

  // Make debug function available globally for testing
  if (typeof window !== 'undefined') {
    window.debugUserChatStorage = debugLocalStorage;
    window.debugUserChatMessages = () => {
      debugLocalStorage();
    };
    window.fixUserChatGuestId = fixGuestIdMismatch;
  }

  // Load persisted messages from localStorage based on mode
  const loadPersistedMessages = () => {
    debugLocalStorage(); // Debug what's in localStorage
    
    try {
      const storageKey = chatMode === 'ai' ? 'killswitch_chatbot_messages' : 'killswitch_user_admin_messages';
      const storedMessages = localStorage.getItem(storageKey);
      
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        
        // Normalize messages to ensure they are strings
        const normalizedMessages = parsedMessages.map(msg => ({
          ...msg,
          message: typeof msg.message === 'object' && msg.message.text ? msg.message.text : (typeof msg.message === 'string' ? msg.message : ''),
          buttons: Array.isArray(msg.buttons) ? msg.buttons : []
        }));
        
        // Safety check: only update if we have messages or current state is empty
        if (normalizedMessages.length > 0 || messages.length === 0) {
          setMessages(normalizedMessages);
        } else {
          console.log(`[USER] Keeping current messages, not overwriting with empty storage`);
        }
        return normalizedMessages.length;
      } else {
        console.log(`[USER] Keeping current messages in state`);
        return 0;
      }
    } catch (error) {
      console.error('[USER] Error loading persisted messages:', error);
      return 0;
    }
  };

  // Switch between admin and AI modes
  const switchChatMode = (newMode) => {
    setChatMode(newMode);
    
    // Load messages for the new mode
    const storageKey = newMode === 'ai' ? 'killswitch_chatbot_messages' : 'killswitch_user_admin_messages';
    try {
      const storedMessages = localStorage.getItem(storageKey);
      if (storedMessages) {
        const parsedMessages = JSON.parse(storedMessages);
        setMessages(parsedMessages);
      } else {
        setMessages([]);
        // Show welcome message for AI mode
        if (newMode === 'ai' && senderEmail && !chatbotWelcomed) {
          setTimeout(() => getChatbotWelcome(), 500);
        }
      }
    } catch (error) {
      console.error('[USER] Error loading messages for new mode:', error);
      setMessages([]);
    }
  };

  // Chatbot functions for AI mode
  const sendChatbotMessage = async (userMessage) => {
    try {
      setIsTyping(true);
      const data = await chatbotAPI.sendMessage(userMessage, sessionId, senderEmail);
      
      if (data.success) {
        const botMessage = {
          senderEmail: "KillSwitch AI", 
          receiverEmail: senderEmail,
          message: data.message,
          timestamp: new Date().toISOString(),
          type: 'chatbot'
        };
        
        setMessages(prev => {
          const newMessages = [...prev, botMessage];
          // Persist to localStorage based on mode
          try {
            const storageKey = chatMode === 'ai' ? 'killswitch_chatbot_messages' : 'killswitch_user_admin_messages';
            localStorage.setItem(storageKey, JSON.stringify(newMessages));
          } catch (e) {
            console.error('[USER] Failed to persist messages:', e);
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error sending chatbot message:', error);
      const errorMessage = {
        senderEmail: "KillSwitch AI",
        receiverEmail: senderEmail,
        message: "I apologize, but I'm experiencing technical difficulties. Please try again later.",
        timestamp: new Date().toISOString(),
        type: 'chatbot'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const getChatbotWelcome = async () => {
    try {
      const data = await chatbotAPI.getWelcome();
      if (data.success) {
        const welcomeMessage = {
          senderEmail: "KillSwitch AI",
          receiverEmail: senderEmail,
          message: data.message,
          timestamp: new Date().toISOString(),
          type: 'chatbot'
        };
        setMessages([welcomeMessage]);
        setChatbotWelcomed(true);
        // Persist welcome message
        try {
          localStorage.setItem('killswitch_chatbot_messages', JSON.stringify([welcomeMessage]));
        } catch (e) {
          console.error('[USER] Failed to persist welcome message:', e);
        }
      }
    } catch (error) {
      console.error('Error getting chatbot welcome:', error);
      // Fallback welcome
      const fallbackMessage = {
        senderEmail: "KillSwitch AI",
        receiverEmail: senderEmail,
        message: "Welcome to KillSwitch! 🎮 I'm your AI assistant here to help you find the perfect gaming hardware. How can I assist you today?",
        timestamp: new Date().toISOString(),
        type: 'chatbot'
      };
      setMessages([fallbackMessage]);
      setChatbotWelcomed(true);
      try {
        localStorage.setItem('killswitch_chatbot_messages', JSON.stringify([fallbackMessage]));
      } catch (e) {
        console.error('[USER] Failed to persist fallback message:', e);
      }
    }
  };

  // Initialize socket connection
  const initializeSocket = () => {
    try {
      // Ensure senderEmail is always a string
      const safeSenderEmail = typeof senderEmail === 'object' ? senderEmail.email : senderEmail;
      
      if (socket) {
        socket.disconnect();
      }

      // try websocket only to avoid xhr polling errors (CORS or protocol mismatches)
      const socketInstance = io(BASE_URL, {
        transports: ["websocket"],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 30000,
        forceNew: true,
        query: {
          role: "user",
          email: safeSenderEmail,
        },
      });

      setSocket(socketInstance);
      setConnectionError(null);

      socketInstance.on("connect", () => {
        setIsConnected(true);
        setConnectionError(null);

        socketInstance.emit("identify", { 
          userEmail: safeSenderEmail, 
          email: safeSenderEmail, 
          role: 'user',
          isGuest: isGuest
        });

      });

      socketInstance.on("connect_error", (error) => {
        setConnectionError(error?.message ? `Connection error: ${error.message}` : 'Connection error');
        setIsConnected(false);
      });

      socketInstance.on("connect_timeout", (timeout) => {
        console.error(`[USER] Connection timeout after ${timeout}ms`);
        setConnectionError(`Connection timeout after ${timeout}ms`);
        setIsConnected(false);
      });

      socketInstance.on("error", (error) => {
        console.error(`[USER] Socket error:`, error);
        setConnectionError(`Socket error: ${error}`);
      });

      socketInstance.on("disconnect", (reason) => {
        setIsConnected(false);

        if (reason === "io server disconnect" || reason === "transport close") {
          socketInstance.connect();
        }
      });

      socketInstance.on("message", (data) => {

        if (data.receiverEmail === safeSenderEmail && data.senderEmail !== safeSenderEmail) {
  
          setMessages((prevMessages) => {
            // Check for duplicates before adding
            const isDuplicate = prevMessages.some(msg => 
              msg.message === data.message && 
              msg.senderEmail === data.senderEmail && 
              msg.timestamp === data.timestamp
            );
            
            if (!isDuplicate) {
              const newMessages = [...prevMessages, { ...data, type: 'admin' }];

              // Persist to localStorage
              try {
                localStorage.setItem('killswitch_user_admin_messages', JSON.stringify(newMessages));

                // Verify persistence by reading back
                const verification = localStorage.getItem('killswitch_user_admin_messages');
                if (verification) {
                  const verifiedMessages = JSON.parse(verification);
                }
              } catch (e) {
                console.error('[USER] Failed to persist messages to localStorage:', e);
              }
              return newMessages;
            }
            return prevMessages;
          });

          if (!isOpen) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      });

      return socketInstance;
    } catch (error) {
      console.error("[USER] Error initializing socket:", error);
      setConnectionError(`Error initializing socket: ${error.message}`);
      return null;
    }
  };

  useEffect(() => {
    const fetchEmail = async () => {
      try {
        const userInfo = await getEmailFromToken();
        // Ensure we're setting a string value
        const emailString = String(userInfo.email);
        
        setSenderEmail(emailString);
        setIsGuest(userInfo.isGuest);
        
        // Verify the state was set correctly
        setTimeout(() => {
          console.log(`[USER] State verification - senderEmail after setState:`);
        }, 100);
      } catch (error) {
        console.error(`[USER] Error in fetchEmail:`, error);
      }
    };
    
    fetchEmail();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  // Monitor senderEmail changes
  useEffect(() => {
  }, [senderEmail]);

  useEffect(() => {
    if (!senderEmail) {
      console.log(
        `[USER] Sender email not yet available, skipping socket initialization`
      );
      return;
    }    
    // Load persisted messages when user email is available
    const loadedCount = loadPersistedMessages();
    
    // Fix guest ID mismatch if needed
    if (senderEmail && senderEmail.startsWith && senderEmail.startsWith('guest_')) {
      setTimeout(() => {
        fixGuestIdMismatch();
      }, 1000); // Small delay to ensure messages are loaded first
    }
    
    // Initialize socket for admin communication (UserChat is admin-only)
    const socketInstance = initializeSocket();
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [senderEmail, retryCount, isGuest]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (senderEmail) { 
      const storageKey = chatMode === 'ai' ? 'killswitch_chatbot_messages' : 'killswitch_user_admin_messages';
      try {
        const storedMessages = localStorage.getItem(storageKey);
        if (storedMessages) {
          const parsedMessages = JSON.parse(storedMessages);
          setMessages(parsedMessages);
        } else {
          setMessages([]); 
        }
      } catch (error) {
        console.error('[USER] Error loading persisted messages for mode change:', error);
        setMessages([]);
      }
    }
  }, [chatMode, senderEmail]); 

  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const safeSenderEmail = getSafeEmail(senderEmail);
    
    const messageData = {
      senderEmail: safeSenderEmail,
      receiverEmail: chatMode === 'ai' ? 'KillSwitch AI' : null,
      message: message,
      timestamp: new Date().toISOString(),
      type: chatMode === 'ai' ? 'chatbot' : 'admin'
    };
    // Add user message to chat immediately
    setMessages((prevMessages) => {
      const newMessages = [...prevMessages, messageData];
      
      // Persist to localStorage based on mode
      try {
        const storageKey = chatMode === 'ai' ? 'killswitch_chatbot_messages' : 'killswitch_user_admin_messages';
        localStorage.setItem(storageKey, JSON.stringify(newMessages));
        
        // Verify persistence by reading back
        const verification = localStorage.getItem(storageKey);
        if (verification) {
          const verifiedMessages = JSON.parse(verification);
        } else {
          console.error(`[USER] VERIFICATION FAILED: No data found in localStorage for key: ${storageKey}`);
        }
      } catch (e) {
        console.error('[USER] Failed to persist messages to localStorage:', e);
      }
      return newMessages;
    });
    const currentMessage = message;
    setMessage("");

    if (chatMode === 'ai') {
      // Send to AI chatbot
      await sendChatbotMessage(currentMessage);
    } else {
      // Send to admin via socket
      if (socket && isConnected) {
        socket.emit("sendMessage", messageData);
      } else {
        console.log(`[USER] Cannot send message to admin:`);
      }
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const minimizeChat = () => {
    setIsMinimized(!isMinimized);
  };

  const retryConnection = () => {
    setConnectionError(null);
    setRetryCount((prev) => prev + 1);
  };

  // UserChat is ONLY for admin communication - no mode switching needed

  return (
    <>
      {/* Overlay backdrop when chat is open - MOVED OUTSIDE */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm cursor-pointer"
            style={{ 
              zIndex: 9990 // Lower z-index to be behind chat window
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleChat();
            }}
          />
        )}
      </AnimatePresence>

      {/* Chat container with higher z-index */}
      <div className="fixed bottom-6 right-6" style={{ zIndex: 9999 }}>
        <AnimatePresence mode="wait">
          {!isOpen ? (
            <motion.div
              key="chat-button"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              {/* Notification badge */}
              {unreadCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 z-10 shadow-lg"
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </motion.div>
              )}

              {/* Enhanced chat button */}
              <motion.button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleChat();
                }}
                className="group relative overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                type="button"
              >
                <div className="flex items-center gap-3 px-6 py-4 pointer-events-none">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <User className="w-4 h-4" />
                  </motion.div>
                  <span className="font-semibold text-sm">
                    Need Help?
                  </span>
                  <HeadphonesIcon className="w-4 h-4 opacity-80" />
                </div>
                
                {/* Animated gradient overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  initial={false}
                />
              </motion.button>

              {/* Pulsing ring animation */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-red-400 pointer-events-none"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 0, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat-window"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-96 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl"
              style={{ 
                cursor: 'default',
                position: 'relative',
                zIndex: 10000 // Highest z-index
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Chat header */}
              <div className="relative bg-gradient-to-r from-red-600/20 to-red-700/20 backdrop-blur border-b border-gray-700/50">
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-red-600 to-red-700 rounded-xl">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">
                        {chatMode === 'ai' ? 'KillSwitch AI' : 'Admin Support'}
                      </h3>
                      <p className="text-gray-300 text-xs flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            chatMode === 'ai' ? 'bg-blue-400' : (isConnected ? "bg-green-400" : "bg-red-400")
                          }`}
                        />
                        {chatMode === 'ai' ? 'AI Assistant Ready' : 
                         (isConnected ? `Connected as ${isGuest ? 'Guest User' : senderEmail}` : "Disconnected")}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Mode switching buttons */}
                    <motion.button
                      onClick={() => switchChatMode('admin')}
                      className={`p-2 rounded-lg transition-colors ${
                        chatMode === 'admin' 
                          ? 'bg-red-600/30 text-red-300' 
                          : 'hover:bg-white/10 text-gray-400'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      title="Admin Support"
                    >
                      <User className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                      onClick={() => switchChatMode('ai')}
                      className={`p-2 rounded-lg transition-colors ${
                        chatMode === 'ai' 
                          ? 'bg-blue-600/30 text-blue-300' 
                          : 'hover:bg-white/10 text-gray-400'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                      title="AI Assistant"
                    >
                      <Bot className="w-4 h-4" />
                    </motion.button>
                    
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        minimizeChat();
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                    >
                      <Minimize2 className="w-4 h-4 text-gray-300" />
                    </motion.button>
                    <motion.button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleChat();
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                    >
                      <X className="w-4 h-4 text-gray-300" />
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Connection status */}
              <AnimatePresence>
                {!isConnected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-500/10 border-b border-red-500/20"
                  >
                    <div className="p-3 text-center">
                      <p className="text-red-300 text-sm mb-2">
                        {connectionError || "Attempting to connect..."}
                      </p>
                      <motion.button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          retryConnection();
                        }}
                        className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1 rounded-full transition-colors flex items-center gap-1 mx-auto"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry Connection
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages container */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "400px" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-y-auto p-4 bg-gray-900/50 backdrop-blur custom-scrollbar"
                  >
                    <div className="space-y-4">
                        {messages.map((msg, index) => {
                          // Debug message alignment
                          const currentUser = getSafeEmail(senderEmail);
                          const messageSender = getSafeEmail(msg.senderEmail);
                          const isUserMessage = messageSender === currentUser;
                        
                          return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex ${
                              isUserMessage
                                ? "justify-end"
                                : "justify-start"
                            }`}
                          >
                            <div className="max-w-[80%]">
                              <div
                                className={`p-3 rounded-2xl ${
                                  isUserMessage
                                    ? (chatMode === 'ai' ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md" : "bg-gradient-to-r from-red-600 to-red-700 text-white rounded-br-md")
                                    : msg.senderEmail === 'KillSwitch AI'
                                    ? "bg-blue-600/20 text-blue-100 rounded-bl-md border border-blue-500/30"
                                    : "bg-gray-700/50 text-white rounded-bl-md"
                                } backdrop-blur-sm shadow-lg`}
                              >
                             {typeof msg.message === "string"
  ? msg.message
  : msg.message?.text}
                              </div>
                              <div
                                className={`text-xs mt-1 text-gray-400 ${
                                  isUserMessage ? "text-right" : "text-left"
                                }`}
                              >
                                {isUserMessage ? "You" : 
                                 msg.senderEmail === 'KillSwitch AI' ? "KillSwitch AI" : "Admin"}
                                {msg.timestamp &&
                                  ` • ${new Date(msg.timestamp).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}`}
                              </div>
                            </div>
                          </motion.div>
                          );
                        })}
                        
                        {/* Typing indicator for AI mode */}
                        {isTyping && chatMode === 'ai' && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex justify-start"
                          >
                            <div className="bg-blue-600/20 text-blue-100 rounded-2xl rounded-bl-md border border-blue-500/30 p-3">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message input */}
              <div className="p-4 border-t border-gray-700/50 bg-gray-800/30 backdrop-blur">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleSendMessage(e);
                  }} 
                  className="flex items-center gap-2"
                >
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(e);
                        }
                        // Allow all other keys including space
                        e.stopPropagation();
                      }}
                      placeholder={chatMode === 'ai' ? "Ask about gaming hardware..." : "Type your message..."}
                      className={`w-full bg-gray-800/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 pr-12 outline-none transition-all duration-300 placeholder-gray-400 ${
                        chatMode === 'ai' 
                          ? 'focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
                          : 'focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
                      }`}
                      disabled={chatMode === 'admin' ? !isConnected : isTyping}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={(chatMode === 'admin' && !isConnected) || !message.trim() || (chatMode === 'ai' && isTyping)}
                    className={`p-3 rounded-xl text-white transition-all duration-300 shadow-lg disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed ${
                      chatMode === 'ai'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Send className="w-5 h-5" />
                  </motion.button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(31, 41, 55, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.7);
        }
      `}</style>
      
      {/* Chatbot is now integrated within the chat interface */}
    </>
  );
}