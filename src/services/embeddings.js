// src/services/embeddings.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class EmbeddingService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required in .env file');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = process.env.EMBEDDING_MODEL || 'text-embedding-004';
    this.dimensions = 768; // Gemini embedding dimensions
    this.batchSize = 50; // Process in smaller batches
  }

  async generateEmbedding(text) {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });
      const result = await model.embedContent(text);
      
      return result.embedding.values;
    } catch (error) {
      console.error('Embedding generation error:', error.message);
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
  }

  async generateBatchEmbeddings(texts) {
    const embeddings = [];
    
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      console.log(`Processing embeddings ${i + 1} to ${Math.min(i + this.batchSize, texts.length)} of ${texts.length}`);
      
      try {
        // Process each item in batch
        for (const text of batch) {
          const model = this.genAI.getGenerativeModel({ model: this.model });
          const result = await model.embedContent(text);
          embeddings.push(result.embedding.values);
          
          // Small delay to respect rate limits
          await this.sleep(50);
        }
        
        // Longer delay between batches
        if (i + this.batchSize < texts.length) {
          await this.sleep(200);
        }
      } catch (error) {
        console.error(`Batch embedding error at index ${i}:`, error.message);
        throw error;
      }
    }

    console.log(`✓ Generated ${embeddings.length} embeddings`);
    return embeddings;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getDimensions() {
    return this.dimensions;
  }
}

module.exports = EmbeddingService;
