/**
 * API Client for arXiv CS Daily
 * Handles API communication with retry logic and caching
 */

class ApiClient {
    constructor() {
        // Use local proxy to avoid CORS issues
        this.BASE_URL = 'http://localhost:5000/api';
        this.API_ENDPOINT = '/query';
        
        // Fallback to direct arXiv API if proxy is not available
        this.FALLBACK_URL = 'http://export.arxiv.org/api/query';
        
        // Configuration
        this.DEFAULT_MAX_RESULTS = 25;
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 1000; // 1 second
        this.TIMEOUT = 15000; // 15 seconds
        
        // Initialize dependencies
        this.cacheManager = new CacheManager();
        this.dataParser = new DataParser();
        
        // State tracking
        this.isOnline = true;
        this.lastRequestTime = 0;
        this.minRequestInterval = 3100; // 3.1 seconds (arXiv rate limit)
        
        // Event callbacks
        this.onStatusChange = null;
        this.onProgress = null;
        
        console.log('ApiClient: Initialized with proxy URL:', this.BASE_URL);
    }

    /**
     * Set status change callback
     * @param {Function} callback - Callback function(status, message)
     */
    setStatusCallback(callback) {
        this.onStatusChange = callback;
    }

    /**
     * Set progress callback
     * @param {Function} callback - Callback function(progress, message)
     */
    setProgressCallback(callback) {
        this.onProgress = callback;
    }

    /**
     * Update status and notify callback
     * @param {string} status - Status type (loading, success, error, warning)
     * @param {string} message - Status message
     */
    updateStatus(status, message) {
        console.log(`ApiClient [${status}]: ${message}`);
        
        if (this.onStatusChange) {
            this.onStatusChange(status, message);
        }
    }

    /**
     * Update progress and notify callback
     * @param {number} progress - Progress percentage (0-100)
     * @param {string} message - Progress message
     */
    updateProgress(progress, message) {
        if (this.onProgress) {
            this.onProgress(progress, message);
        }
    }

