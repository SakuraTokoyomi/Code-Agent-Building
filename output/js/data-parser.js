/**
 * Data Parser for arXiv CS Daily
 * Handles XML parsing, data extraction, and normalization
 */

class DataParser {
    constructor() {
        this.ATOM_NS = 'http://www.w3.org/2005/Atom';
        this.ARXIV_NS = 'http://arxiv.org/schemas/atom';
        this.DEFAULT_CATEGORY = 'cs.*';
    }

    /**
     * Parse XML response from arXiv API
     * @param {string|Document} xml - XML response
     * @returns {Array} Array of parsed paper objects
     */
    parseXmlResponse(xml) {
        try {
            let xmlDoc;
            
            // Handle both string and Document input
            if (typeof xml === 'string') {
                xmlDoc = $.parseXML(xml);
            } else {
                xmlDoc = xml;
            }

            const $xml = $(xmlDoc);
            const entries = $xml.find('entry');
            
            if (entries.length === 0) {
                console.warn('DataParser: No entries found in XML response');
                return [];
            }

            const papers = [];
            entries.each((index, entry) => {
                try {
                    const paper = this.parseEntry($(entry));
                    if (paper) {
                        papers.push(paper);
                    }
                } catch (error) {
                    console.error(`DataParser: Failed to parse entry ${index}:`, error);
                }
            });

            console.log(`DataParser: Successfully parsed ${papers.length} papers`);
            return papers;
        } catch (error) {
            console.error('DataParser: Failed to parse XML response:', error);
            throw new Error('Failed to parse arXiv API response');
        }
    }

    /**
     * Parse individual entry element
     * @param {jQuery} $entry - jQuery object for entry element
     * @returns {Object|null} Parsed paper object or null
     */
    parseEntry($entry) {
        try {
            // Extract basic information
            const id = this.extractId($entry);
            const title = this.extractTitle($entry);
            const authors = this.extractAuthors($entry);
            const summary = this.extractSummary($entry);
            const published = this.extractPublished($entry);
            const updated = this.extractUpdated($entry);
            const pdfLink = this.extractPdfLink($entry);
            const categories = this.extractCategories($entry);
            const doi = this.extractDoi($entry);
            const comment = this.extractComment($entry);

            // Validate required fields
            if (!id || !title) {
                console.warn('DataParser: Entry missing required fields (id or title)');
                return null;
            }

            // Normalize data
            const normalizedTitle = this.normalizeTitle(title);
            const normalizedAuthors = this.normalizeAuthors(authors);
            const normalizedCategories = this.normalizeCategories(categories);
            const formattedDates = this.formatDates(published, updated);
            const arxivId = this.extractArxivId(id);

            return {
                id: arxivId,
                fullId: id,
                title: normalizedTitle,
                authors: normalizedAuthors,
                abstract: summary,
                published: published,
                updated: updated,
                publishedFormatted: formattedDates.published,
                updatedFormatted: formattedDates.updated,
                pdfLink: pdfLink,
                categories: normalizedCategories,
                doi: doi,
                comment: comment,
                isNew: this.isNewPaper(updated),
                primaryCategory: this.getPrimaryCategory(normalizedCategories)
            };
        } catch (error) {
            console.error('DataParser: Failed to parse entry:', error);
            return null;
        }
    }

    /**
     * Extract arXiv ID from full ID
     * @param {string} fullId - Full arXiv ID (e.g., "http://arxiv.org/abs/2301.12345v1")
     * @returns {string} arXiv ID (e.g., "2301.12345")
     */
    extractArxivId(fullId) {
        if (!fullId) return '';
        
        // Extract the arXiv ID part (e.g., 2301.12345v1)
        const match = fullId.match(/arxiv\.org\/abs\/([\d\.]+v?\d*)/i);
        if (match && match[1]) {
            // Remove version suffix if present
            return match[1].replace(/v\d+$/, '');
        }
        
        return fullId;
    }

