const OpenAIChatbotService = require('../services/fallbackChatbotService');

class ChatbotController {

  constructor() {
    this.chatbotService = new OpenAIChatbotService();
    this.conversationHistory = new Map();
    this.MAX_HISTORY = 20;
  }

  // ─── Helpers ───────────────────────────────────────────────

  _getConversationKey({ sessionId, userEmail }) {
    return sessionId || userEmail || 'anonymous';
  }

  _normalizeResponse(response) {
    return typeof response === 'string'
      ? { text: response, buttons: [] }
      : response;
  }

  _getHistory(key) {
    return this.conversationHistory.get(key) || [];
  }

  _saveHistory(key, history, userMessage, botText) {
    history.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: botText }
    );

    if (history.length > this.MAX_HISTORY) {
      history = history.slice(-this.MAX_HISTORY);
    }

    this.conversationHistory.set(key, history);
  }

  // ─── Routes ────────────────────────────────────────────────

  getWelcome = async (_req, res) => {
    try {
      const welcomeMessage = this.chatbotService.getWelcomeMessage();
      const payload = this._normalizeResponse(welcomeMessage);

      res.json({ success: true, message: payload, type: 'welcome' });
    } catch (error) {
      console.error('Error getting welcome message:', error);
      res.status(500).json({ success: false, error: 'Failed to get welcome message' });
    }
  };

  sendMessage = async (req, res) => {
    try {
      const { message, sessionId, userEmail } = req.body;

      if (!message?.trim()) {
        return res.status(400).json({ success: false, error: 'Message is required' });
      }

      const conversationKey = this._getConversationKey({ sessionId, userEmail });
      const history = this._getHistory(conversationKey);

      let botResponse;

      try {
        botResponse = await this.chatbotService.generateResponse(message, history);
      } catch (error) {
        console.error('OpenAI failed:', error.message);
        botResponse = {
          text: "⚠️ I'm experiencing technical issues. Please try again later.",
          buttons: []
        };
      }

      const normalized = this._normalizeResponse(botResponse);
      this._saveHistory(conversationKey, history, message, normalized.text);

      res.json({
        success: true,
        message: normalized,
        type: 'chatbot_response',
        sessionId: conversationKey
      });
    } catch (error) {
      console.error('Error processing chatbot message:', error);
      res.status(500).json({
        success: false,
        message: "I apologize, but I'm experiencing technical difficulties. Please try again later."
      });
    }
  };

  searchProducts = async (req, res) => {
    try {
      const { query } = req.query;

      if (!query?.trim()) {
        return res.status(400).json({ success: false, error: 'Search query is required' });
      }

      const products = await this.chatbotService.searchProducts(query);

      res.json({ success: true, products, query });
    } catch (error) {
      console.error('Error searching products:', error);
      res.status(500).json({ success: false, error: 'Failed to search products' });
    }
  };

  getKnowledgeBase = async (_req, res) => {
    try {
      const [products, brandCategories] = await Promise.all([
        this.chatbotService.getProductKnowledge(),
        this.chatbotService.getBrandCategories()
      ]);

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
      console.error('Error getting knowledge base:', error);
      res.status(500).json({ success: false, error: 'Failed to get knowledge base' });
    }
  };

  clearHistory = async (req, res) => {
    try {
      const conversationKey = this._getConversationKey(req.body);
      this.conversationHistory.delete(conversationKey);

      res.json({ success: true, message: 'Conversation history cleared' });
    } catch (error) {
      console.error('Error clearing history:', error);
      res.status(500).json({ success: false, error: 'Failed to clear history' });
    }
  };

  getHistory = async (req, res) => {
    try {
      const conversationKey = this._getConversationKey(req.query);
      const history = this._getHistory(conversationKey);

      res.json({ success: true, history, sessionId: conversationKey });
    } catch (error) {
      console.error('Error getting history:', error);
      res.status(500).json({ success: false, error: 'Failed to get history' });
    }
  };
}

module.exports = new ChatbotController();