// Paper List Rendering Module - arXiv CS Daily
class PaperListManager {
    constructor(containerSelector = '#paper-list', apiUrl = '/arxiv/papers') {
        this.container = document.querySelector(containerSelector);
        this.papersContainer = document.querySelector('#papers-container');
        this.loadingIndicator = document.querySelector('#loading-indicator');
        this.dataSourceIndicator = document.querySelector('#data-source-indicator');
        
        this.apiUrl = apiUrl;
        this.currentPage = 1;
        this.pageSize = 12;
        this.currentCategory = 'cs.AI'; // Default category
        this.papers = [];
        
        // Bind methods to maintain context
        this.init = this.init.bind(this);
        this.fetchPapers = this.fetchPapers.bind(this);
        this.renderPapers = this.renderPapers.bind(this);
        this.handleLoadMore = this.handleLoadMore.bind(this);
    }

    // Initialize the paper list manager
    async init() {
        // Set up event listeners and initial load
        this.setupLoadMoreButton();
        await this.fetchPapers();
    }

    // Setup load more button
    setupLoadMoreButton() {
        const loadMoreBtn = document.createElement('button');
        loadMoreBtn.classList.add('load-more-btn', 'mt-3');
        loadMoreBtn.textContent = 'Load More Papers';
        loadMoreBtn.addEventListener('click', this.handleLoadMore);
        this.container.appendChild(loadMoreBtn);
    }

    // Show loading spinner
    showLoadingSpinner() {
        this.loadingIndicator.classList.remove('d-none');
    }

    // Hide loading spinner
    hideLoadingSpinner() {
        this.loadingIndicator.classList.add('d-none');
    }

    // Handle load more button click
    async handleLoadMore() {
        this.currentPage++;
        await this.fetchPapers(true);
    }

    // Fetch papers with comprehensive error handling
    async fetchPapers(loadMore = false) {
        this.showLoadingSpinner();

        try {
            // Use ArXivAPI from api-utils.js
            const papers = await ArXivAPI.fetchPapers({
                category: this.currentCategory,
                maxResults: this.pageSize,
                start: (this.currentPage - 1) * this.pageSize
            });

            // Update papers list
            if (!loadMore) {
                this.papers = papers;
            } else {
                this.papers = [...this.papers, ...papers];
            }

            // Render papers
            this.renderPapers();

            // Update data source indicator
            this.updateDataSourceIndicator(papers);
        } catch (error) {
            console.error('Failed to fetch papers:', error);
            this.showErrorState(error);
        } finally {
            this.hideLoadingSpinner();
        }
    }

    // Render papers to the DOM
    renderPapers() {
        // Clear previous papers if not loading more
        if (this.currentPage === 1) {
            this.papersContainer.innerHTML = '';
        }

        // Create paper list container
        const paperList = document.createElement('div');
        paperList.classList.add('paper-list');

        // Render each paper
        this.papers.forEach(paper => {
            const paperCard = this.createPaperCard(paper);
            paperList.appendChild(paperCard);
        });

        // Append to container
        this.papersContainer.appendChild(paperList);
    }

    // Create paper card element
    createPaperCard(paper) {
        const card = document.createElement('div');
        card.classList.add('paper-card');

        // Truncate abstract if too long
        const truncateAbstract = (text, maxLength = 200) => 
            text.length > maxLength ? text.slice(0, maxLength) + '...' : text;

        card.innerHTML = `
            <h3 class="paper-card__title">${paper.title}</h3>
            <p class="paper-card__authors">${paper.authors.join(', ')}</p>
            <p class="paper-card__abstract">${truncateAbstract(paper.summary)}</p>
            <div class="paper-card__meta">
                <span class="paper-card__category">${paper.categories.join(', ')}</span>
                <span class="paper-card__date">${new Date(paper.published).toLocaleDateString()}</span>
            </div>
        `;

        // Add click event to show paper details
        card.addEventListener('click', () => {
            // Transform paper data to match modal expected format
            const paperData = {
                id: paper.id,
                title: paper.title,
                authors: paper.authors,
                abstract: paper.summary,
                year: new Date(paper.published).getFullYear(),
                pdfUrl: paper.links?.pdf || `https://arxiv.org/pdf/${paper.id}.pdf`,
                abstractUrl: paper.links?.abs || `https://arxiv.org/abs/${paper.id}`,
                categories: paper.categories
            };

            if (window.paperDetailModal) {
                window.paperDetailModal.open(paperData);
            }
        });

        return card;
    }

    // Show error state when paper fetch fails
    showErrorState(error) {
        this.papersContainer.innerHTML = `
            <div class="empty-state">
                <h3 class="empty-state__title">😕 Oops! Something went wrong</h3>
                <p>Unable to fetch papers. We're showing sample data.</p>
                <p class="text-muted">${error.message}</p>
            </div>
        `;
    }

    // Update data source indicator
    updateDataSourceIndicator(papers) {
        const isUsingAPI = papers.length > 0 && !papers[0]._isSampleData;
        this.dataSourceIndicator.textContent = isUsingAPI ? 'Live ArXiv Data' : 'Demo Mode';
        this.dataSourceIndicator.classList.toggle('bg-success', isUsingAPI);
    }
}

// Export for use in other modules
window.PaperListManager = PaperListManager;