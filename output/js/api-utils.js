// ArXiv API Utilities
const ArXivAPI = (function() {
    // Configuration
    const CONFIG = {
        BASE_URL: 'http://localhost:5000/arxiv/papers',
        DEFAULT_CATEGORY: 'cs.AI',
        DEFAULT_MAX_RESULTS: 20,
        CACHE_DURATION: 1000 * 60 * 60, // 1 hour cache
        SAMPLE_DATA_PATH: '/data/sample-papers.json'
    };

    // Logging utility
    const Logger = {
        info: (msg) => console.log(`📘 ArXivAPI: ${msg}`),
        warn: (msg) => console.warn(`⚠️ ArXivAPI Warning: ${msg}`),
        error: (msg) => console.error(`🚨 ArXivAPI Error: ${msg}`)
    };

    // Cache management
    const CacheManager = {
        set: (key, data) => {
            try {
                localStorage.setItem(key, JSON.stringify({
                    timestamp: Date.now(),
                    data: data
                }));
            } catch (error) {
                Logger.warn(`Cache set failed: ${error}`);
            }
        },
        get: (key) => {
            try {
                const cached = localStorage.getItem(key);
                if (!cached) return null;

                const parsedCache = JSON.parse(cached);
                const isExpired = (Date.now() - parsedCache.timestamp) > CONFIG.CACHE_DURATION;

                return isExpired ? null : parsedCache.data;
            } catch (error) {
                Logger.warn(`Cache retrieval failed: ${error}`);
                return null;
            }
        },
        clear: (key) => {
            try {
                localStorage.removeItem(key);
            } catch (error) {
                Logger.warn(`Cache clear failed: ${error}`);
            }
        }
    };

    // Fetch sample data as fallback
    async function fetchSampleData() {
        try {
            const response = await fetch(CONFIG.SAMPLE_DATA_PATH);
            const sampleData = await response.json();
            Logger.info('Using sample data as fallback');
            return sampleData.papers || [];
        } catch (error) {
            Logger.error(`Sample data fetch failed: ${error}`);
            return [];
        }
    }

    // Main API fetch method with comprehensive error handling
    async function fetchPapers(options = {}) {
        const {
            category = CONFIG.DEFAULT_CATEGORY,
            maxResults = CONFIG.DEFAULT_MAX_RESULTS,
            start = 0
        } = options;

        // Check cache first
        const cacheKey = `arxiv_${category}_${start}_${maxResults}`;
        const cachedData = CacheManager.get(cacheKey);
        if (cachedData) {
            Logger.info('Returning cached data');
            return cachedData;
        }

        try {
            // Construct query parameters
            const params = new URLSearchParams({
                category,
                max_results: maxResults,
                start
            });

            // Fetch from proxy
            const response = await fetch(`${CONFIG.BASE_URL}?${params}`);

            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }

            const data = await response.json();

            // Validate response structure
            if (!data || !Array.isArray(data.papers)) {
                throw new Error('Invalid API response structure');
            }

            // Cache successful response
            CacheManager.set(cacheKey, data.papers);

            return data.papers;
        } catch (error) {
            Logger.warn(`API fetch failed: ${error}. Falling back to sample data.`);
            
            // Use sample data as fallback
            const sampleData = await fetchSampleData();
            
            // Filter sample data by category if possible
            const filteredSampleData = sampleData.filter(
                paper => paper.categories.includes(category)
            );

            return filteredSampleData.length > 0 
                ? filteredSampleData 
                : sampleData;
        }
    }

    // Public API
    return {
        fetchPapers,
        Logger,
        CONFIG
    };
})();