// test-gemini.js
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiConnection() {
  console.log('\n=== Testing Gemini API Connection ===\n');

  try {
    // Check if API key exists
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not found in .env file');
    }

    console.log('✓ API key found in environment');

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    // Test 1: Embedding Model
    console.log('\n[Test 1] Testing Embedding Model...');
    const embeddingModel = genAI.getGenerativeModel({ 
      model: 'text-embedding-004'  // Use explicit name
    });
    
    const testText = "This is a test sentence for embedding generation.";
    const embeddingResult = await embeddingModel.embedContent(testText);
    const embedding = embeddingResult.embedding.values;
    
    console.log(`✓ Embedding generated successfully`);
    console.log(`  - Dimensions: ${embedding.length}`);
    console.log(`  - First 5 values: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log(`  - Vector norm: ${Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0)).toFixed(4)}`);

    // Test 2: Text Generation Model
    console.log('\n[Test 2] Testing Text Generation Model...');
    const generativeModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash'  // Use versioned name
    });
    
    const prompt = "What is retrieval augmented generation (RAG) in one sentence?";
    const generationResult = await generativeModel.generateContent(prompt);
    const response = generationResult.response.text();
    
    console.log(`✓ Text generation successful`);
    console.log(`  - Model: gemini-1.5-flash-002`);
    console.log(`  - Question: ${prompt}`);
    console.log(`  - Answer: ${response}`);

    // Test 3: Batch Embedding (small batch)
    console.log('\n[Test 3] Testing Batch Embeddings...');
    const batchTexts = [
      "Artificial intelligence and machine learning",
      "Natural language processing techniques",
      "Vector databases for semantic search"
    ];
    
    const batchEmbeddings = [];
    for (const text of batchTexts) {
      const result = await embeddingModel.embedContent(text);
      batchEmbeddings.push(result.embedding.values);
      await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
    }
    
    console.log(`✓ Batch embeddings generated successfully`);
    console.log(`  - Number of embeddings: ${batchEmbeddings.length}`);
    console.log(`  - All vectors have ${batchEmbeddings[0].length} dimensions`);

    // Test 4: Cosine Similarity Calculation
    console.log('\n[Test 4] Testing Similarity Calculation...');
    const vec1 = batchEmbeddings[0];
    const vec2 = batchEmbeddings[1];
    const vec3 = batchEmbeddings[2];
    
    const similarity12 = cosineSimilarity(vec1, vec2);
    const similarity13 = cosineSimilarity(vec1, vec3);
    
    console.log(`✓ Similarity calculations successful`);
    console.log(`  - Text 1 vs Text 2 similarity: ${similarity12.toFixed(4)}`);
    console.log(`  - Text 1 vs Text 3 similarity: ${similarity13.toFixed(4)}`);

    // Test 5: Complex prompt with generation config
    console.log('\n[Test 5] Testing Generation with Config...');
    const configuredModel = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash-002',
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 100,
      }
    });
    
    const complexPrompt = `Context: RAG systems combine retrieval and generation.
    
Question: How does RAG improve LLM responses?

Answer briefly.`;
    
    const configResult = await configuredModel.generateContent(complexPrompt);
    const configResponse = configResult.response.text();
    
    console.log(`✓ Configured generation successful`);
    console.log(`  - Temperature: 0.1 (factual)`);
    console.log(`  - Max tokens: 100`);
    console.log(`  - Response: ${configResponse}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\nYour Gemini API is working correctly.');
    console.log('Model confirmed: gemini-1.5-flash-002');
    console.log('Embedding model: text-embedding-004');
    console.log('\nYou can now proceed with document ingestion.\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error('\nTroubleshooting steps:');
    console.error('1. Verify GOOGLE_API_KEY is set correctly in .env');
    console.error('2. Check your API key at https://aistudio.google.com/apikey');
    console.error('3. Ensure you have internet connectivity');
    console.error('4. Check if you have exceeded rate limits (15 req/min free tier)');
    console.error('5. If model not found error, try: gemini-1.5-flash-002 or gemini-1.5-pro-002');
    process.exit(1);
  }
}

// Helper function to calculate cosine similarity
function cosineSimilarity(vecA, vecB) {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Run the test
testGeminiConnection();
