const FallbackChatbotService = require('./services/fallbackChatbotService');

async function testChatbotResponses() {
  const chatbot = new FallbackChatbotService();
  
  console.log('Testing KillSwitch Chatbot - Updated Format\n');
  console.log('='.repeat(50));
  
  const testQueries = [
    'hi',
    'show me gaming keyboards',
    'what mice do you have?',
    'I need a case for my build',
    'help me build a gaming PC',
    'what are your prices?',
    'compatibility check',
    'performance recommendations'
  ];
  
  for (const query of testQueries) {
    console.log(`\nUser: ${query}`);
    console.log('-'.repeat(30));
    
    try {
      const response = await chatbot.generateResponse(query);
      console.log(`Bot: ${response}`);
      
      // Check for formatting issues
      if (response.includes('**') || response.includes('🎮') || response.includes('🔹')) {
        console.log('⚠️  WARNING: Response contains bold text or emojis!');
      }
      
      if (response.length > 500) {
        console.log(`⚠️  WARNING: Response is long (${response.length} chars)`);
      }
      
    } catch (error) {
      console.log(`Error: ${error.message}`);
    }
    
    console.log('='.repeat(50));
  }
}

// Run the test
testChatbotResponses().catch(console.error);
