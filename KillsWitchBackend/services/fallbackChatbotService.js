const { product, brandcategory, category, subcategory, brand, ProductImage, Review } = require('../models');
const fetch = require('node-fetch');

class FallbackChatbotService {
  constructor() {
    this.companyInfo = {
      name: "KillSwitch",
      description: "Premium gaming hardware and computer components retailer",
      specialties: ["Gaming Cases", "Cooling Systems", "Keyboards", "Mice", "Computer Hardware"],
      website: "killswitch.com",
      supportEmail: "contact@killswitch.us",
      contactEmail: "contact@killswitch.us"
    };
    this.openaiKey = process.env.OPENAI_API_KEY || '';
    this.openaiModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  }

  async getBrandCategories() {
    try {
      const brandCategories = await brandcategory.findAll({
        include: [
          {
            model: brand,
            as: "brand",
            attributes: ["brand_id", "brand_name"],
          },
          {
            model: category,
            as: "category",
            attributes: ["product_category_id", "category_name"],
          },
          {
            model: subcategory,
            as: "subcategory",
            attributes: ["sub_category_id", "sub_category_name"],
          },
        ],
      });

      const brands = [...new Set(brandCategories.map(bc => bc.brand).filter(b => b))];
      const categories = [...new Set(brandCategories.map(bc => bc.category).filter(c => c))];
      const subcategories = [...new Set(brandCategories.map(bc => bc.subcategory).filter(s => s))];

      return {
        brands: brands.map(b => ({ brand_id: b.brand_id, brand_name: b.brand_name })),
        categories: categories.map(c => ({ product_category_id: c.product_category_id, category_name: c.category_name })),
        subcategories: subcategories.map(s => ({ sub_category_id: s.sub_category_id, sub_category_name: s.sub_category_name }))
      };
    } catch (error) {
      console.error('Error fetching brand categories:', error);
      return { brands: [], categories: [], subcategories: [] };
    }
  }

  async getProductKnowledge() {
    try {
      const products = await product.findAll({
        include: [
          {
            model: brandcategory,
            as: "brandcategory",
            include: [
              {
                model: brand,
                as: "brand",
                attributes: ["brand_name"],
              },
              {
                model: category,
                as: "category",
                attributes: ["category_name"],
              },
              {
                model: subcategory,
                as: "subcategory",
                attributes: ["sub_category_name"],
              },
            ],
          },
          {
            model: Review,
            as: "reviews",
            attributes: ["rating"],
            required: false
          }
        ],
      });

      return products.map(p => ({
        id: p.product_id,
        partNumber: p.part_number,
        shortDescription: p.short_description || p.part_number,
        longDescription: p.long_description,
        price: p.price,
        brand: p.brandcategory?.brand?.brand_name || 'Unknown',
        category: p.brandcategory?.category?.category_name || 'Unknown',
        subcategory: p.brandcategory?.subcategory?.sub_category_name || 'Unknown',
        image: p.image,
        averageRating: p.reviews && p.reviews.length > 0 
          ? (p.reviews.reduce((sum, r) => sum + r.rating, 0) / p.reviews.length).toFixed(1)
          : 0,
        reviewCount: p.reviews ? p.reviews.length : 0
      }));
    } catch (error) {
      console.error('Error fetching product knowledge:', error);
      return [];
    }
  }

  buildSimpleProductLink() {
    return '/products';
  }

  async getTopProductsByBrand(brandName, limit = 4) {
    try {
      const products = await this.getProductKnowledge();
      const brandProducts = products.filter(p => 
        p.brand.toLowerCase() === brandName.toLowerCase()
      );
      
      // Sort by rating (if available), then by review count
      brandProducts.sort((a, b) => {
        const ratingA = parseFloat(a.averageRating) || 0;
        const ratingB = parseFloat(b.averageRating) || 0;
        
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        return b.reviewCount - a.reviewCount;
      });
      
      return brandProducts.slice(0, limit);
    } catch (error) {
      console.error('Error getting top products:', error);
      return [];
    }
  }

