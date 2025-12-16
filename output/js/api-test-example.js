/**
 * Example usage of ApiClient, DataParser, and CacheManager
 * This demonstrates how the components work together
 */

// Example usage when all components are loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('API Test Example: Starting demonstration...');
    
    // Check if components are available
    if (typeof ApiClient === 'undefined' || 
        typeof DataParser === 'undefined' || 
        typeof CacheManager === 'undefined') {
        console.error('Required components not loaded. Make sure to include:');
        console.error('- js/cache-manager.js');
        console.error('- js/data-parser.js');
        console.error('- js/api-client.js');
        return;
    }
    
    // Initialize components
    const cacheManager = new CacheManager();
    const dataParser = new DataParser();
    const apiClient = new ApiClient();
    
    // Set up status callbacks
    apiClient.setStatusCallback(function(status, message) {
        console.log(`Status: ${status} - ${message}`);
        updateStatusDisplay(status, message);
    });
    
    apiClient.setProgressCallback(function(progress, message) {
        console.log(`Progress: ${progress}% - ${message}`);
        updateProgressDisplay(progress, message);
    });
    
    // Test functions
    window.testApiConnection = async function() {
        console.log('Testing API connection...');
        const isConnected = await apiClient.testApiConnection();
        console.log('API connection test result:', isConnected);
        return isConnected;
    };
    
    window.fetchSamplePapers = async function() {
        console.log('Fetching sample papers...');
        try {
            const papers = await apiClient.fetchPapers('cs.AI', 0, 5);
            console.log('Fetched papers:', papers);
            displayPapers(papers);
            return papers;
        } catch (error) {
            console.error('Failed to fetch papers:', error);
            return [];
        }
    };
    
    window.clearCache = function() {
        console.log('Clearing cache...');
        cacheManager.clearAll();
        console.log('Cache cleared');
    };
    
    window.getCacheStats = function() {
        const stats = cacheManager.getStats();
        console.log('Cache statistics:', stats);
        displayCacheStats(stats);
        return stats;
    };
    
    // Helper functions for display
    function updateStatusDisplay(status, message) {
        const statusDiv = document.getElementById('status-display');
        if (statusDiv) {
            statusDiv.innerHTML = `
                <div class="alert alert-${getStatusClass(status)}">
                    <strong>${status.toUpperCase()}:</strong> ${message}
                </div>
            `;
        }
    }
    
    function updateProgressDisplay(progress, message) {
        const progressDiv = document.getElementById('progress-display');
        if (progressDiv) {
            progressDiv.innerHTML = `
                <div class="progress">
                    <div class="progress-bar" role="progressbar" 
                         style="width: ${progress}%" 
                         aria-valuenow="${progress}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        ${progress}% - ${message}
                    </div>
                </div>
            `;
        }
    }
    
    function displayPapers(papers) {
        const papersDiv = document.getElementById('papers-display');
        if (!papersDiv) return;
        
        if (papers.length === 0) {
            papersDiv.innerHTML = '<div class="alert alert-warning">No papers found</div>';
            return;
        }
        
        let html = '<div class="row">';
        papers.forEach((paper, index) => {
            html += `
                <div class="col-md-6 mb-3">
                    <div class="card">
                        <div class="card-body">
                            <h6 class="card-title">${paper.title}</h6>
                            <p class="card-text">
                                <small class="text-muted">
                                    ${paper.authors.slice(0, 2).map(a => a.name).join(', ')}
                                    ${paper.authors.length > 2 ? ' et al.' : ''}
                                </small>
                            </p>
                            <div class="d-flex justify-content-between">
                                <span class="badge bg-primary">${paper.primaryCategory}</span>
                                <small>${paper.publishedFormatted}</small>
                            </div>
                            ${paper.isNew ? '<span class="badge bg-success ms-2">New</span>' : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        papersDiv.innerHTML = html;
    }
    
    function displayCacheStats(stats) {
        const statsDiv = document.getElementById('cache-stats-display');
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="card">
                    <div class="card-body">
                        <h6 class="card-title">Cache Statistics</h6>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Total Entries:</span>
                                <span>${stats.totalEntries}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Valid Entries:</span>
                                <span class="text-success">${stats.validEntries}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Expired Entries:</span>
                                <span class="text-warning">${stats.expiredEntries}</span>
                            </li>
                            <li class="list-group-item d-flex justify-content-between">
                                <span>Total Size:</span>
                                <span>${(stats.totalSize / 1024).toFixed(2)} KB</span>
                            </li>
                        </ul>
                    </div>
                </div>
            `;
        }
    }
    
    function getStatusClass(status) {
        const classes = {
            'loading': 'info',
            'success': 'success',
            'error': 'danger',
            'warning': 'warning'
        };
        return classes[status] || 'info';
    }
    
    console.log('API Test Example: Ready. Functions available:');
    console.log('- testApiConnection()');
    console.log('- fetchSamplePapers()');
    console.log('- clearCache()');
    console.log('- getCacheStats()');
});

// Sample XML response parser test
function testXmlParsing() {
    console.log('Testing XML parsing...');
    
    // Sample XML response (simplified)
    const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>ArXiv Query: search_query=cat:cs.AI&amp;id_list=&amp;start=0&amp;max_results=2</title>
  <entry>
    <id>http://arxiv.org/abs/2301.12345v1</id>
    <title>Sample Paper Title</title>
    <summary>This is a sample abstract for testing purposes.</summary>
    <published>2023-01-01T00:00:00Z</published>
    <updated>2023-01-01T00:00:00Z</updated>
    <author>
      <name>John Doe</name>
    </author>
    <author>
      <name>Jane Smith</name>
    </author>
    <link href="http://arxiv.org/pdf/2301.12345v1" type="application/pdf" />
    <category term="cs.AI" />
    <category term="cs.LG" />
  </entry>
</feed>`;
    
    try {
        const parser = new DataParser();
        const papers = parser.parseXmlResponse(sampleXml);
        console.log('Parsed papers:', papers);
        return papers;
    } catch (error) {
        console.error('XML parsing test failed:', error);
        return [];
    }
}

// Test cache manager
function testCacheManager() {
    console.log('Testing Cache Manager...');
    
    const cache = new CacheManager();
    
    // Test set and get
    const testData = [{ id: 'test1', title: 'Test Paper' }];
    const key = 'test_key';
    
    cache.set(key, testData, 5000); // 5 second TTL
    const retrieved = cache.get(key);
    
    console.log('Cache set/get test:', retrieved);
    console.log('Cache has key:', cache.has(key));
    
    // Test cleanup
    setTimeout(() => {
        const afterExpiry = cache.get(key);
        console.log('Cache after expiry:', afterExpiry);
    }, 6000);
    
    return cache;
}

// Run tests if this file is loaded directly
if (typeof window !== 'undefined' && window === this) {
    console.log('Running API component tests...');
    
    // Test cache manager
    testCacheManager();
    
    // Test XML parsing
    testXmlParsing();
    
    console.log('Tests completed. Check console for results.');
}