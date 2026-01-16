// Content script for GMB Excel Export extension
// Runs on Google Maps pages

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
});

// Basic scraping function - extract business names from search results
function startScraping() {
    console.log('Starting GMB data scraping...');

    // This is a simplified example - in reality, you'd need more sophisticated
    // selectors and logic to handle Google's dynamic content
    const businessElements = document.querySelectorAll('[data-testid="place-card"] h3, .section-result-title span');

    scrapedData = Array.from(businessElements).map((element, index) => ({
        id: index + 1,
        name: element.textContent.trim(),
        url: window.location.href,
        scrapedAt: new Date().toISOString()
    }));

    console.log(`Scraped ${scrapedData.length} businesses`);

    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 10;
        chrome.runtime.sendMessage({
            action: 'progressUpdate',
            progress: Math.min(progress, 100)
        });

        if (progress >= 100) {
            clearInterval(progressInterval);

            // Export to Excel (placeholder - actual implementation in excel.js)
            exportToExcel(scrapedData);

            chrome.runtime.sendMessage({ action: 'exportComplete' });
            isScraping = false;
            updateOverlay();
        }
    }, 500);
}

// Placeholder for Excel export - will be implemented in excel.js
function exportToExcel(data) {
    console.log('Exporting data to Excel:', data);
    // TODO: Implement actual Excel export using SheetJS
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
} else {
    initialize();
}

function initialize() {
    injectOverlay();
    console.log('GMB Excel Export content script loaded on Google Maps');
}