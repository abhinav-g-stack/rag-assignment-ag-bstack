// src/services/ingest.js
const pool = require('../config/database');
const PDFProcessor = require('./pdfProcessor');
const EmbeddingService = require('./embeddings');

class DocumentIngestor {
  constructor() {
    this.pdfProcessor = new PDFProcessor(800, 150);
    this.embeddingService = new EmbeddingService();
  }

  async ingestDocument(pdfPath) {
    console.log('=== Starting Document Ingestion ===');
    console.log(`PDF: ${pdfPath}`);

    try {
      console.log('\n[1/4] Processing PDF...');
      const { chunks, total_chunks } = await this.pdfProcessor.processPDF(pdfPath);

      console.log('\n[2/4] Generating embeddings...');
      const chunkTexts = chunks.map(c => c.content);
      const embeddings = await this.embeddingService.generateBatchEmbeddings(chunkTexts);

      console.log('\n[3/4] Clearing existing chunks...');
      await pool.query('DELETE FROM document_chunks');

      console.log('\n[4/4] Storing in database...');
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = embeddings[i];

        await pool.query(
          `INSERT INTO document_chunks (content, embedding, metadata, chunk_index)
           VALUES ($1, $2, $3, $4)`,
          [
            chunk.content,
            JSON.stringify(embedding),
            JSON.stringify(chunk.metadata),
            chunk.chunk_index
          ]
        );

        if ((i + 1) % 10 === 0) {
          console.log(`  Stored ${i + 1}/${total_chunks} chunks`);
        }
      }

      console.log('\nIngestion complete!');
      console.log(`Total chunks: ${total_chunks}`);
      console.log(`Total embeddings: ${embeddings.length}`);
      
      return {
        success: true,
        total_chunks,
        message: 'Document ingested successfully'
      };

    } catch (error) {
      console.error('Ingestion failed:', error);
      throw error;
    }
  }
}

module.exports = DocumentIngestor;
