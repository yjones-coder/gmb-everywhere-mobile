// Google Maps scraping logic for GMB Excel Export extension

// Access utilities from window.GMBUtils (loaded by utils.js which runs first)
// Use lazy initialization to ensure window.GMBUtils is available when needed
(function () {
    'use strict';

    // Lazy getters for utilities
    function getUtils() {
        if (!window.GMBUtils) {
            throw new Error('GMBUtils not loaded. Ensure utils.js is loaded before scraper.js');
        }
        return window.GMBUtils;
    }

    function getLogger() {
        return getUtils().loggers.scraper;
    }

    // Circuit breakers for scraping operations - created lazily
    let _scrapingCircuitBreakers = null;
    function getCircuitBreakers() {
        if (!_scrapingCircuitBreakers) {
            const CircuitBreaker = getUtils().CircuitBreaker;
            _scrapingCircuitBreakers = {
                mapsLoading: new CircuitBreaker({ failureThreshold: 3, recoveryTimeout: 30000 }),
                scrollLoading: new CircuitBreaker({ failureThreshold: 5, recoveryTimeout: 60000 }),
                businessExtraction: new CircuitBreaker({ failureThreshold: 3, recoveryTimeout: 30000 })
            };
        }
        return _scrapingCircuitBreakers;
    }

    class GMBScraper {
        constructor() {
            this.isRunning = false;
            this.scrapedData = [];
            this.onProgress = null;
            this.selectors = {
                // Common selectors for Google Maps business listings
                businessCards: [
                    '[data-testid="place-card"]',
                    '.section-result',
                    '.place-result',
                    '[jsaction*="placeCard"]',
                    '[role="listitem"]',
                    '.result-container',
                    '[data-item-id]'
                ],
                businessName: [
                    '[data-testid="place-card"] h3',
                    '.section-result-title span',
                    '.place-result h3',
                    '[jsaction*="placeCard"] .place-result h3',
                    'h3[aria-label]',
                    '[role="heading"]',
                    'span[aria-label*="name"]',
                    '.result-title'
                ],
                businessAddress: [
                    '[data-testid="place-card"] span[data-testid*="address"]',
                    '.section-result-location',
                    '.place-result .address',
                    '[aria-label*="address"]',
                    'span[data-item-type="address"]',
                    '.location-text',
                    '[jsaction*="address"]'
                ],
                businessPhone: [
                    '[data-testid*="phone"]',
                    '.section-result-phone-number',
                    '.place-result .phone',
                    '[aria-label*="phone"]',
                    'a[href^="tel:"]',
                    '[data-item-type="phone"]',
                    '.phone-number'
                ],
                businessRating: [
                    '[data-testid*="rating"]',
                    '.section-result-rating',
                    '.place-result .rating',
                    '[aria-label*="rating"]',
                    '.rating-stars',
                    '[data-rating]'
                ],
                businessReviews: [
                    '[data-testid*="reviews"]',
                    '.section-result-num-ratings',
                    '.place-result .reviews',
                    '[aria-label*="reviews"]',
                    '.review-count',
                    '[data-review-count]'
                ],
                businessCategories: [
                    '[data-testid*="category"]',
                    '.section-result-category',
                    '.place-result .category',
                    '[aria-label*="category"]',
                    '.business-type',
                    '[data-category]'
                ],
                businessWebsite: [
                    'a[data-testid*="website"]',
                    '.section-result-website a',
                    'a[href*="http"]',
                    '[aria-label*="website"]',
                    'a[data-website]',
                    '.website-link'
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
            const logger = getLogger();

            try {
                logger.info('Starting GMB scraping');

                // Wait for the page to be ready
                await this.waitForMapsReady();

                // Validate selectors against current DOM
                this.validateSelectors();

                // Scroll to load more results
                await this.scrollToLoadMore();

                // Extract business data
                const businesses = await this.extractBusinessData();

                this.scrapedData = businesses;
                logger.info('Scraping completed', { businessCount: businesses.length });

                return businesses;
            } catch (error) {
                logger.error('Scraping failed', { error: error.message });
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
            getLogger().info('Scraping stopped');
        }

        /**
         * Wait for Google Maps to be fully loaded
         */
        async waitForMapsReady() {
            const { retryWithBackoff } = getUtils();
            const logger = getLogger();
            const circuitBreakers = getCircuitBreakers();

            return await circuitBreakers.mapsLoading.execute(async () => {
                return await retryWithBackoff(async () => {
                    // Check for common Maps elements
                    const mapsLoaded = document.querySelector('#searchbox') ||
                        document.querySelector('[data-testid="searchbox"]') ||
                        document.querySelector('.searchbox');

                    if (!mapsLoaded) {
                        throw new Error('Google Maps elements not found');
                    }

                    logger.info('Google Maps appears to be loaded');
                }, {
                    maxRetries: 30,
                    baseDelay: 1000,
                    maxDelay: 5000,
                    shouldRetry: (error) => {
                        return true;
                    },
                    onRetry: (attempt, error, delay) => {
                        logger.info('Waiting for Maps to load', { attempt, delay });
                    }
                });
            });
        }

        /**
         * Scroll to load more business results
         */
        async scrollToLoadMore() {
            const { retryWithBackoff, waitForElement } = getUtils();
            const logger = getLogger();
            const circuitBreakers = getCircuitBreakers();

            return await circuitBreakers.scrollLoading.execute(async () => {
                const scrollContainer = document.querySelector('.section-scrollbox') ||
                    document.querySelector('[data-testid="section-scrollbox"]') ||
                    document.querySelector('.scrollable-show-more') ||
                    document.body;

                if (!scrollContainer) {
                    logger.warn('No scroll container found, skipping scroll loading');
                    return;
                }

                let previousHeight = scrollContainer.scrollHeight;
                let attempts = 0;
                const maxAttempts = 10;
                const self = this;

                await retryWithBackoff(async () => {
                    if (!self.isRunning) {
                        throw new Error('Scraping stopped');
                    }

                    scrollContainer.scrollTop = scrollContainer.scrollHeight;

                    // Wait for content to load with timeout
                    await waitForElement('.section-result, [data-testid="place-card"], .place-result', 3000)
                        .catch(() => {
                            // Continue if no new elements found within timeout
                        });

                    const currentHeight = scrollContainer.scrollHeight;
                    if (currentHeight === previousHeight) {
                        throw new Error('No new content loaded');
                    }

                    previousHeight = currentHeight;
                    attempts++;
                }, {
                    maxRetries: maxAttempts,
                    baseDelay: 2000,
                    maxDelay: 5000,
                    shouldRetry: (error) => {
                        return self.isRunning && error.message !== 'No new content loaded';
                    },
                    onRetry: (attempt, error, delay) => {
                        logger.info('Scroll attempt completed', { attempt, delay });
                    }
                }).catch(error => {
                    if (error.message === 'No new content loaded') {
                        logger.info('No more content to load');
                    } else if (error.message === 'Scraping stopped') {
                        logger.info('Scrolling stopped by user');
                    } else {
                        logger.warn('Error during scrolling', { error: error.message });
                    }
                });

                logger.info('Finished scrolling to load more results');
            });
        }

        /**
         * Extract business data from the page
         */
        async extractBusinessData() {
            const { retryWithBackoff, log } = getUtils();
            const logger = getLogger();
            const circuitBreakers = getCircuitBreakers();
            const self = this;

            return await circuitBreakers.businessExtraction.execute(async () => {
                const businesses = [];

                await retryWithBackoff(async () => {
                    for (const selector of self.selectors.businessCards) {
                        if (!self.isRunning) {
                            throw new Error('Scraping stopped');
                        }

                        const cards = document.querySelectorAll(selector);
                        if (cards.length > 0) {
                            logger.info('Found business cards', { selector, count: cards.length });

                            for (let i = 0; i < cards.length && self.isRunning; i++) {
                                const business = await self.extractSingleBusiness(cards[i], i + 1);
                                if (business) {
                                    businesses.push(business);
                                    if (self.onProgress) self.onProgress(businesses.length);
                                }
                            }

                            if (businesses.length > 0) {
                                return;
                            }
                        }
                    }

                    throw new Error('No business cards found with any selector');
                }, {
                    maxRetries: 3,
                    baseDelay: 1000,
                    shouldRetry: (error) => {
                        return self.isRunning && error.message.includes('No business cards found');
                    },
                    onRetry: (attempt, error, delay) => {
                        log('warn', `Business extraction retry ${attempt} in ${delay}ms: ${error.message}`);
                        self.validateSelectors();
                    }
                });

                return businesses;
            });
        }

        /**
         * Extract data from a single business card
         * @param {Element} card - Business card element
         * @param {number} index - Business index
         */
        async extractSingleBusiness(card, index) {
            const { retryWithBackoff, generateId, log } = getUtils();
            const self = this;

            return await retryWithBackoff(async () => {
                const business = {
                    id: generateId(),
                    index: index,
                    name: self.extractText(card, self.selectors.businessName, 'name'),
                    address: self.extractText(card, self.selectors.businessAddress, 'address'),
                    phone: self.extractText(card, self.selectors.businessPhone, 'phone'),
                    rating: self.extractRating(card),
                    reviewCount: self.extractReviewCount(card),
                    url: window.location.href,
                    scrapedAt: new Date().toISOString()
                };

                Object.keys(business).forEach(key => {
                    if (business[key] === null || business[key] === undefined) {
                        delete business[key];
                    }
                });

                if (!business.name) {
                    throw new Error(`Business ${index} has no name - extraction failed`);
                }

                return business;
            }, {
                maxRetries: 2,
                baseDelay: 500,
                shouldRetry: (error) => {
                    return self.isRunning;
                },
                onRetry: (attempt, error, delay) => {
                    log('warn', `Business ${index} extraction retry ${attempt} in ${delay}ms: ${error.message}`);
                }
            }).catch(error => {
                log('error', `Failed to extract business ${index} after retries`, error);
                return null;
            });
        }

        /**
         * Validate selectors by checking if they find elements
         */
        validateSelectors() {
            const logger = getLogger();
            logger.info('Validating selectors against current DOM');

            for (const [field, selectorArray] of Object.entries(this.selectors)) {
                let found = false;
                for (const selector of selectorArray) {
                    const elements = document.querySelectorAll(selector);
                    if (elements.length > 0) {
                        logger.info('Selector validation successful', { selector, field, count: elements.length });
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    logger.warn('No working selectors found', { field });
                }
            }
        }

        /**
         * Extract text content using multiple selectors
         * @param {Element} container - Container element
         * @param {Array<string>} selectors - Array of selectors to try
         * @param {string} fieldName - Name of the field for logging
         */
        extractText(container, selectors, fieldName = 'unknown') {
            const { sanitizeText } = getUtils();
            const logger = getLogger();

            for (const selector of selectors) {
                try {
                    const element = container.querySelector(selector);
                    if (element && element.textContent.trim()) {
                        logger.debug('Successfully extracted field', { fieldName, selector });
                        return sanitizeText(element.textContent);
                    }
                } catch (error) {
                    logger.warn('Error with selector', { selector, fieldName, error: error.message });
                }
            }
            const structuralValue = this.extractByStructure(container, fieldName);
            if (structuralValue) {
                logger.debug('Successfully extracted field using DOM structure', { fieldName });
                return structuralValue;
            }
            logger.warn('Failed to extract field', { fieldName });
            return null;
        }

        /**
         * Extract data using DOM structure analysis
         * @param {Element} container - Container element
         * @param {string} fieldName - Name of the field
         */
        extractByStructure(container, fieldName) {
            const { sanitizeText } = getUtils();
            const logger = getLogger();

            try {
                switch (fieldName) {
                    case 'name':
                        const headings = container.querySelectorAll('h1, h2, h3, h4, strong, b');
                        for (const h of headings) {
                            if (h.textContent.trim()) return sanitizeText(h.textContent);
                        }
                        break;
                    case 'address':
                        const possibleAddresses = container.querySelectorAll('span, div');
                        for (const el of possibleAddresses) {
                            const text = el.textContent.trim();
                            if (text && (text.includes(',') || /\d/.test(text)) && text.length > 10) {
                                return sanitizeText(text);
                            }
                        }
                        break;
                    case 'phone':
                        const telLinks = container.querySelectorAll('a[href^="tel:"]');
                        if (telLinks.length > 0) return telLinks[0].textContent.trim();
                        const allText = container.textContent;
                        const phoneMatch = allText.match(/(\+?\d[\d\s\-\(\)]{7,}\d)/);
                        if (phoneMatch) return phoneMatch[1].trim();
                        break;
                    default:
                        return null;
                }
            } catch (error) {
                logger.warn('Error in DOM structure analysis', { fieldName, error: error.message });
            }
            return null;
        }

        /**
         * Extract rating from business card
         * @param {Element} card - Business card element
         */
        extractRating(card) {
            const logger = getLogger();
            const ratingSelectors = this.selectors.businessRating;

            for (const selector of ratingSelectors) {
                try {
                    const ratingElement = card.querySelector(selector);
                    if (ratingElement) {
                        const ratingText = ratingElement.textContent || ratingElement.getAttribute('aria-label') || ratingElement.getAttribute('data-rating');
                        const ratingMatch = ratingText.match(/(\d+\.?\d*)/);
                        if (ratingMatch) {
                            logger.debug('Successfully extracted rating', { selector });
                            return parseFloat(ratingMatch[1]);
                        }
                    }
                } catch (error) {
                    logger.warn('Error with rating selector', { selector, error: error.message });
                }
            }
            logger.warn('Failed to extract rating with any selector');
            return null;
        }

        /**
         * Extract review count from business card
         * @param {Element} card - Business card element
         */
        extractReviewCount(card) {
            const logger = getLogger();
            const reviewSelectors = this.selectors.businessReviews;

            for (const selector of reviewSelectors) {
                try {
                    const reviewElement = card.querySelector(selector);
                    if (reviewElement) {
                        const reviewText = reviewElement.textContent || reviewElement.getAttribute('aria-label') || reviewElement.getAttribute('data-review-count');
                        const reviewMatch = reviewText.match(/(\d+)/);
                        if (reviewMatch) {
                            logger.debug('Successfully extracted review count', { selector });
                            return parseInt(reviewMatch[1]);
                        }
                    }
                } catch (error) {
                    logger.warn('Error with review selector', { selector, error: error.message });
                }
            }
            logger.warn('Failed to extract review count with any selector');
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

    // Create global instance on window
    window.gmbScraper = new GMBScraper();
    window.GMBScraper = GMBScraper;

})();
