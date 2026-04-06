"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  X,
  Minimize2,
  Bot,
  ShoppingBag,
} from "lucide-react";
import { API, chatbotAPI } from "../../api/api";

export default function ChatbotComponent() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const [senderEmail, setSenderEmail] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Chatbot-only states
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [chatbotWelcomed, setChatbotWelcomed] = useState(false);

  // Initialize chatbot
  useEffect(() => {
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    setupUserIdentity();
  }, []);

  // Setup user identity for chatbot
  const setupUserIdentity = async () => {
    try {
      const profile = await API.auth.getProfile();
      const email = profile?.user?.email || profile?.email;
      
      if (email) {
        setSenderEmail(email);
      } else {
        // Generate guest ID
        let guestId = localStorage.getItem('killswitch_chatbot_guest_id');
        if (!guestId) {
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          guestId = `guest_${timestamp}_${randomStr}`;
          localStorage.setItem('killswitch_chatbot_guest_id', guestId);
        }
        setSenderEmail(guestId);
      }
    } catch (error) {
      console.error("Error setting up user identity:", error);
    }
  };

  // Load persisted chatbot messages
  useEffect(() => {
    if (senderEmail) {
      const storedMessages = localStorage.getItem('killswitch_chatbot_messages');
      if (storedMessages) {
        try {
          const parsedMessages = JSON.parse(storedMessages);
          // Filter to only keep chatbot messages
          const chatbotMessages = parsedMessages.filter(msg => 
            msg.type === 'chatbot' && 
            (msg.senderEmail === 'KillSwitch AI' || msg.receiverEmail === 'KillSwitch AI')
          );
          setMessages(chatbotMessages);
          
          const hasWelcome = chatbotMessages.some(msg => 
            msg.senderEmail === 'KillSwitch AI' && msg.message.includes('Welcome')
          );
          if (hasWelcome) {
            setChatbotWelcomed(true);
          }
        } catch (error) {
          console.error('Error loading chatbot messages:', error);
        }
      }
    }
  }, [senderEmail]);

  // Show welcome message when opened
  useEffect(() => {
    if (isOpen && !chatbotWelcomed && senderEmail) {
      getChatbotWelcome();
    }
  }, [isOpen, senderEmail, chatbotWelcomed]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Chatbot API functions
  const sendChatbotMessage = async (userMessage) => {
    try {
      setIsTyping(true);
      const data = await chatbotAPI.sendMessage(userMessage, sessionId, senderEmail);
      
       if (data.success) {
        // Normalize response: data.message may be string OR { text, buttons }
        const payload = data.message;
        const botText = typeof payload === 'string' ? payload : (payload.text || '');
        const botButtons = (payload && typeof payload === 'object' && payload.buttons) ? payload.buttons : [];

        const botMessage = {
          senderEmail: "KillSwitch AI",
          receiverEmail: senderEmail,
          message: botText,
          buttons: botButtons,
          timestamp: new Date().toISOString(),
          type: 'chatbot'
        };
        
        setMessages(prev => {
          const newMessages = [...prev, botMessage];
          // Save to localStorage
          try {
            localStorage.setItem('killswitch_chatbot_messages', JSON.stringify(newMessages));
          } catch (e) {
            console.error('Failed to save messages:', e);
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error sending chatbot message:', error);
      
      // Add error message
      const errorMessage = {
        senderEmail: "KillSwitch AI",
        receiverEmail: senderEmail,
        message: "I'm having trouble connecting. Please try again.",
        timestamp: new Date().toISOString(),
        type: 'chatbot'
      };
      
      setMessages(prev => {
        const newMessages = [...prev, errorMessage];
        try {
          localStorage.setItem('killswitch_chatbot_messages', JSON.stringify(newMessages));
        } catch (e) {
          console.error('Failed to save messages:', e);
        }
        return newMessages;
      });
    } finally {
      setIsTyping(false);
    }
  };

  const getChatbotWelcome = async () => {
    try {
      const data = await chatbotAPI.getWelcome();
     if (data.success) {
        // Normalize response: data.message may be string OR { text, buttons }
        const payload = data.message;
        const botText = typeof payload === 'string' ? payload : (payload.text || '');
        const botButtons = (payload && typeof payload === 'object' && payload.buttons) ? payload.buttons : [];

        const botMessage = {
          senderEmail: "KillSwitch AI",
          receiverEmail: senderEmail,
          message: botText,
          buttons: botButtons,
          timestamp: new Date().toISOString(),
          type: 'chatbot'
        };
        setMessages(prev => {
  const newMessages = [...prev, botMessage];
          localStorage.setItem('killswitch_chatbot_messages', JSON.stringify(newMessages));
          return newMessages;
        });
        setChatbotWelcomed(true);
      }
    } catch (error) {
      console.error('Error getting chatbot welcome:', error);
      // Fallback welcome
      const fallbackMessage = {
        senderEmail: "KillSwitch AI",
        receiverEmail: senderEmail,
        message: "👋 Welcome to KillSwitch! I'm your AI assistant. Ask me about any brand or category - I'll tell you if it's available!",
        timestamp: new Date().toISOString(),
        type: 'chatbot'
      };
      setMessages(prev => {
        const newMessages = [...prev, fallbackMessage];
        localStorage.setItem('killswitch_chatbot_messages', JSON.stringify(newMessages));
        return newMessages;
      });
      setChatbotWelcomed(true);
    }
  };
 
const parseMessage = (text) => {
  if (!text) return [];

  text = text.replace(/\*\*/g, "");

  const parts = [];
  const regex = /\[([^\]]+)\]\((.*?)\)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {

    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex, match.index)
      });
    }

    parts.push({
      type: "link",
      text: match[1],
      url: match[2]
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.substring(lastIndex)
    });
  }

  return parts;
};
  // Handle link click
  const handleLinkClick = (url) => {
    if (url.startsWith('/')) {
      router.push(url);
    } else if (url.startsWith(window.location.origin)) {
      router.push(url.replace(window.location.origin, ''));
    } else {
      window.open(url, '_blank');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const userMessage = {
      senderEmail: senderEmail,
      receiverEmail: "KillSwitch AI",
      message: message, 
      timestamp: new Date().toISOString(),
      type: 'chatbot'
    };

    // Add user message to chat
    setMessages(prev => {
      const newMessages = [...prev, userMessage];
      localStorage.setItem('killswitch_chatbot_messages', JSON.stringify(newMessages));
      return newMessages;
    });

    const currentMessage = message;
    setMessage("");
    await sendChatbotMessage(currentMessage);
  };

  const toggleChat = () => setIsOpen(!isOpen);
  const minimizeChat = () => setIsMinimized(!isMinimized);

  return (
    <>
      {/* Overlay backdrop when chat is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm cursor-pointer"
            style={{ zIndex: 9990 }}
            onClick={toggleChat}
          />
        )}
      </AnimatePresence>

      {/* Chat button and window container */}
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

              {/* Chat button */}
              <motion.button
                onClick={toggleChat}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                type="button"
              >
                <div className="flex items-center gap-3 px-6 py-4 pointer-events-none">
                  <Bot className="w-5 h-5" />
                  <span className="font-semibold text-sm">AI Assistant</span>
                </div>
                
                {/* Animated gradient overlay */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  initial={false}
                />
              </motion.button>

              {/* Pulsing ring animation */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-blue-400 pointer-events-none"
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
                zIndex: 10000
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative bg-gradient-to-r from-blue-600/20 to-blue-700/20 backdrop-blur border-b border-gray-700/50 p-4 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">KillSwitch AI</h3>
                      <p className="text-gray-300 text-xs flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        Online
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={minimizeChat}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      type="button"
                    >
                      <Minimize2 className="w-4 h-4 text-gray-300" />
                    </motion.button>
                    <motion.button
                      onClick={toggleChat}
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

              {/* Messages */}
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "400px" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-y-auto p-4 bg-gray-900/50 backdrop-blur custom-scrollbar"
                  >
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                          <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>Ask me about brands or categories!</p>
                          <p className="text-sm mt-2">Try: "Do you have ASUS?"</p>
                        </div>
                      ) : (
                        messages.map((msg, index) => {
                          const isUser = msg.senderEmail === senderEmail;
                          const parsedParts = !isUser ? parseMessage(msg.message) : [];
                          
                          return (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                            >
                              <div className="max-w-[85%]">
                                <div
                                  className={`p-3 rounded-2xl ${
                                    isUser
                                      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md"
                                      : "bg-blue-600/20 text-blue-100 rounded-bl-md border border-blue-500/30"
                                  } backdrop-blur-sm shadow-lg`}
                                >
                                  {!isUser && (
  <>
    {/* If backend supplied structured buttons, render them first */}
    {msg.buttons && msg.buttons.length > 0 ? (
      <div className="flex flex-wrap gap-2">
        {msg.buttons.map((b, i) => {
          // use next/link for internal routes, external open in new tab
          const isInternal = b.url.startsWith('/');
          return isInternal ? (
            <Link key={i} href={b.url} className="mt-2 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <ShoppingBag className="w-4 h-4" />
              {b.text}
            </Link>
          ) : (
            <a key={i} href={b.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
              <ShoppingBag className="w-4 h-4" />
              {b.text}
            </a>
          );
        })}
      </div>
    ) : (
      // fallback to markdown-parsed content
      parsedParts.length > 0 ? (
        <div className="space-y-2">
          {parsedParts.map((part, idx) => {
            if (part.type === 'text') return <span key={idx} className="block">{part.content}</span>;
            return (
              <a key={idx} href={part.url} className="mt-2 inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                <ShoppingBag className="w-4 h-4" />
                {part.text}
              </a>
            );
          })}
        </div>
      ) : (
        <div>{msg.message}</div>
      )
    )}
  </>
)}
                             
                                </div>
                                <div className={`text-xs mt-1 text-gray-400 ${isUser ? "text-right" : "text-left"}`}>
                                  {isUser ? "You" : "KillSwitch AI"}
                                  {msg.timestamp && (
                                    <span className="ml-1">
                                      • {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          );
                        })
                      )}
                      
                      {/* Typing indicator */}
                      {isTyping && (
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

              {/* Input */}
              <div className="p-4 border-t border-gray-700/50 bg-gray-800/30 backdrop-blur rounded-b-2xl">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                    placeholder="Ask about brands or categories..."
                    className="flex-1 bg-gray-800/50 border border-gray-600/50 text-white rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-400"
                    disabled={isTyping}
                  />
                  <motion.button
                    type="submit"
                    disabled={!message.trim() || isTyping}
                    className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed rounded-xl text-white transition-all duration-300 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
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
          background: rgba(59, 130, 246, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.7);
        }
      `}</style>
    </>
  );
}