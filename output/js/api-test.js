/**
 * arXiv API Testing Module
 * Tests connectivity to arXiv API through proxy and validates query syntax
 * 
 * CRITICAL: This module must work before any UI development
 */

class ApiTester {
    constructor() {
        this.proxyUrl = 'http://localhost:5000/api/query';
        this.directUrl = 'http://export.arxiv.org/api/query';
        this.testQuery = 'cat:cs.*';
        this.maxResults = 5; // Small number for testing
        this.retryCount = 0;
        this.maxRetries = 3;
        this.testResults = {
            proxyAvailable: false,
            directAvailable: false,
            queryValid: false,
            totalResults: 0,
            lastTestTime: null,
            errorMessages: []
        };
    }

    /**
     * Test API connectivity through all available methods
     * @returns {Promise<Object>} Test results object
     */
    async testAllConnections() {
        console.log('🔍 Starting arXiv API connectivity tests...');
        this.testResults.lastTestTime = new Date().toISOString();
        this.testResults.errorMessages = [];

        // Try proxy first (recommended approach)
        await this.testProxyConnection();
        
        // If proxy fails, try direct connection (will likely fail due to CORS)
        if (!this.testResults.proxyAvailable) {
            await this.testDirectConnection();
        }

        // Log comprehensive results
        this.logTestResults();
        
        return this.testResults;
    }

    /**
     * Test connection through local proxy
     */
    async testProxyConnection() {
        console.log('🔄 Testing proxy connection...');
        
        const testUrl = this.buildTestUrl(this.proxyUrl);
        console.log(`📡 Proxy test URL: ${testUrl}`);
        
        try {
            const response = await this.makeApiRequest(testUrl, 'proxy');
            
            if (response && response.totalResults > 0) {
                this.testResults.proxyAvailable = true;
                this.testResults.queryValid = true;
                this.testResults.totalResults = response.totalResults;
                console.log(`✅ Proxy connection successful! Found ${response.totalResults} papers.`);
            } else {
                this.testResults.errorMessages.push('Proxy returned zero results - query may be invalid');
                console.warn('⚠️ Proxy returned zero results');
            }
        } catch (error) {
            this.testResults.errorMessages.push(`Proxy error: ${error.message}`);
            console.error('❌ Proxy connection failed:', error.message);
        }
    }

    /**
     * Test direct connection to arXiv API (will likely fail due to CORS)
     */
    async testDirectConnection() {
        console.log('🔄 Testing direct arXiv API connection...');
        
        const testUrl = this.buildTestUrl(this.directUrl);
        console.log(`📡 Direct test URL: ${testUrl}`);
        
        try {
            const response = await this.makeApiRequest(testUrl, 'direct');
            
            if (response && response.totalResults > 0) {
                this.testResults.directAvailable = true;
                this.testResults.queryValid = true;
                this.testResults.totalResults = response.totalResults;
                console.log(`✅ Direct connection successful! Found ${response.totalResults} papers.`);
            } else {
                this.testResults.errorMessages.push('Direct API returned zero results');
                console.warn('⚠️ Direct API returned zero results');
            }
        } catch (error) {
            this.testResults.errorMessages.push(`Direct API error: ${error.message}`);
            console.warn('❌ Direct connection failed (expected due to CORS):', error.message);
        }
    }

    /**
     * Build test URL with proper query parameters
     * @param {string} baseUrl - Base API URL
     * @returns {string} Complete test URL
     */
    buildTestUrl(baseUrl) {
        const params = new URLSearchParams({
            search_query: this.testQuery,
            start: 0,
            max_results: this.maxResults,
            sortBy: 'submittedDate',
            sortOrder: 'descending'
        });
        
        return `${baseUrl}?${params.toString()}`;
    }

    /**
     * Make API request with retry logic
     * @param {string} url - API endpoint URL
     * @param {string} mode - 'proxy' or 'direct'
     * @returns {Promise<Object>} Parsed response data
     */
    async makeApiRequest(url, mode) {
        return new Promise((resolve, reject) => {
            const timeout = mode === 'proxy' ? 10000 : 5000; // Longer timeout for proxy
            
            $.ajax({
                url: url,
                method: 'GET',
                dataType: 'xml',
                timeout: timeout,
                beforeSend: function() {
                    console.log(`⏳ Making ${mode} API request...`);
                },
                success: (data) => {
                    try {
                        const parsedData = this.parseApiResponse(data);
                        resolve(parsedData);
                    } catch (parseError) {
                        reject(new Error(`Failed to parse ${mode} response: ${parseError.message}`));
                    }
                },
                error: (xhr, status, error) => {
                    if (status === 'timeout') {
                        reject(new Error(`${mode} request timed out after ${timeout}ms`));
                    } else if (xhr.status === 0) {
                        reject(new Error(`${mode} request failed - possible CORS issue or network error`));
                    } else {
                        reject(new Error(`${mode} request failed with status ${xhr.status}: ${error}`));
                    }
                }
            });
        });
    }