    /**
     * Extract ID from entry
     * @param {jQuery} $entry - jQuery object for entry
     * @returns {string} ID
     */
    extractId($entry) {
        return $entry.find('id').text().trim();
    }

    /**
     * Extract and normalize title
     * @param {jQuery} $entry - jQuery object for entry
     * @returns {string} Title
     */
    extractTitle($entry) {
        return $entry.find('title').text().trim();
    }

    /**
     * Extract authors
     * @param {jQuery} $entry - jQuery object for entry
     * @returns {Array} Array of author objects
     */
    extractAuthors($entry) {
        const authors = [];
        $entry.find('author').each((index, author) => {
            const $author = $(author);
            const name = $author.find('name').text().trim();
            if (name) {
                authors.push({
                    name: name,
                    affiliation: $author.find('arxiv\\:affiliation, affiliation').text().trim() || ''
                });
            }
        });
        return authors;
    }

    /**
     * Extract abstract/summary
     * @param {jQuery} $entry - jQuery object for entry
     * @returns {string} Abstract
     */
    extractSummary($entry) {
        return $entry.find('summary').text().trim();
    }

    /**
     * Extract published date
     * @param {jQuery} $entry - jQuery object for entry
     * @returns {string} Published date
     */
    extractPublished($entry) {
        return $entry.find('published').text().trim();
    }

    /**
     * Extract updated date
     * @param {jQuery} $entry - jQuery object for entry
     * @returns {string} Updated date
     */
    extractUpdated($entry) {
        return $entry.find('updated').text().trim();
    }

    /**
     * Extract PDF link
     * @param {jQuery} $entry - jQuery object for entry
     * @returns {string} PDF link
     */
    extractPdfLink($entry) {
        let pdfLink = '';
        $entry.find('link').each((index, link) => {
            const $link = $(link);
            const type = $link.attr('type') || '';
            const title = $link.attr('title') || '';
            
            if (type === 'application/pdf' || title.toLowerCase() === 'pdf') {
                pdfLink = $link.attr('href') || '';
            }
        });
        return pdfLink;
    }

    /**
     * Extract categories
     * @param {jQuery} $entry - jQuery object for entry
     * @returns {Array} Array of category strings
     */
    extractCategories($entry) {
        const categories = [];
        $entry.find('category').each((index, category) => {
            const term = $(category).attr('term');
            if (term) {
                categories.push(term);
            }
        });
        return categories;
    }

    /**
     * Extract DOI
     * @param {jQuery} $entry - jQuery object for entry
     * @returns {string} DOI
     */
    extractDoi($entry) {
        // DOI might be in arxiv:doi element or in comment
        const doiElement = $entry.find('arxiv\\:doi, doi').first();
        if (doiElement.length) {
            return doiElement.text().trim();
        }
        return '';
    }

    /**
     * Extract comment
     * @param {jQuery} $entry - jQuery object for entry
     * @returns {string} Comment
     */
    extractComment($entry) {
        return $entry.find('arxiv\\:comment, comment').text().trim();
    }

