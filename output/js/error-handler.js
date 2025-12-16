/**
 * ErrorHandler - Comprehensive error handling for arXiv CS Daily
 * Handles network errors, zero results, parsing errors, and provides user-friendly feedback
 */

class ErrorHandler {
    constructor() {
        this.devMode = false;
        this.errorContainer = null;
        this.retryCallbacks = new Map();
        this.errorCount = 0;
        this.maxErrorsBeforeDegrade = 3;
        
        // Initialize error container if it exists
        this.initErrorContainer();
        
        // Listen for online/offline events
        this.setupConnectivityMonitoring();
    }
    
    /**
     * Initialize error container in DOM
     */
    initErrorContainer() {
        // Create error container if it doesn't exist
        if (!$('#error-container').length) {
            $('body').append(`
                <div id="error-container" class="error-container" style="display: none;">
                    <div class="error-content">
                        <div class="error-header">
                            <i class="bi bi-exclamation-triangle-fill"></i>
                            <h4 class="error-title"></h4>
                        </div>
                        <div class="error-body">
                            <p class="error-message"></p>
                            <div class="error-details" style="display: none;">
                                <small class="error-debug"></small>
                            </div>
                        </div>
                        <div class="error-footer">
                            <button class="btn btn-primary btn-retry">Retry</button>
                            <button class="btn btn-secondary btn-dismiss">Dismiss</button>
                            <button class="btn btn-link btn-show-details">Show Details</button>
                        </div>
                    </div>
                </div>
            `);
        }
        
        this.errorContainer = $('#error-container');
        this.setupEventListeners();
    }
    
    /**
     * Setup event listeners for error container
     */
    setupEventListeners() {
        const self = this;
        
        // Retry button
        this.errorContainer.find('.btn-retry').on('click', function() {
            self.hideError();
            const callback = self.retryCallbacks.get('current');
            if (callback && typeof callback === 'function') {
                callback();
            }
        });
        
        // Dismiss button
        this.errorContainer.find('.btn-dismiss').on('click', function() {
            self.hideError();
        });
        
        // Show details button
        this.errorContainer.find('.btn-show-details').on('click', function() {
            const details = self.errorContainer.find('.error-details');
            const isVisible = details.is(':visible');
            details.toggle(!isVisible);
            $(this).text(isVisible ? 'Show Details' : 'Hide Details');
        });
    }
    
    /**
     * Setup connectivity monitoring
     */
    setupConnectivityMonitoring() {
        const self = this;
        
        // Listen for online/offline events
        window.addEventListener('online', function() {
            self.showToast('success', 'Connection restored', 'You are back online.');
            self.log('Network status: Online', 'info');
        });
        
        window.addEventListener('offline', function() {
            self.handleNetworkError('You are offline. Some features may be limited.', {
                type: 'offline',
                timestamp: new Date().toISOString()
            });
        });
        
        // Periodically check connectivity
        setInterval(function() {
            if (!navigator.onLine) {
                self.log('Periodic check: Still offline', 'warn');
            }
        }, 30000); // Check every 30 seconds
    }
    
    /**
     * Handle network errors
     * @param {string} message - User-friendly error message
     * @param {Object} debugInfo - Debug information
     * @param {Function} retryCallback - Callback for retry button
     */
    handleNetworkError(message, debugInfo = {}, retryCallback = null) {
        this.errorCount++;
        
        const errorData = {
            type: 'network',
            message: message,
            debug: debugInfo,
            timestamp: new Date().toISOString(),
            url: debugInfo.url || 'Unknown',
            status: debugInfo.status || 'Unknown'
        };
        
        this.showError('Network Error', message, errorData, retryCallback);
        this.log(`Network error: ${message}`, 'error', debugInfo);
        
        // Check if we should degrade to offline mode
        if (this.errorCount >= this.maxErrorsBeforeDegrade) {
            this.degradeToOfflineMode();
        }
    }
    
