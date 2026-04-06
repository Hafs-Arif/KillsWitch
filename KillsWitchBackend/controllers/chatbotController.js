const DeepSeekChatbotService = require('../services/geminiChatbotService');
const FallbackChatbotService = require('../services/fallbackChatbotService');

class ChatbotController {

  constructor() {
    this.deepSeekService = new DeepSeekChatbotService();
    this.fallbackService = new FallbackChatbotService();
    this.conversationHistory = new Map();
  }

  // Welcome Message
  getWelcome = async (req, res) => {
    try {
      const welcomeMessage = this.fallbackService.getWelcomeMessage();

      const payload = typeof welcomeMessage === "string"
        ? { text: welcomeMessage, buttons: [] }
        : welcomeMessage;

      res.json({
        success: true,
        message: payload,
        type: "welcome"
      });

    } catch (error) {
      console.error("Error getting welcome message:", error);
      res.status(500).json({
        success: false,
        error: "Failed to get welcome message"
      });
    }
  };

  // Send Message
  sendMessage = async (req, res) => {
    try {

      const { message, sessionId, userEmail } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({
          success: false,
          error: "Message is required"
        });
      }

      const conversationKey = sessionId || userEmail || "anonymous";

      let history = this.conversationHistory.get(conversationKey) || [];

      let botResponse;

      try {
        console.log("Using OpenAI powered chatbot...");

        botResponse = await this.fallbackService.generateResponse(
          message,
          history
        );

        console.log("OpenAI response generated");

      } catch (error) {
        console.error("OpenAI failed, using fallback:", error.message);

        botResponse = {
          text: "⚠️ I'm experiencing technical issues. Please try again later.",
          buttons: []
        };
      }

      // Normalize response
      const normalizedResponse =
        typeof botResponse === "string"
          ? { text: botResponse, buttons: [] }
          : botResponse;

      // Save only text to history (important fix)
      history.push(
        { role: "user", content: message },
        { role: "assistant", content: normalizedResponse.text }
      );

      if (history.length > 20) {
        history = history.slice(-20);
      }

      this.conversationHistory.set(conversationKey, history);

      res.json({
        success: true,
        message: normalizedResponse,
        type: "chatbot_response",
        sessionId: conversationKey
      });

    } catch (error) {

      console.error("Error processing chatbot message:", error);

      res.status(500).json({
        success: false,
        message:
          "I apologize, but I'm experiencing technical difficulties. Please try again later."
      });
    }
  };

  // Product Search
  searchProducts = async (req, res) => {
    try {

      const { query } = req.query;

      if (!query || !query.trim()) {
        return res.status(400).json({
          success: false,
          error: "Search query is required"
        });
      }

      let products;

      try {
        products = await this.deepSeekService.searchProducts(query);
      } catch (error) {
        console.log("Using fallback for search:", error.message);
        products = await this.fallbackService.searchProducts(query);
      }

      res.json({
        success: true,
        products,
        query
      });

    } catch (error) {

      console.error("Error searching products:", error);

      res.status(500).json({
        success: false,
        error: "Failed to search products"
      });
    }
  };

  // Knowledge Base
  getKnowledgeBase = async (req, res) => {
    try {

      let products;
      let brandCategories;

      try {

        [products, brandCategories] = await Promise.all([
          this.deepSeekService.getProductKnowledge(),
          this.deepSeekService.getBrandCategories()
        ]);

      } catch (error) {

        console.log("Using fallback for knowledge base:", error.message);

        [products, brandCategories] = await Promise.all([
          this.fallbackService.getProductKnowledge(),
          this.fallbackService.getBrandCategories()
        ]);
      }

      res.json({
        success: true,
        data: {
          totalProducts: products.length,
          brands: brandCategories.brands,
          categories: brandCategories.categories,
          subcategories: brandCategories.subcategories,
          sampleProducts: products.slice(0, 10)
        }
      });

    } catch (error) {

      console.error("Error getting knowledge base:", error);

      res.status(500).json({
        success: false,
        error: "Failed to get knowledge base"
      });
    }
  };

  // Clear Chat History
  clearHistory = async (req, res) => {
    try {

      const { sessionId, userEmail } = req.body;

      const conversationKey = sessionId || userEmail || "anonymous";

      this.conversationHistory.delete(conversationKey);

      res.json({
        success: true,
        message: "Conversation history cleared"
      });

    } catch (error) {

      console.error("Error clearing history:", error);

      res.status(500).json({
        success: false,
        error: "Failed to clear history"
      });
    }
  };

  // Get Chat History
  getHistory = async (req, res) => {
    try {

      const { sessionId, userEmail } = req.query;

      const conversationKey = sessionId || userEmail || "anonymous";

      const history = this.conversationHistory.get(conversationKey) || [];

      res.json({
        success: true,
        history,
        sessionId: conversationKey
      });

    } catch (error) {

      console.error("Error getting history:", error);

      res.status(500).json({
        success: false,
        error: "Failed to get history"
      });
    }
  };
}

module.exports = new ChatbotController();