// Content script for GMB Excel Export extension
// Runs on Google Maps pages

// Access utilities from window.GMBUtils (loaded by utils.js which runs first)
(function () {
    'use strict';

    // Lazy getters for utilities
    function getUtils() {
        if (!window.GMBUtils) {
            console.error('GMBUtils not loaded. Ensure utils.js is loaded before content.js');
            return null;
        }
        return window.GMBUtils;
    }

    function getLogger() {
        const utils = getUtils();
        return utils ? utils.loggers.content : {
            info: console.log,
            warn: console.warn,
            error: console.error
        };
    }

    let isScraping = false;
    let scrapedData = [];

    // Inject a small overlay to indicate the extension is active
    function injectOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'gmb-export-overlay';
        overlay.innerHTML = `
        <div style="
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(0, 123, 255, 0.9);
          color: white;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 10000;
          display: none;
        ">
          GMB Export Active
        </div>
      `;
        document.body.appendChild(overlay);
    }

    // Show/hide overlay based on scraping state
    function updateOverlay() {
        const overlay = document.getElementById('gmb-export-overlay');
        if (overlay) {
            overlay.style.display = isScraping ? 'block' : 'none';
        }
    }

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        const utils = getUtils();

        // Use reliable message listener if available
        if (utils && utils.createReliableMessageListener) {
            const reliableHandler = utils.createReliableMessageListener(handleMessage);
            return reliableHandler(message, sender, sendResponse);
        }

        // Fallback to direct handling
        return handleMessage(message, sender, sendResponse);
    });

    function handleMessage(message, sender, sendResponse) {
        switch (message.action) {
            case 'startScraping':
                if (isScraping) {
                    sendResponse({ success: false, error: 'Already scraping' });
                    return;
                }

                isScraping = true;
                scrapedData = [];
                updateOverlay();

                // Start the scraping process
                startScraping();

                sendResponse({ success: true });
                break;

            case 'stopScraping':
                isScraping = false;
                updateOverlay();
                sendResponse({ success: true });
                break;

            default:
                sendResponse({ success: false, error: 'Unknown action' });
        }
    }

    // Basic scraping function - extract business data from search results
    async function startScraping() {
        const logger = getLogger();
        const utils = getUtils();

        logger.info('Starting GMB data scraping');

        try {
            // Check if gmbScraper is available (from scraper.js)
            if (!window.gmbScraper) {
                throw new Error('GMB Scraper not loaded. Ensure scraper.js is loaded before content.js');
            }

            // Set up progress callback
            window.gmbScraper.onProgress = (count) => {
                const progress = Math.min((count / 50) * 100, 90);

                if (utils && utils.sendMessageReliably) {
                    utils.sendMessageReliably({
                        action: 'progressUpdate',
                        progress: Math.round(progress)
                    }, { target: 'background' }).catch(error => {
                        logger.warn('Failed to send progress update', { error: error.message });
                    });
                } else {
                    // Fallback to direct message
                    chrome.runtime.sendMessage({
                        action: 'progressUpdate',
                        progress: Math.round(progress)
                    });
                }
            };

            // Use the GMBScraper for proper data extraction
            scrapedData = await window.gmbScraper.startScraping();

            logger.info(`Scraped ${scrapedData.length} businesses`, { count: scrapedData.length });

            // Send final progress and export
            if (utils && utils.sendMessageReliably) {
                await utils.sendMessageReliably({
                    action: 'progressUpdate',
                    progress: 100
                }, { target: 'background' }).catch(error => {
                    logger.warn('Failed to send final progress', { error: error.message });
                });
            } else {
                chrome.runtime.sendMessage({
                    action: 'progressUpdate',
                    progress: 100
                });
            }

            // Export to Excel
            await exportToExcel(scrapedData);

            if (utils && utils.sendMessageReliably) {
                await utils.sendMessageReliably({ action: 'exportComplete' }, { target: 'background' }).catch(error => {
                    logger.warn('Failed to send export complete', { error: error.message });
                });
            } else {
                chrome.runtime.sendMessage({ action: 'exportComplete' });
            }

            isScraping = false;
            updateOverlay();
        } catch (error) {
            logger.error('Scraping failed', { error: error.message });

            if (utils && utils.sendMessageReliably) {
                await utils.sendMessageReliably({ action: 'exportError', error: error.message }, { target: 'background' }).catch(err => {
                    logger.warn('Failed to send export error', { error: err.message });
                });
            } else {
                chrome.runtime.sendMessage({ action: 'exportError', error: error.message });
            }

            isScraping = false;
            updateOverlay();
        }
    }

    // Use the ExcelExporter from excel.js
    async function exportToExcel(data) {
        const logger = getLogger();

        try {
            // Check if excelExporter is available (from excel.js)
            if (!window.excelExporter) {
                throw new Error('Excel Exporter not loaded. Ensure excel.js is loaded before content.js');
            }

            const result = await window.excelExporter.exportToExcel(data);
            logger.info('Excel export completed', result);
        } catch (error) {
            logger.error('Excel export failed', { error: error.message });
        }
    }

    // Initialize when DOM is ready
    function initialize() {
        injectOverlay();
        getLogger().info('GMB Excel Export content script loaded on Google Maps');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

})();