    /**
     * Handle zero results error
     * @param {string} category - Category that returned zero results
     * @param {Object} queryInfo - Query information
     * @param {Function} retryCallback - Callback for retry button
     */
    handleZeroResults(category, queryInfo = {}, retryCallback = null) {
        const message = `No papers found for "${category}". Try a different category or check back later.`;
        
        const errorData = {
            type: 'zero_results',
            category: category,
            query: queryInfo,
            timestamp: new Date().toISOString(),
            suggestion: 'Try "All CS" category or check if the category code is correct'
        };
        
        this.showError('No Results Found', message, errorData, retryCallback);
        this.log(`Zero results for category: ${category}`, 'warn', queryInfo);
    }
    
    /**
     * Handle parsing errors
     * @param {string} message - Error message
     * @param {Object} data - Data that failed to parse
     * @param {Function} retryCallback - Callback for retry button
     */
    handleParsingError(message, data = {}, retryCallback = null) {
        const errorData = {
            type: 'parsing',
            message: message,
            dataSample: data,
            timestamp: new Date().toISOString()
        };
        
        this.showError('Data Processing Error', message, errorData, retryCallback);
        this.log(`Parsing error: ${message}`, 'error', { dataSample: data });
    }
    
    /**
     * Handle API errors
     * @param {Object} xhr - XMLHttpRequest object
     * @param {string} status - Error status
     * @param {string} error - Error message
     * @param {Function} retryCallback - Callback for retry button
     */
    handleApiError(xhr, status, error, retryCallback = null) {
        let message = 'Failed to fetch data from arXiv. ';
        let debugInfo = {
            status: xhr.status,
            statusText: xhr.statusText,
            readyState: xhr.readyState,
            responseText: xhr.responseText ? xhr.responseText.substring(0, 200) + '...' : 'Empty'
        };
        
        if (xhr.status === 0) {
            message += 'Network connection failed. Check your internet connection.';
        } else if (xhr.status === 404) {
            message += 'API endpoint not found.';
        } else if (xhr.status === 500) {
            message += 'Server error. Please try again later.';
        } else if (xhr.status === 403) {
            message += 'Access forbidden. CORS issue detected.';
        } else {
            message += `Server returned ${xhr.status}: ${xhr.statusText}`;
        }
        
        const errorData = {
            type: 'api',
            message: message,
            debug: debugInfo,
            timestamp: new Date().toISOString(),
            url: xhr.responseURL || 'Unknown'
        };
        
        this.showError('API Error', message, errorData, retryCallback);
        this.log(`API error: ${status} - ${error}`, 'error', debugInfo);
    }
    
    /**
     * Show error in UI
     * @param {string} title - Error title
     * @param {string} message - Error message
     * @param {Object} errorData - Error data for debugging
     * @param {Function} retryCallback - Callback for retry button
     */
    showError(title, message, errorData = {}, retryCallback = null) {
        // Update error container content
        this.errorContainer.find('.error-title').text(title);
        this.errorContainer.find('.error-message').text(message);
        
        // Add debug info if in dev mode or if error data exists
        if (this.devMode || errorData.debug) {
            const debugText = JSON.stringify(errorData, null, 2);
            this.errorContainer.find('.error-debug').text(debugText);
            this.errorContainer.find('.btn-show-details').show();
        } else {
            this.errorContainer.find('.btn-show-details').hide();
        }
        
        // Store retry callback
        if (retryCallback) {
            this.retryCallbacks.set('current', retryCallback);
            this.errorContainer.find('.btn-retry').show();
        } else {
            this.errorContainer.find('.btn-retry').hide();
        }
        
        // Show error container with animation
        this.errorContainer.fadeIn(300);
        
        // Auto-hide after 10 seconds if no retry callback
        if (!retryCallback) {
            setTimeout(() => {
                this.hideError();
            }, 10000);
        }
    }
    
    /**
     * Hide error container
     */
    hideError() {
        this.errorContainer.fadeOut(300);
        this.retryCallbacks.delete('current');
    }
    