    /**
     * Check if enough time has passed since last request
     * @returns {boolean} True if ready for next request
     */
    isReadyForRequest() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < this.minRequestInterval) {
            const waitTime = this.minRequestInterval - timeSinceLastRequest;
            console.log(`ApiClient: Rate limiting - waiting ${waitTime}ms`);
            return false;
        }
        
        return true;
    }

    /**
     * Construct API URL with parameters
     * @param {string} category - arXiv category (e.g., 'cs.AI', 'cs.*')
     * @param {number} start - Start index (0-based)
     * @param {number} maxResults - Maximum results to return
     * @returns {string} Complete API URL
     */
    constructApiUrl(category, start = 0, maxResults = this.DEFAULT_MAX_RESULTS) {
        // Validate and normalize category
        const normalizedCategory = this.normalizeCategory(category);
        
        // Build query parameters
        const params = {
            search_query: `cat:${normalizedCategory}`,
            start: start,
            max_results: maxResults,
            sortBy: 'submittedDate',
            sortOrder: 'descending'
        };

        // Convert to query string
        const queryString = Object.entries(params)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&');

        // Try proxy first, fallback to direct API
        const baseUrl = this.testProxyAvailability() ? this.BASE_URL : this.FALLBACK_URL;
        return `${baseUrl}${this.API_ENDPOINT}?${queryString}`;
    }

    /**
     * Normalize category string
     * @param {string} category - Category string
     * @returns {string} Normalized category
     */
    normalizeCategory(category) {
        if (!category || category === 'all' || category === '*') {
            return 'cs.*';
        }
        
        // Ensure it starts with 'cs.'
        if (!category.startsWith('cs.')) {
            return `cs.${category}`;
        }
        
        return category;
    }

    /**
     * Test if proxy is available
     * @returns {boolean} True if proxy is available
     */
    testProxyAvailability() {
        // In a real implementation, this would make a test request
        // For now, we'll assume proxy is available but handle failures gracefully
        return true;
    }

    /**
     * Fetch papers from arXiv API
     * @param {string} category - arXiv category
     * @param {number} start - Start index
     * @param {number} maxResults - Maximum results
     * @returns {Promise<Array>} Promise resolving to array of papers
     */
    async fetchPapers(category, start = 0, maxResults = this.DEFAULT_MAX_RESULTS) {
        // Generate cache key
        const cacheKey = this.cacheManager.generateCacheKey(category, start, maxResults);
        
        // Check cache first
        const cachedData = this.cacheManager.get(cacheKey);
        if (cachedData) {
            this.updateStatus('success', `Loaded ${cachedData.length} papers from cache`);
            return cachedData;
        }

        // Check rate limiting
        if (!this.isReadyForRequest()) {
            this.updateStatus('warning', 'Rate limited - please wait a moment');
            throw new Error('Rate limited. Please wait before making another request.');
        }

        // Update request time
        this.lastRequestTime = Date.now();

        // Try API with retry logic
        try {
            this.updateStatus('loading', `Fetching papers for ${category}...`);
            this.updateProgress(10, 'Starting API request');
            
            const papers = await this.fetchWithRetry(category, start, maxResults);
            
            // Cache successful response
            if (papers && papers.length > 0) {
                this.cacheManager.set(cacheKey, papers);
                this.updateStatus('success', `Successfully fetched ${papers.length} papers`);
                this.updateProgress(100, 'Complete');
            } else {
                this.updateStatus('warning', 'No papers found for this category');
            }
            
            return papers;
        } catch (error) {
            this.updateStatus('error', `Failed to fetch papers: ${error.message}`);
            throw error;
        }
    }

    /**
     * Fetch with retry logic
     * @param {string} category - arXiv category
     * @param {number} start - Start index
     * @param {number} maxResults - Maximum results
     * @param {number} retryCount - Current retry count
     * @returns {Promise<Array>} Promise resolving to array of papers
     */
    async fetchWithRetry(category, start, maxResults, retryCount = 0) {
        const url = this.constructApiUrl(category, start, maxResults);
        
        console.log(`ApiClient: Fetching from ${url}`);
        this.updateProgress(30, 'Making API request');

        try {
            const response = await this.makeApiRequest(url);
            this.updateProgress(60, 'Parsing response');
            
            // Parse the response
            const papers = this.dataParser.parseXmlResponse(response);
            const totalResults = this.dataParser.parseTotalResults(response);
            
            console.log(`ApiClient: Received ${papers.length} papers (total: ${totalResults})`);
            
            // Validate response
            if (totalResults === 0) {
                throw new Error('No results found - check category syntax');
            }
            
            if (papers.length === 0) {
                throw new Error('Failed to parse any papers from response');
            }
            
            return papers;
        } catch (error) {
            console.error(`ApiClient: Request failed (attempt ${retryCount + 1}/${this.MAX_RETRIES + 1}):`, error);
            
            // Check if we should retry
            if (retryCount < this.MAX_RETRIES) {
                const delay = this.RETRY_DELAY * Math.pow(2, retryCount); // Exponential backoff
                this.updateStatus('warning', `Request failed, retrying in ${delay/1000}s...`);
                
                await this.delay(delay);
                return this.fetchWithRetry(category, start, maxResults, retryCount + 1);
            }
            
            // Max retries exceeded
            throw new Error(`Failed after ${this.MAX_RETRIES + 1} attempts: ${error.message}`);
        }
    }

    /**
     * Make API request
     * @param {string} url - API URL
     * @returns {Promise<string>} Promise resolving to XML response
     */
    makeApiRequest(url) {
        return new Promise((resolve, reject) => {
            // Check online status
            if (!navigator.onLine) {
                this.isOnline = false;
                reject(new Error('Network is offline'));
                return;
            }

            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'xml',
                timeout: this.TIMEOUT,
                beforeSend: () => {
                    this.updateProgress(40, 'Waiting for response');
                },
                success: (data, textStatus, xhr) => {
                    this.isOnline = true;
                    
                    // Check for empty response
                    if (!data || $(data).find('entry').length === 0) {
                        const errorText = $(data).find('error').text();
                        if (errorText) {
                            reject(new Error(`API error: ${errorText}`));
                        } else {
                            reject(new Error('Empty response from API'));
                        }
                        return;
                    }
                    
                    resolve(data);
                },
                error: (xhr, status, error) => {
                    this.handleRequestError(xhr, status, error, reject);
                }
            });
        });
    }

    /**
     * Handle request errors
     * @param {Object} xhr - XMLHttpRequest object
     * @param {string} status - Status string
     * @param {string} error - Error message
     * @param {Function} reject - Promise reject function
     */
    handleRequestError(xhr, status, error, reject) {
        let errorMessage = 'Unknown error';
        
        if (status === 'timeout') {
            errorMessage = 'Request timeout - server is not responding';
        } else if (status === 'error') {
            if (xhr.status === 0) {
                errorMessage = 'Network error - check CORS/proxy configuration';
            } else if (xhr.status === 403) {
                errorMessage = 'Access forbidden - check API key or permissions';
            } else if (xhr.status === 404) {
                errorMessage = 'API endpoint not found';
            } else if (xhr.status === 429) {
                errorMessage = 'Rate limited - too many requests';
            } else if (xhr.status >= 500) {
                errorMessage = `Server error (${xhr.status})`;
            } else {
                errorMessage = `HTTP ${xhr.status}: ${error}`;
            }
        } else if (status === 'parsererror') {
            errorMessage = 'Failed to parse XML response';
        } else if (status === 'abort') {
            errorMessage = 'Request was aborted';
        }
        
        console.error(`ApiClient: Request failed - ${errorMessage}`, {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText?.substring(0, 500)
        });
        
        reject(new Error(errorMessage));
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Fetch paper details by arXiv ID
     * @param {string} arxivId - arXiv ID (e.g., '2301.12345')
     * @returns {Promise<Object>} Promise resolving to paper details
     */
    async fetchPaperDetails(arxivId) {
        if (!arxivId) {
            throw new Error('arXiv ID is required');
        }

        const cacheKey = `paper_details_${arxivId}`;
        
        // Check cache
        const cachedDetails = this.cacheManager.get(cacheKey);
        if (cachedDetails) {
            this.updateStatus('success', `Loaded paper details from cache`);
            return cachedDetails;
        }

        try {
            this.updateStatus('loading', `Fetching details for ${arxivId}...`);
            
            // Construct query for single paper
            const params = {
                id_list: arxivId,
                max_results: 1
            };

            const queryString = Object.entries(params)
                .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                .join('&');

            const baseUrl = this.testProxyAvailability() ? this.BASE_URL : this.FALLBACK_URL;
            const url = `${baseUrl}${this.API_ENDPOINT}?${queryString}`;

            const response = await this.makeApiRequest(url);
            const papers = this.dataParser.parseXmlResponse(response);
            
            if (papers.length === 0) {
                throw new Error('Paper not found');
            }
            
            const paperDetails = papers[0];
            
            // Cache details
            this.cacheManager.set(cacheKey, paperDetails, 60 * 60 * 1000); // 1 hour TTL
            
            this.updateStatus('success', 'Paper details loaded');
            return paperDetails;
        } catch (error) {
            this.updateStatus('error', `Failed to fetch paper details: ${error.message}`);
            throw error;
        }
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        this.cacheManager.clearAll();
        this.updateStatus('success', 'Cache cleared');
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return this.cacheManager.getStats();
    }

    /**
     * Check if API is reachable
     * @returns {Promise<boolean>} True if API is reachable
     */
    async testApiConnection() {
        try {
            this.updateStatus('loading', 'Testing API connection...');
            
            // Make a simple test request
            const testUrl = this.constructApiUrl('cs.AI', 0, 1);
            const response = await $.ajax({
                url: testUrl,
                method: 'GET',
                dataType: 'xml',
                timeout: 10000
            });
            
            const totalResults = this.dataParser.parseTotalResults(response);
            const isConnected = totalResults > 0;
            
            if (isConnected) {
                this.updateStatus('success', `API connected (${totalResults} total papers available)`);
            } else {
                this.updateStatus('warning', 'API connected but returned 0 results');
            }
            
            return isConnected;
        } catch (error) {
            this.updateStatus('error', `API connection failed: ${error.message}`);
            return false;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiClient;
}