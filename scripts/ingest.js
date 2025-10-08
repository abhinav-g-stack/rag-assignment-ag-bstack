// scripts/ingest.js
const path = require('path');
const DocumentIngestor = require('../src/services/ingest');

async function main() {
  // Check if PDF path is provided
  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.error('Usage: node scripts/ingest.js <path-to-pdf>');
    console.error('Example: node scripts/ingest.js ./uploads/sample.pdf');
    process.exit(1);
  }

  // Verify file exists
  const fs = require('fs');
  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: File not found at ${pdfPath}`);
    process.exit(1);
  }

  console.log('Starting document ingestion...');
  console.log(`PDF file: ${path.resolve(pdfPath)}`);
  
  const ingestor = new DocumentIngestor();
  
  try {
    const result = await ingestor.ingestDocument(pdfPath);
    console.log('\n' + '='.repeat(50));
    console.log('INGESTION COMPLETE');
    console.log('='.repeat(50));
    console.log(`Status: ${result.message}`);
    console.log(`Total chunks created: ${result.total_chunks}`);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ingestion failed:', error.message);
    process.exit(1);
  }
}

main();
