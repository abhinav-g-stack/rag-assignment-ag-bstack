// src/services/pdfProcessor.js
const fs = require('fs').promises;
const pdf = require('pdf-parse');

class PDFProcessor {
  constructor(chunkSize = 800, overlapSize = 150) {
    this.chunkSize = chunkSize;
    this.overlapSize = overlapSize;
  }

  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      
      console.log(`Extracted ${data.numpages} pages from PDF`);
      console.log(`Total text length: ${data.text.length} characters`);
      
      return data.text;
    } catch (error) {
      throw new Error(`PDF extraction failed: ${error.message}`);
    }
  }

  semanticChunk(text) {
    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const sentences = this.splitIntoSentences(cleanText);
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const sentenceLength = this.estimateTokens(sentence);

      if (currentLength + sentenceLength > this.chunkSize && currentChunk.length > 0) {
        const chunkText = currentChunk.join(' ').trim();
        chunks.push({
          content: chunkText,
          chunk_index: chunks.length,
          token_count: currentLength,
          metadata: {
            start_sentence: chunks.length * this.chunkSize,
            sentence_count: currentChunk.length
          }
        });

        const overlapSentences = this.getOverlapSentences(currentChunk);
        currentChunk = [...overlapSentences];
        currentLength = overlapSentences.reduce(
          (sum, s) => sum + this.estimateTokens(s), 0
        );
      }

      currentChunk.push(sentence);
      currentLength += sentenceLength;
    }

    if (currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.join(' ').trim(),
        chunk_index: chunks.length,
        token_count: currentLength,
        metadata: {
          start_sentence: chunks.length * this.chunkSize,
          sentence_count: currentChunk.length
        }
      });
    }

    console.log(`Created ${chunks.length} semantic chunks`);
    return chunks;
  }

  splitIntoSentences(text) {
    return text
      .replace(/([.!?])\s+([A-Z])/g, '$1|$2')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  getOverlapSentences(sentences) {
    let overlapTokens = 0;
    const overlapSentences = [];
    
    for (let i = sentences.length - 1; i >= 0; i--) {
      const tokens = this.estimateTokens(sentences[i]);
      if (overlapTokens + tokens <= this.overlapSize) {
        overlapSentences.unshift(sentences[i]);
        overlapTokens += tokens;
      } else {
        break;
      }
    }
    
    return overlapSentences;
  }

  estimateTokens(text) {
    return Math.ceil(text.split(/\s+/).length * 0.75);
  }

  async processPDF(filePath) {
    const text = await this.extractTextFromPDF(filePath);
    const chunks = this.semanticChunk(text);
    
    return {
      total_chunks: chunks.length,
      chunks: chunks,
      original_length: text.length
    };
  }
}

module.exports = PDFProcessor;
