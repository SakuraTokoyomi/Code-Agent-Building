// Category Navigation System
class CategoryNavigationManager {
    constructor() {
        // Computer Science Categories with their arXiv codes
        this.CS_CATEGORIES = [
            { code: 'cs.AI', name: 'Artificial Intelligence' },
            { code: 'cs.CL', name: 'Computational Linguistics' },
            { code: 'cs.CV', name: 'Computer Vision' },
            { code: 'cs.DS', name: 'Data Structures' },
            { code: 'cs.LG', name: 'Machine Learning' },
            { code: 'cs.NE', name: 'Neural and Evolutionary Computing' },
            { code: 'cs.PL', name: 'Programming Languages' },
            { code: 'cs.RO', name: 'Robotics' },
            { code: 'cs.SE', name: 'Software Engineering' }
        ];

        // DOM Elements
        this.categoryNavigation = document.getElementById('category-navigation');
        this.dataSourceIndicator = document.getElementById('data-source-indicator');
    }

    // Initialize Category Navigation
    init() {
        this.initCategoryNavigation();
        this.updateDataSourceStatus();
    }

    initCategoryNavigation() {
        // Clear existing navigation
        this.categoryNavigation.innerHTML = '';

        // Generate navigation tabs dynamically
        this.CS_CATEGORIES.forEach((category, index) => {
            const navItem = document.createElement('li');
            navItem.classList.add('nav-item');

            const navLink = document.createElement('a');
            navLink.href = `#${category.code}`;
            navLink.classList.add('nav-link');
            navLink.dataset.categoryCode = category.code;
            navLink.textContent = category.name;

            // Set first category as active by default
            if (index === 0) {
                navLink.classList.add('active');
            }

            // Add click event listener
            navLink.addEventListener('click', (e) => this.handleCategorySelection(e));

            navItem.appendChild(navLink);
            this.categoryNavigation.appendChild(navItem);
        });

        // Restore last selected category from localStorage
        this.restoreLastSelectedCategory();
    }

    // Handle Category Selection
    handleCategorySelection(event) {
        event.preventDefault();

        // Remove active class from all tabs
        document.querySelectorAll('#category-navigation .nav-link').forEach(tab => {
            tab.classList.remove('active');
        });

        // Add active class to clicked tab
        event.target.classList.add('active');

        // Store selected category in localStorage
        localStorage.setItem('lastSelectedCategory', event.target.dataset.categoryCode);

        // Trigger paper list update for selected category
        window.dispatchEvent(new CustomEvent('categoryChanged', {
            detail: { category: event.target.dataset.categoryCode }
        }));
    }

    // Restore Last Selected Category
    restoreLastSelectedCategory() {
        const lastCategory = localStorage.getItem('lastSelectedCategory');

        if (lastCategory) {
            const categoryTab = document.querySelector(`[data-category-code="${lastCategory}"]`);

            if (categoryTab) {
                // Remove active from all tabs
                document.querySelectorAll('#category-navigation .nav-link').forEach(tab => {
                    tab.classList.remove('active');
                });

                // Set stored category as active
                categoryTab.classList.add('active');
            }
        }
    }

    // Simulate API/Data Source Status
    updateDataSourceStatus() {
        // In a real app, this would check actual API connectivity
        const isLiveData = false;  // Default to demo mode

        this.dataSourceIndicator.textContent = isLiveData ? 'Live Data' : 'Demo Mode';
        this.dataSourceIndicator.classList.remove('bg-warning', 'bg-success');
        this.dataSourceIndicator.classList.add(isLiveData ? 'bg-success' : 'bg-warning');
    }
}

// Expose for other modules
window.CategoryNavigationManager = CategoryNavigationManager;