    /**
     * Normalize title (remove newlines, extra spaces)
     * @param {string} title - Raw title
     * @returns {string} Normalized title
     */
    normalizeTitle(title) {
        if (!title) return '';
        
        return title
            .replace(/\n/g, ' ')          // Replace newlines with spaces
            .replace(/\s+/g, ' ')         // Replace multiple spaces with single space
            .replace(/^\s+|\s+$/g, '')    // Trim
            .replace(/\\n/g, ' ')         // Replace escaped newlines
            .replace(/\\"/g, '"')         // Unescape quotes
            .replace(/\\'/g, "'");        // Unescape single quotes
    }

    /**
     * Normalize authors
     * @param {Array} authors - Raw author objects
     * @returns {Array} Normalized author objects
     */
    normalizeAuthors(authors) {
        return authors.map(author => ({
            name: author.name.replace(/\s+/g, ' ').trim(),
            affiliation: author.affiliation.replace(/\s+/g, ' ').trim()
        }));
    }

    /**
     * Normalize categories
     * @param {Array} categories - Raw category strings
     * @returns {Array} Normalized category strings
     */
    normalizeCategories(categories) {
        return categories
            .filter(cat => cat && typeof cat === 'string')
            .map(cat => cat.trim())
            .filter((cat, index, self) => self.indexOf(cat) === index); // Remove duplicates
    }

    /**
     * Format dates for display
     * @param {string} published - Published date string
     * @param {string} updated - Updated date string
     * @returns {Object} Formatted dates
     */
    formatDates(published, updated) {
        const formatDate = (dateString) => {
            if (!dateString) return '';
            
            try {
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return dateString;
                
                // Format as relative time if recent
                const now = new Date();
                const diffMs = now - date;
                const diffHours = diffMs / (1000 * 60 * 60);
                
                if (diffHours < 24) {
                    if (diffHours < 1) {
                        const diffMinutes = Math.floor(diffMs / (1000 * 60));
                        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
                    }
                    return `${Math.floor(diffHours)} hour${Math.floor(diffHours) !== 1 ? 's' : ''} ago`;
                }
                
                // Format as date
                return date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            } catch (error) {
                console.error('DataParser: Failed to format date:', error);
                return dateString;
            }
        };

        return {
            published: formatDate(published),
            updated: formatDate(updated)
        };
    }

    /**
     * Check if paper is new (updated in last 24 hours)
     * @param {string} updated - Updated date string
     * @returns {boolean} True if paper is new
     */
    isNewPaper(updated) {
        if (!updated) return false;
        
        try {
            const updatedDate = new Date(updated);
            const now = new Date();
            const diffMs = now - updatedDate;
            const diffHours = diffMs / (1000 * 60 * 60);
            
            return diffHours < 24;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get primary category from list
     * @param {Array} categories - Array of categories
     * @returns {string} Primary category
     */
    getPrimaryCategory(categories) {
        if (!categories || categories.length === 0) {
            return this.DEFAULT_CATEGORY;
        }
        
        // Try to find a CS category first
        const csCategory = categories.find(cat => cat.startsWith('cs.'));
        if (csCategory) {
            return csCategory;
        }
        
        // Return first category
        return categories[0];
    }

    /**
     * Parse total results from XML response
     * @param {string|Document} xml - XML response
     * @returns {number} Total results count
     */
    parseTotalResults(xml) {
        try {
            let xmlDoc;
            
            if (typeof xml === 'string') {
                xmlDoc = $.parseXML(xml);
            } else {
                xmlDoc = xml;
            }

            const $xml = $(xmlDoc);
            const totalResults = $xml.find('opensearch\\:totalResults, totalResults').text();
            
            return parseInt(totalResults) || 0;
        } catch (error) {
            console.error('DataParser: Failed to parse total results:', error);
            return 0;
        }
    }

    /**
     * Parse start index from XML response
     * @param {string|Document} xml - XML response
     * @returns {number} Start index
     */
    parseStartIndex(xml) {
        try {
            let xmlDoc;
            
            if (typeof xml === 'string') {
                xmlDoc = $.parseXML(xml);
            } else {
                xmlDoc = xml;
            }

            const $xml = $(xmlDoc);
            const startIndex = $xml.find('opensearch\\:startIndex, startIndex').text();
            
            return parseInt(startIndex) || 0;
        } catch (error) {
            console.error('DataParser: Failed to parse start index:', error);
            return 0;
        }
    }

    /**
     * Parse items per page from XML response
     * @param {string|Document} xml - XML response
     * @returns {number} Items per page
     */
    parseItemsPerPage(xml) {
        try {
            let xmlDoc;
            
            if (typeof xml === 'string') {
                xmlDoc = $.parseXML(xml);
            } else {
                xmlDoc = xml;
            }

            const $xml = $(xmlDoc);
            const itemsPerPage = $xml.find('opensearch\\:itemsPerPage, itemsPerPage').text();
            
            return parseInt(itemsPerPage) || 0;
        } catch (error) {
            console.error('DataParser: Failed to parse items per page:', error);
            return 0;
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataParser;
}