  async getTopProductsByCategory(categoryName, limit = 4) {
    try {
      const products = await this.getProductKnowledge();
      const categoryProducts = products.filter(p => 
        p.category.toLowerCase() === categoryName.toLowerCase()
      );
      
      // Sort by rating (if available), then by review count
      categoryProducts.sort((a, b) => {
        const ratingA = parseFloat(a.averageRating) || 0;
        const ratingB = parseFloat(b.averageRating) || 0;
        
        if (ratingB !== ratingA) {
          return ratingB - ratingA;
        }
        return b.reviewCount - a.reviewCount;
      });
      
      return categoryProducts.slice(0, limit);
    } catch (error) {
      console.error('Error getting top products:', error);
      return [];
    }
  }

  findMatchingBrand(message, brands) {
    if (!brands || brands.length === 0) return null;
    const msgLower = message.toLowerCase();
    for (const b of brands) {
      const brandLower = b.brand_name.toLowerCase();
      if (msgLower.includes(brandLower)) {
        return b.brand_name;
      }
    }
    return null;
  }

  findMatchingCategory(message, categories) {
    if (!categories || categories.length === 0) return null;
    const msgLower = message.toLowerCase();
    
    // First try exact match
    for (const c of categories) {
      const catLower = c.category_name.toLowerCase();
      if (msgLower.includes(catLower)) {
        return c.category_name;
      }
    }
    
    // Then try keyword matching
    const categoryKeywords = {
      'Keyboards': ['keyboard', 'keyboards', 'typing', 'keys', 'mechanical keyboard', 'gaming keyboard'],
      'Mice': ['mouse', 'mice', 'pointer', 'cursor', 'gaming mouse', 'wireless mouse'],
      'RAM': ['ram', 'memory', 'ddr', 'ram sticks', 'ddr4', 'ddr5', 'memory stick'],
      'Graphics Cards': ['gpu', 'graphics', 'video card', 'nvidia', 'amd', 'radeon', 'geforce', 'rtx', 'gtx'],
      'Processors': ['cpu', 'processor', 'intel', 'amd', 'core i', 'ryzen', 'processor'],
      'Motherboards': ['motherboard', 'mobo', 'mainboard', 'b550', 'z690', 'x570'],
      'Power Supplies': ['psu', 'power supply', 'power unit', 'power supply unit'],
      'Storage': ['ssd', 'hdd', 'hard drive', 'storage', 'nvme', 'm.2', 'sata'],
      'Cases': ['case', 'chassis', 'tower', 'pc case', 'computer case', 'gaming case'],
      'Cooling': ['cooler', 'cooling', 'fan', 'heatsink', 'liquid cooling', 'aio', 'water cooling', 'cpu cooler']
    };
    
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (msgLower.includes(keyword)) {
          const matchedCat = categories.find(c => c.category_name.toLowerCase() === category.toLowerCase());
          if (matchedCat) return matchedCat.category_name;
        }
      }
    }
    
    return null;
  }

  parseMarkdownLinksToObject(text) {
    if (!text) return { text: "", buttons: [] };
    const regex = /\[([^\]]+)\]\((.*?)\)/g;
    const buttons = [];
    let cleanedText = text;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const label = match[1];
      const url = match[2];
      buttons.push({ text: label, url });
      cleanedText = cleanedText.replace(match[0], label);
    }
    return { text: cleanedText.trim(), buttons };
  }

  // Check if query is brand/category related
  isProductQuery(message) {
    const productKeywords = [
      'brand', 'category', 'product', 'have', 'available', 'stock', 'price',
      'keyboard', 'mouse', 'ram', 'gpu', 'cpu', 'ssd', 'hdd', 'case', 'cooler',
      'motherboard', 'power supply', 'psu', 'graphics card', 'processor'
    ];
    
    const msgLower = message.toLowerCase();
    return productKeywords.some(keyword => msgLower.includes(keyword));
  }

  // Check if query is general PC/computer related
  isGeneralPCQuery(message) {
    const generalKeywords = [
      'pc', 'computer', 'gaming', 'build', 'help', 'recommend', 'suggestion',
      'setup', 'system', 'performance', 'how to', 'what is', 'explain',
      'difference between', 'vs', 'better', 'which', 'compare'
    ];
    
    const msgLower = message.toLowerCase();
    return generalKeywords.some(keyword => msgLower.includes(keyword));
  }

  async generateResponse(userMessage, conversationHistory = []) {
    try {
      const message = userMessage.toLowerCase().trim();
      
      // Default responses for common queries
      if (message.includes('hello') || message.includes('hi') || message.includes('hey') || message.includes('helo') || message.length < 5) {
        return { 
          text: "Hello! I'm KillSwitch AI. I can help you with:\n\n🔍 Finding products by brand or category\n💡 Answering general PC/gaming questions\n\nWhat would you like help with today?", 
          buttons: [] 
        };
      }

      // Handle help/support/contact queries
      if (message.includes('help') || message.includes('support') || 
          message.includes('contact') || message.includes('human') || 
          message.includes('agent') || message.includes('email')) {
        return { 
          text: `For personalized support, please contact our team:\n\n📧 Email: ${this.companyInfo.supportEmail}\n🌐 Website: ${this.companyInfo.website}\n\nOur support team will get back to you within 24 hours.`, 
          buttons: [] 
        };
      }

      // Load DB data only when needed for product queries
      if (this.isProductQuery(message)) {
        const [productsData, brandCategoriesData] = await Promise.all([
          this.getProductKnowledge(),
          this.getBrandCategories()
        ]);
        
        const products = productsData;
        const brands = brandCategoriesData.brands;
        const categories = brandCategoriesData.categories;

        // Check for specific brand mention
        const matchedBrand = this.findMatchingBrand(message, brands);
        if (matchedBrand) {
          const topProducts = await this.getTopProductsByBrand(matchedBrand, 3);
          
          if (topProducts.length === 0) {
            return {
              text: `Yes, we have ${matchedBrand} products available! Please visit our website to see our full collection.`,
              buttons: []
            };
          }
          
          let responseText = `Yes, we have ${matchedBrand} products available! Here are some popular options:\n\n`;
          
          topProducts.forEach((product, index) => {
            responseText += `${index + 1}. ${product.partNumber}\n`;
          });
          
          responseText += `\nYou can find more options on our products page.`;
          
          return {
            text: responseText,
            buttons: []
          };
        }

        // Check for specific category mention
        const matchedCategory = this.findMatchingCategory(message, categories);
        if (matchedCategory) {
          const topProducts = await this.getTopProductsByCategory(matchedCategory, 3);
          
          if (topProducts.length === 0) {
            return {
              text: `Yes, we have ${matchedCategory} products available! Please visit our website to see our full collection.`,
              buttons: []
            };
          }
          
          let responseText = `Yes, we have ${matchedCategory} products in stock! Here are some popular options:\n\n`;
          
          topProducts.forEach((product, index) => {
            responseText += `${index + 1}. ${product.partNumber}\n`;
          });
          
          responseText += `\nYou can find more options on our products page.`;
          
          return {
            text: responseText,
            buttons: []
          };
        }

        // Check for specific product queries
        if (message.includes('ram') || message.includes('memory')) {
          const topRAM = await this.getTopProductsByCategory('RAM', 3);
          if (topRAM.length > 0) {
            let responseText = `For gaming RAM, here are some popular options:\n\n`;
            topRAM.forEach((product, index) => {
              responseText += `${index + 1}. ${product.partNumber}\n`;
            });
            responseText += `\nCheck our products page for more options!`;
            return { text: responseText, buttons: [] };
          }
        }

        if (message.includes('keyboard')) {
          const topKeyboards = await this.getTopProductsByCategory('Keyboards', 3);
          if (topKeyboards.length > 0) {
            let responseText = `We have great gaming keyboards! Here are some popular options:\n\n`;
            topKeyboards.forEach((product, index) => {
              responseText += `${index + 1}. ${product.partNumber}\n`;
            });
            responseText += `\nCheck our products page for more options!`;
            return { text: responseText, buttons: [] };
          }
        }

        if (message.includes('mouse') || message.includes('mice')) {
          const topMice = await this.getTopProductsByCategory('Mice', 3);
          if (topMice.length > 0) {
            let responseText = `We have excellent gaming mice! Here are some popular options:\n\n`;
            topMice.forEach((product, index) => {
              responseText += `${index + 1}. ${product.partNumber}\n`;
            });
            responseText += `\nCheck our products page for more options!`;
            return { text: responseText, buttons: [] };
          }
        }

        if (message.includes('gpu') || message.includes('graphics')) {
          const topGPU = await this.getTopProductsByCategory('Graphics Cards', 3);
          if (topGPU.length > 0) {
            let responseText = `For graphics cards, here are some popular options:\n\n`;
            topGPU.forEach((product, index) => {
              responseText += `${index + 1}. ${product.partNumber}\n`;
            });
            responseText += `\nCheck our products page for more options!`;
            return { text: responseText, buttons: [] };
          }
        }

        if (message.includes('cpu') || message.includes('processor')) {
          const topCPU = await this.getTopProductsByCategory('Processors', 3);
          if (topCPU.length > 0) {
            let responseText = `For processors, here are some popular options:\n\n`;
            topCPU.forEach((product, index) => {
              responseText += `${index + 1}. ${product.partNumber}\n`;
            });
            responseText += `\nCheck our products page for more options!`;
            return { text: responseText, buttons: [] };
          }
        }

        if (message.includes('case') || message.includes('chassis')) {
          const topCases = await this.getTopProductsByCategory('Cases', 3);
          if (topCases.length > 0) {
            let responseText = `For PC cases, here are some popular options:\n\n`;
            topCases.forEach((product, index) => {
              responseText += `${index + 1}. ${product.partNumber}\n`;
            });
            responseText += `\nCheck our products page for more options!`;
            return { text: responseText, buttons: [] };
          }
        }

        if (message.includes('ssd') || message.includes('storage') || message.includes('hard drive')) {
          const topStorage = await this.getTopProductsByCategory('Storage', 3);
          if (topStorage.length > 0) {
            let responseText = `For storage, here are some popular options:\n\n`;
            topStorage.forEach((product, index) => {
              responseText += `${index + 1}. ${product.partNumber}\n`;
            });
            responseText += `\nCheck our products page for more options!`;
            return { text: responseText, buttons: [] };
          }
        }

        if (message.includes('psu') || message.includes('power supply')) {
          const topPSU = await this.getTopProductsByCategory('Power Supplies', 3);
          if (topPSU.length > 0) {
            let responseText = `For power supplies, here are some popular options:\n\n`;
            topPSU.forEach((product, index) => {
              responseText += `${index + 1}. ${product.partNumber}\n`;
            });
            responseText += `\nCheck our products page for more options!`;
            return { text: responseText, buttons: [] };
          }
        }
      }

      // Handle general PC/gaming queries - these should go to OpenAI
      if (this.isGeneralPCQuery(message) || !this.isProductQuery(message)) {
        if (this.openaiKey) {
          const [productsData, brandCategoriesData] = await Promise.all([
            this.getProductKnowledge(),
            this.getBrandCategories()
          ]);
          
          const openaiResp = await this.callOpenAI(userMessage, conversationHistory, productsData, brandCategoriesData.brands, brandCategoriesData.categories);
          if (openaiResp) {
            if (typeof openaiResp === 'string') {
              return { text: openaiResp, buttons: [] };
            }
            return openaiResp;
          }
        }
      }

      // Generic response with helpful suggestions
      const [brandCategoriesData] = await Promise.all([
        this.getBrandCategories()
      ]);
      
      const brandList = brandCategoriesData.brands.slice(0, 5).map(b => b.brand_name).join(', ');
      const categoryList = brandCategoriesData.categories.slice(0, 5).map(c => c.category_name).join(', ');
      
      return { 
        text: `I'm here to help with gaming PCs and hardware! You can ask me:\n\n` +
              `🔍 **About specific products**\n` +
              `• "Do you have ASUS keyboards?"\n` +
              `• "What RAM do you recommend?"\n` +
              `• "Show me RTX graphics cards"\n\n` +
              `💡 **General questions**\n` +
              `• "How to build a gaming PC?"\n` +
              `• "DDR4 vs DDR5 difference?"\n` +
              `• "Best CPU for gaming?"\n\n` +
              `Popular brands: ${brandList}\n` +
              `Categories: ${categoryList}\n\n` +
              `For support, please email ${this.companyInfo.supportEmail}`, 
        buttons: [] 
      };

    } catch (error) {
      console.error('Error generating response:', error);
      return { 
        text: "I'm here to help with gaming PCs and hardware! Tell me what you're looking for - CPUs, GPUs, RAM, keyboards, mice, or PC building advice.", 
        buttons: [] 
      };
    }
  }

  async callOpenAI(userMessage, conversationHistory = [], products = [], brands = [], categories = []) {
    if (!this.openaiKey) return null;
    
    try {
      console.log('Calling OpenAI API for general query:', userMessage);
      
      const availableBrands = brands.map(b => b.brand_name).join(', ');
      const availableCategories = categories.map(c => c.category_name).join(', ');
      
      const systemPrompt = `You are KillSwitch AI, a friendly gaming hardware assistant. Your role is to help users with general PC/gaming questions.

Available brands in our store: ${availableBrands}
Available categories: ${availableCategories}

Guidelines:
- Answer general PC/gaming questions (build advice, component comparisons, technology explanations)
- Be conversational and helpful
- For comparisons (like DDR4 vs DDR5), provide general information
- For build advice, give general recommendations based on common use cases
- Keep responses concise and informative
- Don't provide specific product links
- If users ask about specific products, direct them to ask about brands or categories

Example topics you handle:
- "How do I build a gaming PC?"
- "What's the difference between Intel and AMD?"
- "How much RAM do I need for gaming?"
- "Explain what a GPU does"
- "Tips for first-time PC builders"

If users ask about product availability, suggest they ask about specific brands or categories.`;

      const messages = [
        { role: "system", content: systemPrompt }
      ];
      
      // Add conversation history if available
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-5);
        recentHistory.forEach(msg => {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        });
      }
      
      messages.push({ role: "user", content: userMessage });

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.openaiKey}`,
        },
        body: JSON.stringify({
          model: this.openaiModel,
          messages: messages,
          max_tokens: 200,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        console.error('OpenAI API error:', response.status);
        return null;
      }

      const result = await response.json();
      const text = result.choices && result.choices[0]?.message?.content;
      
      return text || null;
      
    } catch (err) {
      console.error('Error calling OpenAI:', err.message);
      return null;
    }
  }

  async searchProducts(query) {
    try {
      const products = await this.getProductKnowledge();
      const searchTerm = query.toLowerCase();
      
      return products.filter(product => 
        product.partNumber?.toLowerCase().includes(searchTerm) ||
        product.shortDescription?.toLowerCase().includes(searchTerm) ||
        product.longDescription?.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm) ||
        product.category?.toLowerCase().includes(searchTerm)
      ).slice(0, 5).map(p => p.partNumber); // Return just part numbers
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }

  getWelcomeMessage() {
    return {
      text: "👋 Welcome to KillSwitch! I'm your AI assistant.\n\nI can help you with:\n🔍 **Finding products** by brand or category\n💡 **General PC/gaming questions** and advice\n\nWhat would you like to know about today?",
      buttons: []
    };
  }
}

module.exports = FallbackChatbotService;