    /**
     * Parse arXiv API XML response
     * @param {XMLDocument} xmlData - Raw XML response
     * @returns {Object} Parsed data with totalResults and papers
     */
    parseApiResponse(xmlData) {
        const $xml = $(xmlData);
        const ns = {
            atom: 'http://www.w3.org/2005/Atom',
            arxiv: 'http://arxiv.org/schemas/atom'
        };

        // Extract total results
        const totalResults = parseInt($xml.find('opensearch\\:totalResults, totalResults').text()) || 0;
        
        // Extract paper entries
        const entries = [];
        $xml.find('entry').each(function() {
            const $entry = $(this);
            const id = $entry.find('id').text();
            const title = $entry.find('title').text().trim();
            const summary = $entry.find('summary').text().trim();
            const published = $entry.find('published').text();
            const updated = $entry.find('updated').text();
            
            // Extract authors
            const authors = [];
            $entry.find('author').each(function() {
                const name = $(this).find('name').text();
                if (name) authors.push(name);
            });
            
            // Extract categories
            const categories = [];
            $entry.find('category').each(function() {
                const term = $(this).attr('term');
                if (term) categories.push(term);
            });
            
            // Extract PDF link
            let pdfUrl = '';
            $entry.find('link').each(function() {
                const $link = $(this);
                if ($link.attr('title') === 'pdf' || $link.attr('type') === 'application/pdf') {
                    pdfUrl = $link.attr('href');
                }
            });

            entries.push({
                id: id.split('/').pop(), // Extract arXiv ID
                title: title,
                authors: authors,
                abstract: summary,
                published: published,
                updated: updated,
                pdf_url: pdfUrl,
                categories: categories
            });
        });

        return {
            totalResults: totalResults,
            papers: entries,
            queryValid: totalResults > 0
        };
    }

    /**
     * Log comprehensive test results
     */
    logTestResults() {
        console.log('📊 ========== API TEST RESULTS ==========');
        console.log(`📅 Test Time: ${this.testResults.lastTestTime}`);
        console.log(`🔗 Proxy Available: ${this.testResults.proxyAvailable ? '✅ Yes' : '❌ No'}`);
        console.log(`🌐 Direct Available: ${this.testResults.directAvailable ? '✅ Yes' : '❌ No'}`);
        console.log(`❓ Query Valid: ${this.testResults.queryValid ? '✅ Yes' : '❌ No'}`);
        console.log(`📈 Total Results: ${this.testResults.totalResults}`);
        
        if (this.testResults.errorMessages.length > 0) {
            console.log('⚠️ Error Messages:');
            this.testResults.errorMessages.forEach((msg, i) => {
                console.log(`  ${i + 1}. ${msg}`);
            });
        }
        
        // Provide recommendations
        console.log('💡 RECOMMENDATIONS:');
        if (this.testResults.proxyAvailable) {
            console.log('  • Use proxy connection for production');
        } else if (this.testResults.directAvailable) {
            console.log('  • Direct connection works (unusual!) - check CORS headers');
        } else {
            console.log('  • API unavailable - application will use sample data');
            console.log('  • Check proxy server is running on localhost:5000');
            console.log('  • Verify network connectivity to arXiv.org');
        }
        
        console.log('=========================================');
    }

    /**
     * Get recommended API endpoint based on test results
     * @returns {string} Recommended API endpoint URL
     */
    getRecommendedEndpoint() {
        if (this.testResults.proxyAvailable) {
            return this.proxyUrl;
        } else if (this.testResults.directAvailable) {
            return this.directUrl;
        } else {
            return null; // No API available
        }
    }

    /**
     * Quick test function for immediate validation
     * @returns {Promise<boolean>} True if any API connection works
     */
    async quickTest() {
        try {
            const results = await this.testAllConnections();
            return results.proxyAvailable || results.directAvailable;
        } catch (error) {
            console.error('Quick test failed:', error);
            return false;
        }
    }
}

// Create global instance for easy access
window.ApiTester = ApiTester;

// Auto-run test if this module is loaded standalone
if (typeof window !== 'undefined' && window.location.href.includes('test-api')) {
    $(document).ready(function() {
        const tester = new ApiTester();
        tester.testAllConnections().then(results => {
            // Display results in page if test page
            if ($('#test-results').length) {
                $('#test-results').html(`
                    <div class="alert ${results.proxyAvailable ? 'alert-success' : 'alert-warning'}">
                        <h4>API Test Results</h4>
                        <p><strong>Proxy Available:</strong> ${results.proxyAvailable ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Direct Available:</strong> ${results.directAvailable ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Query Valid:</strong> ${results.queryValid ? '✅ Yes' : '❌ No'}</p>
                        <p><strong>Total Results:</strong> ${results.totalResults}</p>
                        ${results.errorMessages.length > 0 ? 
                            `<p><strong>Errors:</strong><br>${results.errorMessages.join('<br>')}</p>` : ''}
                    </div>
                `);
            }
        });
    });
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApiTester;
}