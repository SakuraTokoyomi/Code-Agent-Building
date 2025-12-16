// Paper Detail Modal Management
class PaperDetailModal {
    constructor() {
        this.modal = null;
        this.currentPaper = null;
        this.initializeModal();
    }

    initializeModal() {
        // Create modal dynamically
        this.modal = document.createElement('div');
        this.modal.className = 'paper-detail-modal';
        this.modal.innerHTML = this.createModalTemplate();
        document.body.appendChild(this.modal);

        // Event Listeners
        this.modal.querySelector('.paper-detail-close').addEventListener('click', () => this.close());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('is-visible')) {
                this.close();
            }
        });

        // Citation type buttons
        const citationButtons = this.modal.querySelectorAll('.citation-button');
        citationButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchCitationType(btn.dataset.type));
        });

        // Copy citation buttons
        const copyCitationBtn = this.modal.querySelector('.copy-citation-btn');
        copyCitationBtn.addEventListener('click', () => this.copyCitation());
    }

    createModalTemplate() {
        return `
            <div class="paper-detail-modal-content">
                <button class="paper-detail-close" aria-label="Close">&times;</button>
                <div class="paper-detail-header">
                    <h2 class="paper-detail-title">Paper Title</h2>
                    <p class="paper-detail-authors">Authors</p>
                </div>
                <p class="paper-detail-abstract">Abstract</p>
                <div class="paper-detail-links">
                    <a href="#" class="paper-detail-link paper-pdf-link" target="_blank">View PDF</a>
                    <a href="#" class="paper-detail-link paper-abstract-link" target="_blank">arXiv Abstract</a>
                </div>
                <div class="citation-section">
                    <div class="citation-type">
                        <button class="citation-button active" data-type="bibtex">BibTeX</button>
                        <button class="citation-button" data-type="apa">APA</button>
                    </div>
                    <pre class="citation-text">Citation will appear here</pre>
                    <button class="copy-citation-btn">Copy Citation</button>
                </div>
            </div>
        `;
    }

    open(paperData) {
        if (!paperData) {
            console.error('No paper data provided');
            return;
        }

        this.currentPaper = paperData;
        
        // Update modal content
        const modalContent = this.modal.querySelector('.paper-detail-modal-content');
        modalContent.querySelector('.paper-detail-title').textContent = paperData.title || 'Untitled Paper';
        modalContent.querySelector('.paper-detail-authors').textContent = 
            (paperData.authors || ['Unknown Author']).join(', ');
        modalContent.querySelector('.paper-detail-abstract').textContent = 
            paperData.abstract || 'No abstract available.';

        // Update links
        const pdfLink = modalContent.querySelector('.paper-pdf-link');
        const abstractLink = modalContent.querySelector('.paper-abstract-link');
        
        pdfLink.href = paperData.pdfUrl || '#';
        abstractLink.href = paperData.abstractUrl || '#';

        // Generate initial citation
        this.switchCitationType('bibtex');

        // Show modal
        this.modal.classList.add('is-visible');
    }

    close() {
        this.modal.classList.remove('is-visible');
        this.currentPaper = null;
    }

    switchCitationType(type) {
        if (!this.currentPaper) return;

        const citationButtons = this.modal.querySelectorAll('.citation-button');
        const citationText = this.modal.querySelector('.citation-text');

        // Reset active states
        citationButtons.forEach(btn => btn.classList.remove('active'));
        this.modal.querySelector(`[data-type="${type}"]`).classList.add('active');

        // Generate citation
        const citation = this.generateCitation(type);
        citationText.textContent = citation;
    }

    generateCitation(type) {
        const paper = this.currentPaper;
        
        if (type === 'bibtex') {
            return this.generateBibTeXCitation(paper);
        } else if (type === 'apa') {
            return this.generateAPACitation(paper);
        }
    }

    generateBibTeXCitation(paper) {
        const authors = paper.authors ? paper.authors.join(' and ') : 'Unknown Author';
        const year = paper.year || new Date().getFullYear();
        const title = paper.title || 'Untitled Paper';
        const id = paper.id || 'unknown';

        return `@article{${id},
    author = {${authors}},
    title = {${title}},
    year = {${year}},
    archivePrefix = {arXiv},
    eprint = {${id}}
}`;
    }

    generateAPACitation(paper) {
        const authors = paper.authors 
            ? (paper.authors.length > 1 
                ? paper.authors.slice(0, -1).join(', ') + ', & ' + paper.authors[paper.authors.length - 1]
                : paper.authors[0])
            : 'Unknown Author';
        const year = paper.year || new Date().getFullYear();
        const title = paper.title || 'Untitled Paper';

        return `${authors} (${year}). ${title}. arXiv preprint arXiv:${paper.id || 'unknown'}.`;
    }

    copyCitation() {
        const citationText = this.modal.querySelector('.citation-text');
        
        try {
            navigator.clipboard.writeText(citationText.textContent).then(() => {
                const copyBtn = this.modal.querySelector('.copy-citation-btn');
                copyBtn.textContent = 'Copied!';
                copyBtn.style.backgroundColor = '#28a745';
                
                setTimeout(() => {
                    copyBtn.textContent = 'Copy Citation';
                    copyBtn.style.backgroundColor = '';
                }, 2000);
            });
        } catch (err) {
            console.error('Failed to copy citation:', err);
            alert('Failed to copy citation. Please copy manually.');
        }
    }

    // Static method to create a sample paper for testing/fallback
    static createSamplePaper() {
        return {
            id: '2306.12345',
            title: 'Sample Research Paper on AI and Machine Learning',
            authors: ['Jane Doe', 'John Smith', 'Alice Johnson'],
            abstract: 'This is a sample abstract demonstrating the paper detail modal functionality. The research explores advanced techniques in artificial intelligence and machine learning, providing insights into novel algorithmic approaches.',
            year: 2023,
            pdfUrl: 'https://arxiv.org/pdf/2306.12345.pdf',
            abstractUrl: 'https://arxiv.org/abs/2306.12345'
        };
    }
}

// Initialize the modal when the script loads
document.addEventListener('DOMContentLoaded', () => {
    window.paperDetailModal = new PaperDetailModal();
});