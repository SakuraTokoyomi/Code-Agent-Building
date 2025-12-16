/**
 * LoadingManager - Manages loading states, spinners, and progress indicators
 * Provides visual feedback during data fetching and processing
 */

class LoadingManager {
    constructor() {
        this.loadingStates = new Map();
        this.progressBars = new Map();
        this.loadingContainer = null;
        this.progressContainer = null;
        this.activeLoaders = 0;
        this.minDisplayTime = 500; // Minimum time to show loading (ms)
        this.startTime = null;
        
        this.initContainers();
        this.setupGlobalLoadingHandler();
    }
    
    /**
     * Initialize loading containers in DOM
     */
    initContainers() {
        // Create main loading overlay if it doesn't exist
        if (!$('#loading-overlay').length) {
            $('body').append(`
                <div id="loading-overlay" class="loading-overlay" style="display: none;">
                    <div class="loading-content">
                        <div class="spinner-container">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Loading...</span>
                            </div>
                        </div>
                        <div class="loading-message">Loading...</div>
                        <div class="progress mt-3" style="display: none;">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                 role="progressbar" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            `);
        }
        
        // Create progress bar container for specific operations
        if (!$('#progress-container').length) {
            $('body').append(`
                <div id="progress-container" class="progress-container" style="display: none;">
                    <div class="progress-content">
                        <div class="progress-info">
                            <span class="progress-title"></span>
                            <span class="progress-percentage">0%</span>
                        </div>
                        <div class="progress">
                            <div class="progress-bar progress-bar-striped progress-bar-animated" 
                                 role="progressbar" style="width: 0%"></div>
                        </div>
                        <div class="progress-details"></div>
                    </div>
                </div>
            `);
        }
        
        this.loadingContainer = $('#loading-overlay');
        this.progressContainer = $('#progress-container');
    }
    
    /**
     * Setup global loading handler for AJAX requests
     */
    setupGlobalLoadingHandler() {
        const self = this;
        
        // Track active AJAX requests
        let activeRequests = 0;
        
        $(document).ajaxStart(function() {
            activeRequests++;
            if (activeRequests === 1) {
                self.showLoading('Fetching data from arXiv...');
            }
        });
        
        $(document).ajaxStop(function() {
            activeRequests--;
            if (activeRequests === 0) {
                self.hideLoading();
            }
        });
        
        $(document).ajaxError(function(event, xhr, settings, error) {
            // Error handling is done by ErrorHandler
            // Just ensure loading is hidden
            self.hideLoading();
        });
    }
    
