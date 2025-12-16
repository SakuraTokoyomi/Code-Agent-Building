/**
 * Cache Manager for arXiv CS Daily
 * Handles localStorage caching with TTL (Time To Live) support
 */

class CacheManager {
    constructor() {
        this.CACHE_PREFIX = 'arxiv_cs_daily_';
        this.DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        this.MAX_CACHE_SIZE = 50; // Maximum number of cached responses
    }

    /**
     * Generate cache key from parameters
     * @param {string} category - arXiv category
     * @param {number} start - Start index
     * @param {number} maxResults - Maximum results
     * @returns {string} Cache key
     */
    generateCacheKey(category, start, maxResults) {
        return `${this.CACHE_PREFIX}${category}_${start}_${maxResults}`;
    }

    /**
     * Store data in cache with timestamp
     * @param {string} key - Cache key
     * @param {Array} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     * @returns {boolean} Success status
     */
    set(key, data, ttl = this.DEFAULT_TTL) {
        try {
            const cacheItem = {
                data: data,
                timestamp: Date.now(),
                ttl: ttl,
                expires: Date.now() + ttl
            };

            localStorage.setItem(key, JSON.stringify(cacheItem));
            
            // Clean up old cache entries if we exceed max size
            this.cleanup();
            
            console.log(`CacheManager: Stored data with key "${key}"`);
            return true;
        } catch (error) {
            console.error('CacheManager: Failed to store data in cache:', error);
            return false;
        }
    }

    /**
     * Retrieve data from cache if not expired
     * @param {string} key - Cache key
     * @returns {Array|null} Cached data or null if expired/not found
     */
    get(key) {
        try {
            const cached = localStorage.getItem(key);
            if (!cached) {
                return null;
            }

            const cacheItem = JSON.parse(cached);
            const now = Date.now();

            // Check if cache is expired
            if (now > cacheItem.expires) {
                console.log(`CacheManager: Cache expired for key "${key}"`);
                localStorage.removeItem(key);
                return null;
            }

            console.log(`CacheManager: Retrieved data from cache with key "${key}"`);
            return cacheItem.data;
        } catch (error) {
            console.error('CacheManager: Failed to retrieve data from cache:', error);
            return null;
        }
    }

    /**
     * Check if valid cache exists for key
     * @param {string} key - Cache key
     * @returns {boolean} True if valid cache exists
     */
    has(key) {
        return this.get(key) !== null;
    }

    /**
     * Remove specific cache entry
     * @param {string} key - Cache key
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            console.log(`CacheManager: Removed cache entry with key "${key}"`);
        } catch (error) {
            console.error('CacheManager: Failed to remove cache entry:', error);
        }
    }

    /**
     * Clear all cache entries for this application
     */
    clearAll() {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.CACHE_PREFIX)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`CacheManager: Cleared ${keysToRemove.length} cache entries`);
        } catch (error) {
            console.error('CacheManager: Failed to clear cache:', error);
        }
    }

    /**
     * Clean up expired cache entries and enforce size limit
     */
    cleanup() {
        try {
            const cacheEntries = [];
            const now = Date.now();

            // Collect all cache entries
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.CACHE_PREFIX)) {
                    try {
                        const cached = localStorage.getItem(key);
                        const cacheItem = JSON.parse(cached);
                        
                        // Check if expired
                        if (now > cacheItem.expires) {
                            localStorage.removeItem(key);
                            console.log(`CacheManager: Cleaned up expired cache: ${key}`);
                        } else {
                            cacheEntries.push({
                                key: key,
                                timestamp: cacheItem.timestamp
                            });
                        }
                    } catch (e) {
                        // Remove corrupted entries
                        localStorage.removeItem(key);
                    }
                }
            }

            // If still over limit, remove oldest entries
            if (cacheEntries.length > this.MAX_CACHE_SIZE) {
                // Sort by timestamp (oldest first)
                cacheEntries.sort((a, b) => a.timestamp - b.timestamp);
                
                const entriesToRemove = cacheEntries.slice(0, cacheEntries.length - this.MAX_CACHE_SIZE);
                entriesToRemove.forEach(entry => {
                    localStorage.removeItem(entry.key);
                    console.log(`CacheManager: Cleaned up old cache: ${entry.key}`);
                });
            }
        } catch (error) {
            console.error('CacheManager: Failed during cleanup:', error);
        }
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
        const stats = {
            totalEntries: 0,
            validEntries: 0,
            expiredEntries: 0,
            totalSize: 0
        };

        try {
            const now = Date.now();

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.CACHE_PREFIX)) {
                    stats.totalEntries++;
                    
                    try {
                        const cached = localStorage.getItem(key);
                        stats.totalSize += cached.length;
                        
                        const cacheItem = JSON.parse(cached);
                        if (now > cacheItem.expires) {
                            stats.expiredEntries++;
                        } else {
                            stats.validEntries++;
                        }
                    } catch (e) {
                        // Corrupted entry
                        stats.expiredEntries++;
                    }
                }
            }
        } catch (error) {
            console.error('CacheManager: Failed to get stats:', error);
        }

        return stats;
    }

    /**
     * Get all valid cache keys
     * @returns {Array} Array of valid cache keys
     */
    getAllKeys() {
        const keys = [];
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith(this.CACHE_PREFIX) && this.has(key)) {
                    keys.push(key);
                }
            }
        } catch (error) {
            console.error('CacheManager: Failed to get keys:', error);
        }
        return keys;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager;
}