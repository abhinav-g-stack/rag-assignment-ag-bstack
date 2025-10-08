const { GoogleGenerativeAI } = require('@google/generative-ai');
const { CohereClient } = require('cohere-ai');
require('dotenv').config();

async function testAPIs() {
  console.log('\n=== Testing API Connections ===\n');
  
  // Test Gemini
  try {
    console.log('1. Testing Gemini API...');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Test embedding
    const embedModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const embedResult = await embedModel.embedContent('test');
    console.log('   ✓ Gemini Embeddings work');
    
    // Test generation
    const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const textResult = await textModel.generateContent('Say hi');
    console.log('   ✓ Gemini Generation works');
    console.log(`   Response: ${textResult.response.text()}`);
  } catch (error) {
    console.log('   ✗ Gemini failed:', error.message);
    return false;
  }
  
  // Test Cohere
  try {
    console.log('\n2. Testing Cohere API...');
    const cohere = new CohereClient({ token: process.env.COHERE_API_KEY });
    const result = await cohere.rerank({
      model: 'rerank-english-v3.0',
      query: 'test query',
      documents: ['doc 1', 'doc 2'],
      topN: 2
    });
    console.log('   ✓ Cohere Rerank works');
    console.log(`   Scored ${result.results.length} documents`);
  } catch (error) {
    console.log('   ✗ Cohere failed:', error.message);
    return false;
  }
  
  console.log('\n✅ All APIs working! Ready to proceed.\n');
  return true;
}

testAPIs().then(success => {
  process.exit(success ? 0 : 1);
});
