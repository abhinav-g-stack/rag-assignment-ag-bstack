// src/services/generator.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class Generator {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required in .env file');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.modelName = process.env.LLM_MODEL || 'gemini-2.5-flash';
    this.maxTokens = 2048;
    this.temperature = 0.1; // Low temperature for factual responses
  }

  async generateAnswer(query, selectedChunks) {
    console.log('\n=== Generating Answer ===');
    console.log(`Using ${selectedChunks.length} chunks with ${this.modelName}`);

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: {
          temperature: this.temperature,
          maxOutputTokens: this.maxTokens,
        }
      });

      const context = this.buildContext(selectedChunks);
      const prompt = this.buildPrompt(query, context);

      const result = await model.generateContent(prompt);
      const response = result.response;
      const answer = response.text();
      
      console.log('Answer generated successfully');

      // Get token usage if available
      const tokensUsed = response.usageMetadata ? 
        (response.usageMetadata.promptTokenCount + response.usageMetadata.candidatesTokenCount) : 
        Math.ceil((prompt.length + answer.length) / 4);

      return {
        answer: answer,
        model_used: this.modelName,
        tokens_used: tokensUsed,
        context_chunks: selectedChunks.length
      };

    } catch (error) {
      console.error('Generation error:', error);
      throw new Error(`Failed to generate answer: ${error.message}`);
    }
  }

  buildContext(chunks) {
    return chunks
      .map((chunk, index) => 
        `[Context ${index + 1}]\n${chunk.content}\n`
      )
      .join('\n---\n\n');
  }

  buildPrompt(query, context) {
    return `You are a helpful assistant that answers questions based strictly on the provided context.

INSTRUCTIONS:
1. Answer the user's question using ONLY information from the provided context
2. If the context doesn't contain enough information to answer, clearly state this
3. Be concise and direct in your responses
4. Use specific quotes or details from the context to support your answer
5. Do not make assumptions or add information not present in the context
6. If multiple contexts are relevant, synthesize information from them
7. Maintain a professional and informative tone

CONTEXT:
${context}

QUESTION:
${query}

Please answer the question based on the context provided above. If the context doesn't contain relevant information, explicitly state that.`;
  }
}

module.exports = Generator;
