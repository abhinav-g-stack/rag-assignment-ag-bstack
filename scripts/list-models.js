// scripts/list-models.js
require('dotenv').config();

async function listAvailableModels() {
  console.log('\n=== Fetching Available Gemini Models ===\n');
  
  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY not found in .env file');
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log('Fetching models from Google Gemini API...\n');

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.models || data.models.length === 0) {
      console.log('No models found.');
      return;
    }

    console.log(`Found ${data.models.length} models\n`);
    console.log('='.repeat(80));

    // Separate models by type
    const textModels = [];
    const embeddingModels = [];
    const visionModels = [];

    data.models.forEach(model => {
      const name = model.name.replace('models/', '');
      const actions = model.supportedGenerationMethods || [];
      
      const modelInfo = {
        name: name,
        displayName: model.displayName || name,
        description: model.description || 'No description',
        actions: actions,
        inputLimit: model.inputTokenLimit || 'N/A',
        outputLimit: model.outputTokenLimit || 'N/A'
      };

      if (actions.includes('generateContent')) {
        textModels.push(modelInfo);
      }
      if (actions.includes('embedContent')) {
        embeddingModels.push(modelInfo);
      }
    });

    // Display Text Generation Models
    console.log('\n📝 TEXT GENERATION MODELS (for LLM_MODEL):');
    console.log('='.repeat(80));
    textModels.forEach(model => {
      console.log(`\n✓ ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Description: ${model.description.substring(0, 80)}...`);
      console.log(`  Input Tokens: ${model.inputLimit}`);
      console.log(`  Output Tokens: ${model.outputLimit}`);
      console.log(`  Use in .env: LLM_MODEL=${model.name}`);
    });

    // Display Embedding Models
    console.log('\n\n🔢 EMBEDDING MODELS (for EMBEDDING_MODEL):');
    console.log('='.repeat(80));
    embeddingModels.forEach(model => {
      console.log(`\n✓ ${model.name}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Description: ${model.description.substring(0, 80)}...`);
      console.log(`  Use in .env: EMBEDDING_MODEL=${model.name}`);
    });

    // Provide recommendations
    console.log('\n\n💡 RECOMMENDED CONFIGURATION:');
    console.log('='.repeat(80));
    
    // Find the latest flash model
    const flashModels = textModels.filter(m => m.name.includes('flash'));
    const recommendedLLM = flashModels.length > 0 ? flashModels[0].name : textModels[0]?.name;
    
    const recommendedEmbed = embeddingModels.length > 0 ? embeddingModels[0].name : 'text-embedding-004';

    console.log('\nFor .env file:');
    console.log(`LLM_MODEL=${recommendedLLM}`);
    console.log(`EMBEDDING_MODEL=${recommendedEmbed}`);

    console.log('\n\n📋 ALL MODEL NAMES (comma-separated):');
    console.log('='.repeat(80));
    const allNames = data.models.map(m => m.name.replace('models/', ''));
    console.log(allNames.join(', '));

    console.log('\n\n✅ Model list retrieved successfully!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Verify your GOOGLE_API_KEY in .env');
    console.error('2. Check internet connectivity');
    console.error('3. Visit https://aistudio.google.com/apikey to verify your key');
    process.exit(1);
  }
}

listAvailableModels();
