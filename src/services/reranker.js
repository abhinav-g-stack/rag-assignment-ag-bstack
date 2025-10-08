// src/services/reranker.js
const { CohereClient } = require('cohere-ai');
require('dotenv').config();

class Reranker {
  constructor() {
    this.useCohere = !!process.env.COHERE_API_KEY;
    
    if (this.useCohere) {
      this.cohere = new CohereClient({
        token: process.env.COHERE_API_KEY,
      });
      this.model = 'rerank-english-v3.0';
    } else {
      console.warn('⚠ No COHERE_API_KEY found. Reranking will use similarity scores only.');
    }
  }

  async rerankChunks(query, chunks) {
    console.log(`[3/3] Reranking ${chunks.length} chunks...`);

    if (!this.useCohere) {
      console.log('⚠ Using similarity-based reranking (no Cohere API key)');
      return this.rerankBySimilarity(query, chunks);
    }

    try {
      // Prepare documents for Cohere Rerank API
      const documents = chunks.map(chunk => chunk.content);

      // Call Cohere Rerank API
      const reranked = await this.cohere.rerank({
        model: this.model,
        query: query,
        documents: documents,
        topN: chunks.length, // Get scores for all chunks
        returnDocuments: false // We already have the content
      });

      // Map rerank scores back to original chunks
      const rerankedChunks = reranked.results.map(result => {
        const originalChunk = chunks[result.index];
        return {
          ...originalChunk,
          rerank_score: parseFloat(result.relevanceScore.toFixed(4)),
          rerank_method: 'cohere_rerank_v3',
          original_similarity: originalChunk.similarity_score
        };
      });

      console.log(`✓ Reranking complete (Cohere Rerank v3)`);
      return rerankedChunks.sort((a, b) => b.rerank_score - a.rerank_score);

    } catch (error) {
      console.error('Cohere reranking error:', error.message);
      console.log('⚠ Falling back to similarity-based reranking');
      return this.rerankBySimilarity(query, chunks);
    }
  }

  // Fallback: Enhanced similarity-based reranking
  rerankBySimilarity(query, chunks) {
    const queryTerms = this.tokenize(query.toLowerCase());
    
    const rerankedChunks = chunks.map(chunk => {
      const chunkTerms = this.tokenize(chunk.content.toLowerCase());
      
      let score = chunk.similarity_score * 0.7; // Base similarity weight
      
      // Term frequency scoring with diminishing returns
      const termScores = queryTerms.map(term => {
        if (term.length <= 2) return 0;
        
        const tf = this.countOccurrences(chunkTerms, term);
        return Math.min(tf * 0.05, 0.15);
      });
      
      const keywordScore = termScores.reduce((sum, s) => sum + s, 0);
      score = Math.min(score + keywordScore, 1.0);
      
      return {
        ...chunk,
        rerank_score: parseFloat(score.toFixed(4)),
        rerank_method: 'similarity_with_keywords',
        original_similarity: chunk.similarity_score
      };
    });

    console.log(`✓ Reranking complete (keyword-enhanced similarity)`);
    return rerankedChunks.sort((a, b) => b.rerank_score - a.rerank_score);
  }

  tokenize(text) {
    return text.split(/\s+/).filter(t => t.length > 0);
  }

  countOccurrences(arr, item) {
    return arr.filter(x => x === item).length;
  }
}

module.exports = Reranker;
