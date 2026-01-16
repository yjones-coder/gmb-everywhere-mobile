// Excel generation using SheetJS for GMB Excel Export extension

class ExcelExporter {
    constructor() {
        this.sheetJS = null;
        this.isLoaded = false;
    }

    /**
     * Load SheetJS library (this would need to be included in the extension)
     * In a real implementation, you'd include xlsx.full.min.js in the extension
     */
    async loadSheetJS() {
        if (this.isLoaded) return;

        // In a real extension, SheetJS would be included as a content script or web accessible resource
        // For now, we'll use a placeholder implementation
        if (typeof XLSX !== 'undefined') {
            this.sheetJS = XLSX;
            this.isLoaded = true;
            log('info', 'SheetJS library loaded');
        } else {
            log('warn', 'SheetJS library not found, using fallback implementation');
            // Fallback implementation for demonstration
            this.sheetJS = this.createFallbackXLSX();
            this.isLoaded = true;
        }
    }

    /**
     * Create a fallback XLSX implementation for demonstration
     * In production, use the actual SheetJS library
     */
    createFallbackXLSX() {
        return {
            utils: {
                json_to_sheet: (data) => {
                    // Simple CSV-like conversion for demonstration
                    if (!data || data.length === 0) return {};

                    const headers = Object.keys(data[0]);
                    const rows = data.map(row =>
                        headers.map(header => row[header] || '')
                    );

                    return {
                        '!ref': `A1:${String.fromCharCode(65 + headers.length - 1)}${rows.length + 1}`,
                        A1: headers,
                        ...rows.reduce((acc, row, index) => {
                            row.forEach((cell, cellIndex) => {
                                acc[`${String.fromCharCode(65 + cellIndex)}${index + 2}`] = cell;
                            });
                            return acc;
                        }, {})
                    };
                },
                book_new: () => ({
                    SheetNames: [],
                    Sheets: {}
                }),
                book_append_sheet: (workbook, worksheet, sheetName) => {
                    workbook.SheetNames.push(sheetName);
                    workbook.Sheets[sheetName] = worksheet;
                }
            },
            writeFile: (workbook, filename) => {
                log('info', `Would export to ${filename}`, workbook);
                // In a real implementation, this would trigger a download
                alert(`Excel export would create: ${filename}\n\nData: ${JSON.stringify(workbook, null, 2)}`);
            }
        };
    }

    /**
     * Export business data to Excel file
     * @param {Array} businessData - Array of business objects
     * @param {string} filename - Output filename
     */
    async exportToExcel(businessData, filename = null) {
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

            // Prepare data for Excel
            const cleanData = this.prepareDataForExcel(businessData);

            // Create worksheet
            const worksheet = this.sheetJS.utils.json_to_sheet(cleanData);

            // Create workbook
            const workbook = this.sheetJS.utils.book_new();
            this.sheetJS.utils.book_append_sheet(workbook, worksheet, 'Businesses');

            // Add metadata sheet
            const metadata = this.createMetadataSheet(businessData);
            const metadataWorksheet = this.sheetJS.utils.json_to_sheet(metadata);
            this.sheetJS.utils.book_append_sheet(workbook, metadataWorksheet, 'Export Info');

            // Write file
            this.sheetJS.writeFile(workbook, filename);

            log('info', `Exported ${businessData.length} businesses to ${filename}`);
            return { success: true, filename, count: businessData.length };

        } catch (error) {
            log('error', 'Excel export failed', error);
            throw error;
        }
    }

    /**
     * Prepare business data for Excel export
     * @param {Array} data - Raw business data
     */
    prepareDataForExcel(data) {
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
     * Create metadata sheet with export information
     * @param {Array} data - Business data
     */
    createMetadataSheet(data) {
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

// Create global instance
const excelExporter = new ExcelExporter();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExcelExporter;
}