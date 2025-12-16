/**
 * Category Manager for arXiv CS Daily
 * Handles category navigation, active state tracking, and query parameter management
 */

class CategoryManager {
    constructor() {
        this.categories = [
            { code: 'cs.*', name: 'All CS', display: 'All Computer Science' },
            { code: 'cs.AI', name: 'AI', display: 'Artificial Intelligence' },
            { code: 'cs.CV', name: 'CV', display: 'Computer Vision' },
            { code: 'cs.LG', name: 'LG', display: 'Machine Learning' },
            { code: 'cs.CL', name: 'CL', display: 'Computation & Language' },
            { code: 'cs.RO', name: 'RO', display: 'Robotics' },
            { code: 'cs.DB', name: 'DB', display: 'Databases' },
            { code: 'cs.SE', name: 'SE', display: 'Software Engineering' },
            { code: 'cs.NE', name: 'NE', display: 'Neural & Evolutionary' },
            { code: 'cs.TH', name: 'TH', display: 'Theoretical CS' },
            { code: 'cs.SY', name: 'SY', display: 'Systems & Control' }
        ];
        
        this.currentCategory = 'cs.*';
        this.currentDisplayName = 'All Computer Science';
        this.resultCount = 0;
        this.onCategoryChange = null;
        
        // Initialize from URL hash if present
        this.initFromHash();
    }
    
