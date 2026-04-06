// Script to list available Gemini models
const fetch = require('node-fetch');

const API_KEY = "AIzaSyC0dIdh_drN0BSyBpb5OZJMQmT53TmArLk";

async function listGeminiModels() {
  try {
    console.log('🔍 Fetching available Gemini models...\n');
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log('✅ Available models:');
    data.models?.forEach(model => {
      console.log(`- ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    });
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

listGeminiModels();
