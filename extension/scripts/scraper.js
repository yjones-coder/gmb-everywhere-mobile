// Google Maps scraping logic for GMB Excel Export extension

class GMBScraper {
    constructor() {
        this.isRunning = false;
        this.scrapedData = [];
        this.selectors = {
            // Common selectors for Google Maps business listings
            businessCards: [
                '[data-testid="place-card"]',
                '.section-result',
                '.place-result',
                '[jsaction*="placeCard"]'
            ],
            businessName: [
                '[data-testid="place-card"] h3',
                '.section-result-title span',
                '.place-result h3',
                '[jsaction*="placeCard"] .place-result h3'
            ],
            businessAddress: [
                '[data-testid="place-card"] span[data-testid*="address"]',
                '.section-result-location',
                '.place-result .address'
            ],
            businessPhone: [
                '[data-testid*="phone"]',
                '.section-result-phone-number',
                '.place-result .phone'
            ],
            businessRating: [
                '[data-testid*="rating"]',
                '.section-result-rating',
                '.place-result .rating'
            ],
            businessReviews: [
                '[data-testid*="reviews"]',
                '.section-result-num-ratings',
                '.place-result .reviews'
            ]
        };
    }

    /**
     * Start scraping Google Maps business data
     * @returns {Promise<Array>} Scraped business data
     */
    async startScraping() {
        if (this.isRunning) {
            throw new Error('Scraping already in progress');
        }

        this.isRunning = true;
        this.scrapedData = [];

        try {
            log('info', 'Starting GMB scraping');

            // Wait for the page to be ready
            await this.waitForMapsReady();

            // Scroll to load more results
            await this.scrollToLoadMore();

            // Extract business data
            const businesses = await this.extractBusinessData();

            this.scrapedData = businesses;
            log('info', `Scraped ${businesses.length} businesses`);

            return businesses;
        } catch (error) {
            log('error', 'Scraping failed', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Stop the scraping process
     */
    stopScraping() {
        this.isRunning = false;
        log('info', 'Scraping stopped');
    }

    /**
     * Wait for Google Maps to be fully loaded
     */
    async waitForMapsReady() {
        const maxAttempts = 30;
        let attempts = 0;

        while (attempts < maxAttempts) {
            // Check for common Maps elements
            const mapsLoaded = document.querySelector('#searchbox') ||
                document.querySelector('[data-testid="searchbox"]') ||
                document.querySelector('.searchbox');

            if (mapsLoaded) {
                log('info', 'Google Maps appears to be loaded');
                return;
            }

            await this.delay(1000);
            attempts++;
        }

        throw new Error('Google Maps did not load within expected time');
    }

    /**
     * Scroll to load more business results
     */
    async scrollToLoadMore() {
        const scrollContainer = document.querySelector('.section-scrollbox') ||
            document.querySelector('[data-testid="section-scrollbox"]') ||
            document.querySelector('.scrollable-show-more') ||
            document.body;

        if (!scrollContainer) {
            log('warn', 'No scroll container found, skipping scroll loading');
            return;
        }

        let previousHeight = scrollContainer.scrollHeight;
        let attempts = 0;
        const maxAttempts = 10;

        while (attempts < maxAttempts && this.isRunning) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;

            await this.delay(2000); // Wait for content to load

            const currentHeight = scrollContainer.scrollHeight;
            if (currentHeight === previousHeight) {
                // No new content loaded
                break;
            }

            previousHeight = currentHeight;
            attempts++;
        }

        log('info', 'Finished scrolling to load more results');
    }

    /**
     * Extract business data from the page
     */
    async extractBusinessData() {
        const businesses = [];

        // Try different selectors to find business listings
        for (const selector of this.selectors.businessCards) {
            const cards = document.querySelectorAll(selector);
            if (cards.length > 0) {
                log('info', `Found ${cards.length} business cards using selector: ${selector}`);

                for (let i = 0; i < cards.length && this.isRunning; i++) {
                    const business = await this.extractSingleBusiness(cards[i], i + 1);
                    if (business) {
                        businesses.push(business);
                    }
                }

                // If we found businesses with this selector, use it
                if (businesses.length > 0) {
                    break;
                }
            }
        }

        return businesses;
    }

    /**
     * Extract data from a single business card
     * @param {Element} card - Business card element
     * @param {number} index - Business index
     */
    async extractSingleBusiness(card, index) {
        try {
            const business = {
                id: generateId(),
                index: index,
                name: this.extractText(card, this.selectors.businessName),
                address: this.extractText(card, this.selectors.businessAddress),
                phone: this.extractText(card, this.selectors.businessPhone),
                rating: this.extractRating(card),
                reviewCount: this.extractReviewCount(card),
                url: window.location.href,
                scrapedAt: new Date().toISOString()
            };

            // Clean up empty fields
            Object.keys(business).forEach(key => {
                if (business[key] === null || business[key] === undefined) {
                    delete business[key];
                }
            });

            return business;
        } catch (error) {
            log('error', `Failed to extract business ${index}`, error);
            return null;
        }
    }

    /**
     * Extract text content using multiple selectors
     * @param {Element} container - Container element
     * @param {Array<string>} selectors - Array of selectors to try
     */
    extractText(container, selectors) {
        for (const selector of selectors) {
            const element = container.querySelector(selector);
            if (element) {
                return sanitizeText(element.textContent);
            }
        }
        return null;
    }

    /**
     * Extract rating from business card
     * @param {Element} card - Business card element
     */
    extractRating(card) {
        const ratingElement = card.querySelector('[aria-label*="rating"]') ||
            card.querySelector('.rating') ||
            card.querySelector('[data-testid*="rating"]');

        if (ratingElement) {
            const ratingText = ratingElement.textContent || ratingElement.getAttribute('aria-label');
            const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
            return ratingMatch ? parseFloat(ratingMatch[1]) : null;
        }

        return null;
    }

    /**
     * Extract review count from business card
     * @param {Element} card - Business card element
     */
    extractReviewCount(card) {
        const reviewElement = card.querySelector('[aria-label*="reviews"]') ||
            card.querySelector('.reviews') ||
            card.querySelector('[data-testid*="reviews"]');

        if (reviewElement) {
            const reviewText = reviewElement.textContent || reviewElement.getAttribute('aria-label');
            const reviewMatch = reviewText.match(/(\d+)/);
            return reviewMatch ? parseInt(reviewMatch[1]) : null;
        }

        return null;
    }

    /**
     * Utility function for delays
     * @param {number} ms - Milliseconds to delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Create global instance
const gmbScraper = new GMBScraper();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GMBScraper;
}