    /**
     * Initialize category from URL hash
     */
    initFromHash() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#list')) {
            const params = new URLSearchParams(hash.substring(6));
            const category = params.get('cat');
            if (category && this.categories.some(cat => cat.code === category)) {
                this.currentCategory = category;
                const catInfo = this.categories.find(cat => cat.code === category);
                this.currentDisplayName = catInfo ? catInfo.display : 'All Computer Science';
            }
        }
    }
    
    /**
     * Render category navigation buttons
     * @param {string} containerId - ID of the container element
     */
    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with ID "${containerId}" not found`);
            return;
        }
        
        container.innerHTML = '';
        
        // Create category buttons container
        const navContainer = document.createElement('div');
        navContainer.className = 'category-nav-container';
        
        // Create category buttons
        this.categories.forEach(category => {
            const button = this.createCategoryButton(category);
            navContainer.appendChild(button);
        });
        
        container.appendChild(navContainer);
        
        // Create info display area
        const infoContainer = document.createElement('div');
        infoContainer.className = 'category-info-container mt-3';
        infoContainer.id = 'category-info';
        container.appendChild(infoContainer);
        
        // Update info display
        this.updateInfoDisplay();
        
        // Add event listeners
        this.attachEventListeners();
    }
    
    /**
     * Create a category button element
     * @param {Object} category - Category object
     * @returns {HTMLElement} Button element
     */
    createCategoryButton(category) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = `btn category-btn ${category.code === this.currentCategory ? 'active' : ''}`;
        button.dataset.category = category.code;
        button.dataset.displayName = category.display;
        
        // Create button content
        const codeSpan = document.createElement('span');
        codeSpan.className = 'category-code';
        codeSpan.textContent = category.name;
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'category-name d-none d-md-inline';
        nameSpan.textContent = category.display;
        
        button.appendChild(codeSpan);
        button.appendChild(nameSpan);
        
        return button;
    }
    
    /**
     * Attach event listeners to category buttons
     */
    attachEventListeners() {
        const buttons = document.querySelectorAll('.category-btn');
        buttons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.handleCategoryClick(e);
            });
        });
    }
    
    /**
     * Handle category button click
     * @param {Event} event - Click event
     */
    handleCategoryClick(event) {
        const button = event.currentTarget;
        const categoryCode = button.dataset.category;
        const displayName = button.dataset.displayName;
        
        // Update active state
        this.updateActiveState(categoryCode);
        
        // Update current category
        this.currentCategory = categoryCode;
        this.currentDisplayName = displayName;
        
        // Reset pagination (start=0)
        this.resetPagination();
        
        // Update URL hash for bookmarking
        this.updateUrlHash();
        
        // Update info display
        this.updateInfoDisplay();
        
        // Show loading indicator
        this.showLoading();
        
        // Notify listeners about category change
        if (this.onCategoryChange && typeof this.onCategoryChange === 'function') {
            this.onCategoryChange(categoryCode, displayName);
        }
    }
    
    /**
     * Update active state of category buttons
     * @param {string} activeCategory - Code of the active category
     */
    updateActiveState(activeCategory) {
        const buttons = document.querySelectorAll('.category-btn');
        buttons.forEach(button => {
            if (button.dataset.category === activeCategory) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
    
    /**
     * Reset pagination to start=0
     */
    resetPagination() {
        // This will be used by the main app to reset pagination
        // The actual implementation depends on the pagination system
        console.log('Category changed - resetting pagination to start=0');
        
        // Dispatch custom event for pagination reset
        const event = new CustomEvent('categoryChange', {
            detail: {
                category: this.currentCategory,
                start: 0
            }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Update URL hash for bookmarking
     */
    updateUrlHash() {
        const params = new URLSearchParams();
        params.set('cat', this.currentCategory);
        params.set('start', '0');
        
        // Update URL hash without triggering page reload
        window.history.pushState(
            null,
            '',
            `#list?${params.toString()}`
        );
    }
    
    /**
     * Update category info display
     */
    updateInfoDisplay() {
        const infoContainer = document.getElementById('category-info');
        if (!infoContainer) return;
        
        infoContainer.innerHTML = `
            <div class="category-info-card">
                <h4 class="category-title">
                    <span class="category-badge">${this.currentCategory}</span>
                    ${this.currentDisplayName}
                </h4>
                <div class="category-stats">
                    <span class="result-count">
                        <i class="bi bi-file-text"></i>
                        <span id="category-result-count">${this.resultCount.toLocaleString()}</span> papers
                    </span>
                    <span class="data-source-indicator" id="data-source-indicator">
                        <i class="bi bi-cloud-check"></i> Live Data
                    </span>
                </div>
            </div>
        `;
    }
    
    /**
     * Update result count display
     * @param {number} count - Number of results
     */
    updateResultCount(count) {
        this.resultCount = count;
        
        const countElement = document.getElementById('category-result-count');
        if (countElement) {
            countElement.textContent = count.toLocaleString();
        }
    }
    
    /**
     * Update data source indicator
     * @param {string} source - Data source: 'live', 'cached', or 'sample'
     */
    updateDataSource(source) {
        const indicator = document.getElementById('data-source-indicator');
        if (!indicator) return;
        
        let icon, text, className;
        
        switch (source) {
            case 'live':
                icon = 'bi-cloud-check';
                text = 'Live Data';
                className = 'data-source-live';
                break;
            case 'cached':
                icon = 'bi-device-ssd';
                text = 'Cached Data';
                className = 'data-source-cached';
                break;
            case 'sample':
                icon = 'bi-file-earmark-text';
                text = 'Sample Data';
                className = 'data-source-sample';
                break;
            default:
                icon = 'bi-question-circle';
                text = 'Unknown Source';
                className = 'data-source-unknown';
        }
        
        indicator.innerHTML = `<i class="bi ${icon}"></i> ${text}`;
        indicator.className = `data-source-indicator ${className}`;
    }
    
    /**
     * Show loading indicator
     */
    showLoading() {
        const infoContainer = document.getElementById('category-info');
        if (!infoContainer) return;
        
        const loadingHtml = `
            <div class="category-info-card">
                <h4 class="category-title">
                    <span class="category-badge">${this.currentCategory}</span>
                    ${this.currentDisplayName}
                </h4>
                <div class="category-stats">
                    <div class="loading-indicator">
                        <div class="spinner-border spinner-border-sm" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        <span class="ms-2">Loading papers...</span>
                    </div>
                </div>
            </div>
        `;
        
        infoContainer.innerHTML = loadingHtml;
    }
    
    /**
     * Get current category code
     * @returns {string} Current category code
     */
    getCurrentCategory() {
        return this.currentCategory;
    }
    
    /**
     * Get current category display name
     * @returns {string} Current category display name
     */
    getCurrentDisplayName() {
        return this.currentDisplayName;
    }
    
    /**
     * Get category by code
     * @param {string} code - Category code
     * @returns {Object|null} Category object or null
     */
    getCategoryByCode(code) {
        return this.categories.find(cat => cat.code === code) || null;
    }
    
    /**
     * Get all categories
     * @returns {Array} Array of category objects
     */
    getAllCategories() {
        return this.categories;
    }
    
    /**
     * Set category change callback
     * @param {Function} callback - Function to call when category changes
     */
    setCategoryChangeCallback(callback) {
        this.onCategoryChange = callback;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CategoryManager;
}