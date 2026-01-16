// Excel generation using SheetJS for GMB Excel Export extension

// Access utilities from window.GMBUtils (loaded by utils.js which runs first)
(function () {
    'use strict';

    // Lazy getters for utilities
    function getUtils() {
        if (!window.GMBUtils) {
            throw new Error('GMBUtils not loaded. Ensure utils.js is loaded before excel.js');
        }
        return window.GMBUtils;
    }

    function getLogger() {
        return getUtils().loggers.excel;
    }

    class ExcelExporter {
        constructor() {
            this.sheetJS = null;
            this.isLoaded = false;
        }

        /**
         * Load SheetJS library
         */
        async loadSheetJS() {
            if (this.isLoaded) return;

            if (typeof XLSX !== 'undefined') {
                this.sheetJS = XLSX;
                this.isLoaded = true;
                getLogger().info('SheetJS library loaded');
            } else {
                throw new Error('SheetJS library not found. Please ensure xlsx.full.min.js is included in the extension.');
            }
        }


        /**
         * Export business data to Excel file
         * @param {Array} businessData - Array of business objects
         * @param {string} filename - Output filename
         */
        async exportToExcel(businessData, filename = null) {
            const logger = getLogger();

            try {
                await this.loadSheetJS();

                if (!businessData || businessData.length === 0) {
                    throw new Error('No data to export');
                }

                // Generate filename if not provided
                if (!filename) {
                    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
                    filename = `gmb_export_${timestamp}.xlsx`;
                }

                // Create workbook
                const workbook = this.sheetJS.utils.book_new();

                // Add businesses sheet
                const businessWorksheet = this.createBusinessesSheet(businessData);
                this.sheetJS.utils.book_append_sheet(workbook, businessWorksheet, 'Businesses');

                // Add reviews sheet if reviews data exists
                const reviewsData = this.extractReviewsData(businessData);
                if (reviewsData && reviewsData.length > 0) {
                    const reviewsWorksheet = this.createReviewsSheet(reviewsData);
                    this.sheetJS.utils.book_append_sheet(workbook, reviewsWorksheet, 'Reviews');
                }

                // Add metadata sheet
                const metadata = this.createMetadataSheet(businessData);
                const metadataWorksheet = this.sheetJS.utils.json_to_sheet(metadata);
                this.sheetJS.utils.book_append_sheet(workbook, metadataWorksheet, 'Export Info');

                // Write file
                this.sheetJS.writeFile(workbook, filename);

                logger.info('Excel export completed', { filename, count: businessData.length });
                return { success: true, filename, count: businessData.length };

            } catch (error) {
                logger.error('Excel export failed', { error: error.message });
                throw error;
            }
        }

        /**
         * Create businesses worksheet with formatting
         * @param {Array} data - Business data
         */
        createBusinessesSheet(data) {
            const cleanData = this.prepareDataForExcel(data);
            const worksheet = this.sheetJS.utils.json_to_sheet(cleanData);

            // Set column widths
            worksheet['!cols'] = [
                { wch: 5 },  // #
                { wch: 30 }, // Business Name
                { wch: 40 }, // Address
                { wch: 15 }, // Phone
                { wch: 8 },  // Rating
                { wch: 8 },  // Reviews
                { wch: 50 }, // Google Maps URL
                { wch: 20 }  // Scraped At
            ];

            return worksheet;
        }

        /**
         * Prepare business data for Excel export
         * @param {Array} data - Raw business data
         */
        prepareDataForExcel(data) {
            const { formatDateForExcel } = getUtils();

            return data.map((business, index) => ({
                '#': index + 1,
                'Business Name': business.name || '',
                'Address': business.address || '',
                'Phone': business.phone || '',
                'Rating': business.rating || '',
                'Reviews': business.reviewCount || '',
                'Google Maps URL': business.url || '',
                'Scraped At': business.scrapedAt ? formatDateForExcel(business.scrapedAt) : ''
            }));
        }

        /**
         * Extract reviews data from business data
         * @param {Array} data - Business data
         */
        extractReviewsData(data) {
            const { formatDateForExcel } = getUtils();
            const reviews = [];

            data.forEach((business, businessIndex) => {
                if (business.reviews && Array.isArray(business.reviews)) {
                    business.reviews.forEach((review, reviewIndex) => {
                        reviews.push({
                            'Business #': businessIndex + 1,
                            'Business Name': business.name || '',
                            'Review Author': review.author || '',
                            'Rating': review.rating || '',
                            'Review Text': review.text || '',
                            'Review Date': review.date ? formatDateForExcel(review.date) : '',
                            'Review URL': review.url || ''
                        });
                    });
                }
            });
            return reviews;
        }

        /**
         * Create reviews worksheet
         * @param {Array} reviewsData - Reviews data
         */
        createReviewsSheet(reviewsData) {
            const worksheet = this.sheetJS.utils.json_to_sheet(reviewsData);

            // Set column widths
            worksheet['!cols'] = [
                { wch: 10 }, // Business #
                { wch: 30 }, // Business Name
                { wch: 20 }, // Review Author
                { wch: 8 },  // Rating
                { wch: 50 }, // Review Text
                { wch: 15 }, // Review Date
                { wch: 50 }  // Review URL
            ];

            return worksheet;
        }

        /**
         * Create metadata sheet with export information
         * @param {Array} data - Business data
         */
        createMetadataSheet(data) {
            const { formatDateForExcel } = getUtils();

            return [
                { Field: 'Export Date', Value: formatDateForExcel(new Date()) },
                { Field: 'Total Businesses', Value: data.length },
                { Field: 'Source', Value: 'Google Maps' },
                { Field: 'Extension Version', Value: '1.0.0' },
                { Field: 'URL', Value: window.location.href }
            ];
        }

        /**
         * Validate business data structure
         * @param {Array} data - Data to validate
         */
        validateData(data) {
            const { log } = getUtils();

            if (!Array.isArray(data)) {
                throw new Error('Data must be an array');
            }

            if (data.length === 0) {
                throw new Error('No data to export');
            }

            // Check if data has required fields
            const requiredFields = ['name'];
            const firstItem = data[0];

            const hasRequiredFields = requiredFields.some(field =>
                firstItem.hasOwnProperty(field) && firstItem[field]
            );

            if (!hasRequiredFields) {
                log('warn', 'Data may not have expected structure', firstItem);
            }

            return true;
        }

        /**
         * Get export statistics
         * @param {Array} data - Business data
         */
        getExportStats(data) {
            const stats = {
                total: data.length,
                withNames: data.filter(b => b.name).length,
                withAddresses: data.filter(b => b.address).length,
                withPhones: data.filter(b => b.phone).length,
                withRatings: data.filter(b => b.rating).length,
                withReviews: data.filter(b => b.reviewCount).length
            };

            return stats;
        }
    }

    // Create global instance on window
    window.excelExporter = new ExcelExporter();
    window.ExcelExporter = ExcelExporter;

})();
