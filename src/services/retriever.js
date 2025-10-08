// src/services/retriever.js
const pool = require('../config/database');
const EmbeddingService = require('./embeddings');

class Retriever {
  constructor() {
    this.embeddingService = new EmbeddingService();
    this.initialRetrievalCount = 20;
    this.finalChunkCount = 5;
  }

  async retrieveRelevantChunks(query) {
    console.log(`\n=== Retrieving chunks for query: "${query}" ===`);

    try {
      console.log('[1/3] Generating query embedding...');
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      console.log(`[2/3] Searching for top ${this.initialRetrievalCount} similar chunks...`);
      
      const searchQuery = `
        SELECT 
          id,
          content,
          chunk_index,
          metadata,
          1 - (embedding <=> $1::vector) AS similarity_score
        FROM document_chunks
        ORDER BY embedding <=> $1::vector
        LIMIT $2
      `;

      const result = await pool.query(searchQuery, [
        JSON.stringify(queryEmbedding),
        this.initialRetrievalCount
      ]);

      console.log(`✓ Retrieved ${result.rows.length} chunks`);

      const chunks = result.rows.map(row => ({
        id: row.id,
        content: row.content,
        chunk_index: row.chunk_index,
        similarity_score: parseFloat(row.similarity_score.toFixed(4)),
        metadata: row.metadata,
        selected_for_llm: false
      }));

      return chunks;

    } catch (error) {
      console.error('Retrieval error:', error);
      throw new Error(`Failed to retrieve chunks: ${error.message}`);
    }
  }

  selectTopChunks(chunks, count) {
    return chunks
      .sort((a, b) => b.rerank_score - a.rerank_score)
      .slice(0, count)
      .map(chunk => ({
        ...chunk,
        selected_for_llm: true
      }));
  }
}

module.exports = Retriever;
