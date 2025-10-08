// public/script.js
const API_URL = 'http://localhost:3000/api';

document.getElementById('questionInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        submitQuery();
    }
});

async function submitQuery() {
    const question = document.getElementById('questionInput').value.trim();
    
    if (!question) {
        alert('Please enter a question');
        return;
    }

    setLoading(true);
    hideError();
    hideResults();

    try {
        const response = await fetch(`${API_URL}/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ question })
        });

        const data = await response.json();
        
        // Debug: log the response
        console.log('API Response:', data);

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to get answer');
        }

        displayResults(data);

    } catch (error) {
        console.error('Error details:', error);
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

function displayResults(data) {
    try {
        // Display answer
        document.getElementById('answerContent').innerHTML = formatAnswer(data.answer || 'No answer provided');
        
        // Display metadata with safe access
        const metadata = data.metadata || {};
        document.getElementById('metadata').innerHTML = `
            <div class="metadata-item"><strong>Processing Time:</strong> ${data.processing_time_ms || 0}ms</div>
            <div class="metadata-item"><strong>Chunks Retrieved:</strong> ${metadata.total_retrieved || 0}</div>
            <div class="metadata-item"><strong>Sent to LLM:</strong> ${metadata.sent_to_llm || 0}</div>
            <div class="metadata-item"><strong>Model:</strong> ${metadata.model_used || 'N/A'}</div>
            <div class="metadata-item"><strong>Tokens Used:</strong> ${metadata.tokens_used || 0}</div>
        `;

        // Display all retrieved chunks
        const chunksContainer = document.getElementById('chunksContainer');
        const allChunks = data.all_chunks || [];
        
        if (allChunks.length === 0) {
            chunksContainer.innerHTML = '<p>No chunks retrieved</p>';
        } else {
            chunksContainer.innerHTML = allChunks.map(chunk => renderChunk(chunk)).join('');
        }

        // Display selected chunks
        const selectedContainer = document.getElementById('selectedContainer');
        const selectedChunks = data.selected_chunks || [];
        
        if (selectedChunks.length === 0) {
            selectedContainer.innerHTML = '<p>No chunks selected</p>';
        } else {
            selectedContainer.innerHTML = selectedChunks.map(chunk => renderChunk(chunk, true)).join('');
        }

        // Show results
        document.getElementById('resultsSection').classList.remove('hidden');
        
        // Scroll to results
        setTimeout(() => {
            document.getElementById('resultsSection').scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
        
    } catch (error) {
        console.error('Error displaying results:', error);
        showError('Error displaying results: ' + error.message);
    }
}

function renderChunk(chunk, isSelected = false) {
    try {
        // Safely access all properties with fallbacks
        const chunkIndex = chunk.chunk_index !== undefined ? chunk.chunk_index : 0;
        const content = chunk.content || 'No content';
        const selectedForLlm = chunk.selected_for_llm || false;
        
        // Safe number formatting
        const similarityScore = typeof chunk.similarity_score === 'number' 
            ? chunk.similarity_score.toFixed(3) 
            : 'N/A';
        const rerankScore = typeof chunk.rerank_score === 'number' 
            ? chunk.rerank_score.toFixed(3) 
            : 'N/A';
        
        const selectedClass = selectedForLlm ? 'selected' : '';
        
        return `
            <div class="chunk-card ${selectedClass}">
                <div class="chunk-header">
                    <span class="chunk-title">Chunk #${chunkIndex + 1}</span>
                    <div class="chunk-badges">
                        <span class="badge badge-similarity">
                            Similarity: ${similarityScore}
                        </span>
                        <span class="badge badge-rerank">
                            Rerank: ${rerankScore}
                        </span>
                        ${selectedForLlm ? '<span class="badge badge-selected">✓ Sent to LLM</span>' : ''}
                    </div>
                </div>
                <div class="chunk-content">${escapeHtml(content)}</div>
            </div>
        `;
    } catch (error) {
        console.error('Error rendering chunk:', error, chunk);
        return '<div class="chunk-card"><p>Error rendering chunk</p></div>';
    }
}

function formatAnswer(answer) {
    if (!answer) return '<p>No answer provided</p>';
    
    try {
        return answer
            .split('\n\n')
            .filter(para => para.trim().length > 0)
            .map(para => `<p>${escapeHtml(para.trim())}</p>`)
            .join('');
    } catch (error) {
        console.error('Error formatting answer:', error);
        return `<p>${escapeHtml(answer)}</p>`;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function setLoading(isLoading) {
    const btn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const loader = document.getElementById('btnLoader');
    
    btn.disabled = isLoading;
    btnText.classList.toggle('hidden', isLoading);
    loader.classList.toggle('hidden', !isLoading);
}

function showError(message) {
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorSection').classList.remove('hidden');
    
    // Scroll to error
    document.getElementById('errorSection').scrollIntoView({ 
        behavior: 'smooth' 
    });
}

function hideError() {
    document.getElementById('errorSection').classList.add('hidden');
}

function hideResults() {
    document.getElementById('resultsSection').classList.add('hidden');
}
