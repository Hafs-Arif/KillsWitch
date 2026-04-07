const { product, brandcategory, category, subcategory, brand, ProductImage, Review } = require('../models');

class DeepSeekChatbotService {
  constructor() {
    this.apiKey = "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";
    this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.model = "deepseek/deepseek-r1:free";
    this.companyInfo = {
      name: "KillSwitch",
      description: "Premium gaming hardware and computer components retailer",
      specialties: ["Gaming Cases", "Cooling Systems", "Keyboards", "Mice", "Computer Hardware"],
      website: "killswitch.com"
    };
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
          },
          {
            model: ProductImage,
            as: "images",
            attributes: ["id", "url"]
          },
          {
            model: Review,
            as: "reviews",
            attributes: ["id", "rating", "comment", "reviewer_name"],
            required: false
          },
        ],
        limit: 50, // Limit to avoid token overflow
        order: [["product_id", "ASC"]],
      });

      return products.map(p => ({
        id: p.product_id,
        partNumber: p.part_number,
        price: p.price,
        quantity: p.quantity,
        shortDescription: p.short_description,
        longDescription: p.long_description,
        status: p.status,
        condition: p.condition,
        subCondition: p.sub_condition,
        brand: p.brandcategory?.brand?.brand_name || 'Unknown',
        category: p.brandcategory?.category?.category_name || 'Unknown',
        subcategory: p.brandcategory?.subcategory?.sub_category_name || 'Unknown',
        specifications: {
          // Case specs
          productModel: p.product_model,
          motherboard: p.motherboard,
          material: p.material,
          frontPorts: p.front_ports,
          gpuLength: p.gpu_length,
          cpuHeight: p.cpu_height,
          hddSupport: p.hdd_support,
          ssdSupport: p.ssd_support,
          expansionSlots: p.expansion_slots,
          caseSize: p.case_size,
          waterCoolingSupport: p.water_cooling_support,
          caseFanSupport: p.case_fan_support,
          
          // Cooling specs
          pumpParameter: p.pump_parameter,
          pumpBearing: p.pump_bearing,
          pumpSpeed: p.pump_speed,
          pumpInterface: p.pump_interface,
          pumpNoise: p.pump_noise,
          tdp: p.tdp,
          pipeLengthMaterial: p.pipe_length_material,
          lightEffect: p.light_effect,
          drainageSize: p.drainage_size,
          
          // Fan specs
          fanSize: p.fan_size,
          fanSpeed: p.fan_speed,
          fanVoltage: p.fan_voltage,
          fanInterface: p.fan_interface,
          fanAirflow: p.fan_airflow,
          fanWindPressure: p.fan_wind_pressure,
          fanNoise: p.fan_noise,
          fanBearingType: p.fan_bearing_type,
          fanPower: p.fan_power,
          
          // Keyboard specs
          axis: p.axis,
          numberOfKeys: p.number_of_keys,
          weight: p.weight,
          keycapTechnology: p.keycap_technology,
          wireLength: p.wire_length,
          lightingStyle: p.lighting_style,
          bodyMaterial: p.body_material,
          
          // Mouse specs
          dpi: p.dpi,
          returnRate: p.return_rate,
          engineSolution: p.engine_solution,
          surfaceTechnology: p.surface_technology,
        },
        reviews: p.reviews || [],
        averageRating: p.reviews && p.reviews.length > 0 
          ? (p.reviews.reduce((sum, review) => sum + review.rating, 0) / p.reviews.length).toFixed(1)
          : 0,
        reviewCount: p.reviews ? p.reviews.length : 0
      }));
    } catch (error) {
      console.error('Error fetching product knowledge:', error);
      return [];
    }
  }

  async getBrandCategories() {
    try {
      const brands = await brand.findAll({
        attributes: ["brand_id", "brand_name"]
      });
      
      const categories = await category.findAll({
        attributes: ["product_category_id", "category_name"]
      });
      
      const subcategories = await subcategory.findAll({
        attributes: ["sub_category_id", "sub_category_name"]
      });

      return { brands, categories, subcategories };
    } catch (error) {
      console.error('Error fetching brand categories:', error);
      return { brands: [], categories: [], subcategories: [] };
    }
  }

  createSystemPrompt(products, brandCategories) {
    const productSummary = products.slice(0, 20).map(p => 
      `${p.brand} ${p.partNumber} - ${p.shortDescription} ($${p.price}) - ${p.category}/${p.subcategory} - Stock: ${p.quantity} - Rating: ${p.averageRating}/5`
    ).join('\n');

    const brandList = brandCategories.brands.map(b => b.brand_name).join(', ');
    const categoryList = brandCategories.categories.map(c => c.category_name).join(', ');

    return `You are KillSwitch AI Assistant, a helpful chatbot for KillSwitch - a premium gaming hardware and computer components retailer.

COMPANY INFO:
- Name: KillSwitch
- Specialties: Gaming Cases, Cooling Systems, Keyboards, Mice, Computer Hardware
- We offer high-quality gaming components with expert support

AVAILABLE BRANDS: ${brandList}

PRODUCT CATEGORIES: ${categoryList}

CURRENT PRODUCT INVENTORY (Sample):
${productSummary}

INSTRUCTIONS:
1. Always be helpful, friendly, and knowledgeable about gaming hardware
2. Provide specific product recommendations based on user needs
3. Include pricing, availability, and key specifications when relevant
4. If asked about products not in inventory, suggest similar alternatives
5. Help with compatibility questions, performance comparisons, and technical specs
6. Always mention that users can contact our admin team for detailed quotes or custom builds
7. Keep responses concise and informative - avoid lengthy explanations
8. Use gaming terminology appropriately
9. If you don't know something specific, admit it and offer to connect them with our technical team
10. DO NOT use bold text formatting (**text**) or emojis in responses
11. Keep text length short while maintaining helpful information
12. Focus on product details, specifications, and practical advice

WELCOME MESSAGE: "Welcome to KillSwitch! I'm your AI assistant for gaming hardware. I can help you find components, build new rigs, upgrade existing systems, or provide technical advice. What can I assist you with today?"

Remember: You represent KillSwitch brand - be professional, knowledgeable, and gaming-focused!`;
  }

  async generateResponse(userMessage, conversationHistory = []) {
    try {
      // Get fresh product data and brand categories
      const [products, brandCategories] = await Promise.all([
        this.getProductKnowledge(),
        this.getBrandCategories()
      ]);

      const systemPrompt = this.createSystemPrompt(products, brandCategories);
      
      // Build messages array for OpenRouter API
      const messages = [
        {
          role: "system",
          content: systemPrompt
        }
      ];
      
      // Add recent conversation history
      conversationHistory.slice(-10).forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
      
      // Add current user message
      messages.push({
        role: "user",
        content: userMessage
      });

      const requestBody = {
        model: this.model,
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 0.95
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'HTTP-Referer': 'https://killswitch.com',
          'X-Title': 'KillSwitch Gaming Hardware',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API Error:', response.status, errorText);
        
        // Handle specific error types
        if (response.status === 429) {
          throw new Error('Rate limit exceeded - using fallback');
        } else if (response.status === 401) {
          throw new Error('API key invalid - using fallback');
        } else {
          throw new Error(`DeepSeek API error: ${response.status} - using fallback`);
        }
      }

      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      } else {
        throw new Error('Invalid response format from DeepSeek API');
      }
    } catch (error) {
      console.error('Error generating chatbot response:', error);
      // Re-throw the error so the controller can use the enhanced fallback service
      throw error;
    }
  }

  getWelcomeMessage() {
    return "Welcome to KillSwitch! I'm your AI assistant for gaming hardware. I can help you find components, build new rigs, upgrade existing systems, or provide technical advice. What can I assist you with today?";
  }

  // Method to search products based on user query
  async searchProducts(query) {
    try {
      const products = await this.getProductKnowledge();
      const searchTerm = query.toLowerCase();
      
      return products.filter(product => 
        product.shortDescription?.toLowerCase().includes(searchTerm) ||
        product.longDescription?.toLowerCase().includes(searchTerm) ||
        product.brand?.toLowerCase().includes(searchTerm) ||
        product.category?.toLowerCase().includes(searchTerm) ||
        product.subcategory?.toLowerCase().includes(searchTerm) ||
        product.partNumber?.toLowerCase().includes(searchTerm)
      ).slice(0, 5); // Return top 5 matches
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  }
}

module.exports = DeepSeekChatbotService;