    /**
     * Degrade to offline mode after multiple errors
     */
    degradeToOfflineMode() {
        this.showToast('warning', 'Offline Mode', 
            'Multiple connection failures detected. Switching to offline mode with sample data.');
        this.log('Degraded to offline mode due to multiple errors', 'warn');
        
        // Dispatch event for other components to handle
        const event = new CustomEvent('offline-mode-activated', {
            detail: { timestamp: new Date().toISOString() }
        });
        window.dispatchEvent(event);
    }
    
    /**
     * Show toast notification
     * @param {string} type - success, error, warning, info
     * @param {string} title - Toast title
     * @param {string} message - Toast message
     * @param {number} duration - Duration in milliseconds
     */
    showToast(type, title, message, duration = 5000) {
        // Create toast container if it doesn't exist
        if (!$('#toast-container').length) {
            $('body').append('<div id="toast-container" class="toast-container"></div>');
        }
        
        const iconMap = {
            success: 'bi-check-circle-fill',
            error: 'bi-x-circle-fill',
            warning: 'bi-exclamation-triangle-fill',
            info: 'bi-info-circle-fill'
        };
        
        const toastId = 'toast-' + Date.now();
        const toastHtml = `
            <div id="${toastId}" class="toast fade show" role="alert">
                <div class="toast-header bg-${type} text-white">
                    <i class="bi ${iconMap[type] || 'bi-info-circle-fill'} me-2"></i>
                    <strong class="me-auto">${title}</strong>
                    <small>just now</small>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        $('#toast-container').append(toastHtml);
        
        // Initialize Bootstrap toast
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            delay: duration,
            autohide: true
        });
        
        toast.show();
        
        // Remove toast from DOM after it's hidden
        toastElement.addEventListener('hidden.bs.toast', function() {
            $(this).remove();
        });
        
        this.log(`Toast shown: ${type} - ${title}`, 'info');
    }
    
    /**
     * Log message to console with appropriate level
     * @param {string} message - Message to log
     * @param {string} level - log, info, warn, error
     * @param {Object} data - Additional data to log
     */
    log(message, level = 'log', data = null) {
        if (!this.devMode && level === 'log') return;
        
        const timestamp = new Date().toISOString();
        const prefix = `[arXiv CS Daily - ${timestamp}]`;
        
        switch(level) {
            case 'error':
                console.error(prefix, message, data || '');
                break;
            case 'warn':
                console.warn(prefix, message, data || '');
                break;
            case 'info':
                console.info(prefix, message, data || '');
                break;
            default:
                console.log(prefix, message, data || '');
        }
    }
    
    /**
     * Toggle developer mode
     * @param {boolean} enabled - Whether dev mode is enabled
     */
    setDevMode(enabled) {
        this.devMode = enabled;
        this.log(`Developer mode ${enabled ? 'enabled' : 'disabled'}`, 'info');
        
        if (enabled) {
            this.showToast('info', 'Developer Mode', 'Debug logging enabled. Check console for details.');
        }
    }
    
    /**
     * Reset error count
     */
    resetErrorCount() {
        this.errorCount = 0;
        this.log('Error count reset', 'info');
    }
    
    /**
     * Check if app is in degraded mode
     * @returns {boolean} True if in degraded mode
     */
    isDegradedMode() {
        return this.errorCount >= this.maxErrorsBeforeDegrade;
    }
    
    /**
     * Get current error statistics
     * @returns {Object} Error statistics
     */
    getErrorStats() {
        return {
            errorCount: this.errorCount,
            maxErrorsBeforeDegrade: this.maxErrorsBeforeDegrade,
            isDegraded: this.isDegradedMode(),
            isOnline: navigator.onLine,
            lastError: this.retryCallbacks.has('current') ? 'Active error' : 'No active errors'
        };
    }
}

// Create global instance
window.ErrorHandler = ErrorHandler;