    /**
     * Show loading overlay
     * @param {string} message - Loading message to display
     * @param {boolean} showProgress - Whether to show progress bar
     * @returns {string} Loader ID for tracking
     */
    showLoading(message = 'Loading...', showProgress = false) {
        const loaderId = 'loader-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        this.loadingStates.set(loaderId, {
            message: message,
            showProgress: showProgress,
            startTime: Date.now(),
            isComplete: false
        });
        
        this.activeLoaders++;
        
        // Update UI
        this.loadingContainer.find('.loading-message').text(message);
        
        if (showProgress) {
            this.loadingContainer.find('.progress').show();
        } else {
            this.loadingContainer.find('.progress').hide();
        }
        
        // Show loading overlay with fade animation
        if (this.activeLoaders === 1) {
            this.startTime = Date.now();
            this.loadingContainer.fadeIn(200);
        }
        
        this.log(`Loading started: ${message}`, loaderId);
        return loaderId;
    }
    
    /**
     * Hide loading overlay
     * @param {string} loaderId - Optional specific loader ID to complete
     */
    hideLoading(loaderId = null) {
        if (loaderId) {
            // Complete specific loader
            if (this.loadingStates.has(loaderId)) {
                const loader = this.loadingStates.get(loaderId);
                loader.isComplete = true;
                this.loadingStates.set(loaderId, loader);
                this.activeLoaders--;
                this.log(`Loader completed: ${loaderId}`, loaderId);
            }
        } else {
            // Complete all loaders
            this.activeLoaders = 0;
            this.loadingStates.clear();
        }
        
        // Only hide if no active loaders remain
        if (this.activeLoaders <= 0) {
            // Ensure minimum display time
            const elapsed = Date.now() - this.startTime;
            const remaining = Math.max(0, this.minDisplayTime - elapsed);
            
            if (remaining > 0) {
                setTimeout(() => {
                    this.loadingContainer.fadeOut(200);
                }, remaining);
            } else {
                this.loadingContainer.fadeOut(200);
            }
            
            this.log('All loading completed', 'global');
        }
    }
    
    /**
     * Show progress bar for specific operation
     * @param {string} title - Progress bar title
     * @param {string} details - Additional details
     * @returns {string} Progress ID for tracking
     */
    showProgress(title = 'Processing...', details = '') {
        const progressId = 'progress-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        this.progressBars.set(progressId, {
            title: title,
            details: details,
            progress: 0,
            startTime: Date.now(),
            isComplete: false
        });
        
        // Update UI
        this.progressContainer.find('.progress-title').text(title);
        this.progressContainer.find('.progress-details').text(details);
        this.updateProgressBar(0);
        
        // Show progress container
        this.progressContainer.fadeIn(200);
        
        this.log(`Progress started: ${title}`, progressId);
        return progressId;
    }
    
    /**
     * Update progress bar
     * @param {number} percentage - Progress percentage (0-100)
     * @param {string} progressId - Progress ID to update
     * @param {string} details - Updated details (optional)
     */
    updateProgress(percentage, progressId, details = null) {
        if (!this.progressBars.has(progressId)) {
            this.log(`Progress ID not found: ${progressId}`, 'warn');
            return;
        }
        
        const progress = this.progressBars.get(progressId);
        progress.progress = Math.min(100, Math.max(0, percentage));
        
        if (details !== null) {
            progress.details = details;
        }
        
        this.progressBars.set(progressId, progress);
        
        // Update UI
        this.updateProgressBar(progress.progress);
        this.progressContainer.find('.progress-percentage').text(`${Math.round(progress.progress)}%`);
        
        if (details !== null) {
            this.progressContainer.find('.progress-details').text(details);
        }
        
        // Log progress every 25% or when complete
        if (progress.progress % 25 === 0 || progress.progress === 100) {
            this.log(`Progress: ${progress.progress}% - ${progress.title}`, progressId);
        }
    }
    
    /**
     * Update progress bar element
     * @param {number} percentage - Progress percentage
     */
    updateProgressBar(percentage) {
        const progressBar = this.progressContainer.find('.progress-bar');
        progressBar.css('width', `${percentage}%`);
        
        // Update aria attributes for accessibility
        progressBar.attr('aria-valuenow', percentage);
    }
    
    /**
     * Hide progress bar
     * @param {string} progressId - Progress ID to complete
     * @param {boolean} success - Whether operation was successful
     */
    hideProgress(progressId, success = true) {
        if (!this.progressBars.has(progressId)) {
            this.log(`Progress ID not found for completion: ${progressId}`, 'warn');
            return;
        }
        
        const progress = this.progressBars.get(progressId);
        progress.isComplete = true;
        progress.endTime = Date.now();
        progress.success = success;
        
        // Update to 100% if not already
        if (progress.progress < 100) {
            this.updateProgress(100, progressId, success ? 'Complete' : 'Failed');
        }
        
        // Calculate duration
        const duration = progress.endTime - progress.startTime;
        this.log(`Progress completed: ${progress.title} (${duration}ms, success: ${success})`, progressId);
        
        // Remove from tracking
        this.progressBars.delete(progressId);
        
        // Hide container if no progress bars remain
        if (this.progressBars.size === 0) {
            // Brief delay to show completion
            setTimeout(() => {
                this.progressContainer.fadeOut(200, () => {
                    // Reset for next use
                    this.updateProgressBar(0);
                    this.progressContainer.find('.progress-percentage').text('0%');
                    this.progressContainer.find('.progress-details').text('');
                });
            }, 500);
        }
    }
    
    /**
     * Show skeleton loading for content areas
     * @param {string} containerSelector - CSS selector for container
     * @param {number} count - Number of skeleton items to show
     * @param {string} type - Type of skeleton (card, list, detail)
     */
    showSkeleton(containerSelector, count = 5, type = 'card') {
        const container = $(containerSelector);
        if (!container.length) return;
        
        // Clear existing content
        container.empty();
        
        let skeletonHtml = '';
        
        switch(type) {
            case 'card':
                for (let i = 0; i < count; i++) {
                    skeletonHtml += `
                        <div class="card skeleton-card mb-3">
                            <div class="card-body">
                                <div class="skeleton-title"></div>
                                <div class="skeleton-meta">
                                    <div class="skeleton-author"></div>
                                    <div class="skeleton-date"></div>
                                </div>
                                <div class="skeleton-abstract"></div>
                                <div class="skeleton-categories">
                                    <div class="skeleton-badge"></div>
                                    <div class="skeleton-badge"></div>
                                </div>
                            </div>
                        </div>
                    `;
                }
                break;
                
            case 'list':
                for (let i = 0; i < count; i++) {
                    skeletonHtml += `
                        <li class="list-group-item skeleton-list-item">
                            <div class="skeleton-list-title"></div>
                            <div class="skeleton-list-meta">
                                <div class="skeleton-list-author"></div>
                                <div class="skeleton-list-date"></div>
                            </div>
                        </li>
                    `;
                }
                break;
                
            case 'detail':
                skeletonHtml = `
                    <div class="skeleton-detail">
                        <div class="skeleton-detail-title"></div>
                        <div class="skeleton-detail-authors">
                            <div class="skeleton-detail-author"></div>
                            <div class="skeleton-detail-author"></div>
                        </div>
                        <div class="skeleton-detail-meta">
                            <div class="skeleton-detail-date"></div>
                            <div class="skeleton-detail-id"></div>
                        </div>
                        <div class="skeleton-detail-abstract"></div>
                        <div class="skeleton-detail-abstract"></div>
                        <div class="skeleton-detail-abstract"></div>
                        <div class="skeleton-detail-categories">
                            <div class="skeleton-detail-badge"></div>
                            <div class="skeleton-detail-badge"></div>
                            <div class="skeleton-detail-badge"></div>
                        </div>
                    </div>
                `;
                break;
        }
        
        container.html(skeletonHtml);
        container.addClass('skeleton-loading');
        
        this.log(`Skeleton shown for ${containerSelector} (${count} ${type}s)`, 'skeleton');
    }
    
    /**
     * Hide skeleton loading
     * @param {string} containerSelector - CSS selector for container
     */
    hideSkeleton(containerSelector) {
        const container = $(containerSelector);
        if (!container.length) return;
        
        container.removeClass('skeleton-loading');
        this.log(`Skeleton hidden for ${containerSelector}`, 'skeleton');
    }
    
    /**
     * Show inline loading spinner
     * @param {string} elementSelector - Element to show spinner in
     * @param {string} size - Spinner size (sm, md, lg)
     * @returns {string} Spinner ID for removal
     */
    showInlineSpinner(elementSelector, size = 'sm') {
        const spinnerId = 'spinner-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const element = $(elementSelector);
        
        if (!element.length) {
            this.log(`Element not found for inline spinner: ${elementSelector}`, 'warn');
            return null;
        }
        
        const sizeClass = size === 'sm' ? 'spinner-border-sm' : size === 'lg' ? '' : '';
        
        const spinnerHtml = `
            <span id="${spinnerId}" class="spinner-border ${sizeClass} ms-2" role="status">
                <span class="visually-hidden">Loading...</span>
            </span>
        `;
        
        element.append(spinnerHtml);
        this.log(`Inline spinner shown: ${elementSelector}`, spinnerId);
        
        return spinnerId;
    }
    
    /**
     * Hide inline spinner
     * @param {string} spinnerId - Spinner ID to remove
     */
    hideInlineSpinner(spinnerId) {
        $(`#${spinnerId}`).remove();
        this.log(`Inline spinner hidden: ${spinnerId}`, spinnerId);
    }
    
    /**
     * Show button loading state
     * @param {string} buttonSelector - Button selector
     * @param {string} loadingText - Text to show while loading
     */
    showButtonLoading(buttonSelector, loadingText = 'Loading...') {
        const button = $(buttonSelector);
        if (!button.length) return null;
        
        const originalText = button.html();
        const buttonId = button.attr('id') || 'button-' + Date.now();
        
        // Store original state
        button.data('original-text', originalText);
        button.data('original-disabled', button.prop('disabled'));
        
        // Update button
        button.html(`
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            ${loadingText}
        `);
        button.prop('disabled', true);
        
        this.log(`Button loading: ${buttonSelector}`, buttonId);
        return buttonId;
    }
    
    /**
     * Hide button loading state
     * @param {string} buttonSelector - Button selector
     */
    hideButtonLoading(buttonSelector) {
        const button = $(buttonSelector);
        if (!button.length) return;
        
        const originalText = button.data('original-text');
        const originalDisabled = button.data('original-disabled');
        
        if (originalText) {
            button.html(originalText);
        }
        
        button.prop('disabled', originalDisabled || false);
        
        this.log(`Button loading hidden: ${buttonSelector}`, button.attr('id') || 'unknown');
    }
    
    /**
     * Get loading statistics
     * @returns {Object} Loading statistics
     */
    getLoadingStats() {
        return {
            activeLoaders: this.activeLoaders,
            loadingStates: Array.from(this.loadingStates.entries()),
            progressBars: Array.from(this.progressBars.entries()),
            minDisplayTime: this.minDisplayTime
        };
    }
    
    /**
     * Set minimum display time for loading
     * @param {number} milliseconds - Minimum display time
     */
    setMinDisplayTime(milliseconds) {
        this.minDisplayTime = milliseconds;
        this.log(`Min display time set to ${milliseconds}ms`, 'config');
    }
    
    /**
     * Log message
     * @param {string} message - Message to log
     * @param {string} context - Context for logging
     */
    log(message, context = 'loading') {
        console.log(`[LoadingManager - ${context}] ${message}`);
    }
}

// Create global instance
window.LoadingManager = LoadingManager;