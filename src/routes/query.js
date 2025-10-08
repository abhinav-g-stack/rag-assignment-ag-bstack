// src/routes/query.js
const express = require('express');
const router = express.Router();
const Retriever = require('../services/retriever');
const Reranker = require('../services/reranker');
const Generator = require('../services/generator');

// Initialize services
const retriever = new Retriever();
const reranker = new Reranker();
const generator = new Generator();

// POST /api/query - Main RAG endpoint
router.post('/query', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { question } = req.body;

    // Validate input
    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        error: 'Question is required',
        success: false
      });
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`NEW QUERY: "${question}"`);
    console.log('='.repeat(60));

    // Step 1: Retrieve relevant chunks using vector similarity
    const retrievedChunks = await retriever.retrieveRelevantChunks(question);

    if (retrievedChunks.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No relevant information found in the document',
        all_chunks: [],
        selected_chunks: [],
        answer: null
      });
    }

    // Step 2: Rerank chunks using cross-encoder
    const rerankedChunks = await reranker.rerankChunks(question, retrievedChunks);

    // Step 3: Select top chunks for LLM context
    const topChunks = retriever.selectTopChunks(
      rerankedChunks, 
      retriever.finalChunkCount
    );

    // Step 4: Generate answer using LLM
    const result = await generator.generateAnswer(question, topChunks);

    // Calculate processing time
    const processingTime = Date.now() - startTime;

    // Prepare response with all metadata
    const response = {
      success: true,
      question: question,
      answer: result.answer,
      processing_time_ms: processingTime,
      
      // All retrieved chunks with their scores
      all_chunks: rerankedChunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        chunk_index: chunk.chunk_index,
        similarity_score: chunk.similarity_score,
        rerank_score: chunk.rerank_score,
        selected_for_llm: chunk.selected_for_llm || false
      })),
      
      // Only the chunks sent to LLM
      selected_chunks: topChunks.map(chunk => ({
        id: chunk.id,
        content: chunk.content,
        chunk_index: chunk.chunk_index,
        rerank_score: chunk.rerank_score
      })),
      
      metadata: {
        total_retrieved: retrievedChunks.length,
        total_reranked: rerankedChunks.length,
        sent_to_llm: topChunks.length,
        model_used: result.model_used,
        tokens_used: result.tokens_used
      }
    };

    console.log(`\n✓ Query completed in ${processingTime}ms`);
    console.log('='.repeat(60));

    res.json(response);

  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      all_chunks: [],
      selected_chunks: [],
      answer: null
    });
  }
});

// GET /api/health - Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
});

module.exports = router;
