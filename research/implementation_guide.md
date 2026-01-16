# GMB Excel Export - Implementation Reference Guide

## Overview

This guide provides comprehensive implementation best practices and code patterns for building a Chrome extension that extracts business data from Google Maps and exports to Excel. The extension targets SEO professionals who need efficient competitor research tools.

## Table of Contents

1. [Chrome Extension Manifest V3](#chrome-extension-manifest-v3)
2. [Google Maps DOM Scraping](#google-maps-dom-scraping)
3. [SheetJS Excel Generation](#sheetjs-excel-generation)
4. [Content Script Communication](#content-script-communication)
5. [Automation Patterns](#automation-patterns)
6. [Error Handling & Best Practices](#error-handling--best-practices)

---

## Chrome Extension Manifest V3

### Manifest Structure

```json
{
  "manifest_version": 3,
  "name": "GMB Excel Export",
  "version": "1.0.0",
  "description": "Export Google Maps business data to Excel in one click",
  "permissions": [
    "storage",
    "activeTab",
    "downloads",
    "alarms"
  ],
  "host_permissions": [
    "*://www.google.com/maps/*",
    "*://maps.google.com/*"
  ],
  "background": {
    "service_worker": "background/service-worker.js"
  },
  "content_scripts": [
    {
      "matches": ["*://www.google.com/maps/*", "*://maps.google.com/*"],
      "js": ["content/maps-detector.js", "content/data-extractor.js"],
      "css": ["content/styles.css"],
      "run_at": "document_idle"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_title": "GMB Excel Export",
    "default_icon": {
      "16": "icons/icon16.png",
      "32": "icons/icon32.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "32": "icons/icon32.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["content/injected-ui.html"],
      "matches": ["*://www.google.com/maps/*"]
    }
  ]
}
```

### Key Manifest V3 Considerations

#### Service Worker Background Script
- **No persistent state**: Service workers are terminated when inactive
- **5-minute execution limit**: Long operations must be chunked
- **Use chrome.alarms** for scheduled tasks
- **chrome.storage** for persistence instead of localStorage

```javascript
// background/service-worker.js
chrome.runtime.onInstalled.addListener(() => {
  // Initialize extension
  chrome.storage.local.set({ credits: 0, exports: [] });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkCredits') {
    chrome.storage.local.get(['credits'], (result) => {
      sendResponse({ credits: result.credits || 0 });
    });
    return true; // Keep message channel open for async response
  }
});
```

#### Content Script Injection
- **run_at: "document_idle"**: Inject after DOM is ready
- **Multiple content scripts**: Separate detection from extraction logic
- **Host permissions**: Required for Google Maps domains

#### Permissions Strategy
- **Minimal permissions**: Only request what's needed
- **activeTab**: For current tab access
- **storage**: For user data persistence
- **downloads**: For Excel file downloads
- **alarms**: For background processing

---

## Google Maps DOM Scraping

### Current DOM Structure Analysis (2024)

Google Maps uses dynamic class names and complex nested structures. Key extraction points:

#### Search Results Container
```javascript
// Main results container (changes frequently)
const resultsContainer = document.querySelector('[role="main"] [role="region"]');

// Alternative selectors
const alternativeSelectors = [
  'div[aria-label*="Results"]',
  'div[data-results]',
  '[jsaction*="pane.placeList"]'
];
```

#### Business Card Selectors
```javascript
// Individual business listing selectors
const businessSelectors = [
  // Primary selector (most reliable)
  'div[role="article"][jsaction*="placeCard"]',

  // Fallback selectors
  'a[href*="/place/"]',
  'div[data-place-id]',
  '[jsaction*="placeCard.click"]'
];
```

#### Data Extraction Points

```javascript
function extractBusinessData(cardElement) {
  return {
    name: extractName(cardElement),
    address: extractAddress(cardElement),
    phone: extractPhone(cardElement),
    rating: extractRating(cardElement),
    reviewCount: extractReviewCount(cardElement),
    categories: extractCategories(cardElement),
    website: extractWebsite(cardElement),
    placeId: extractPlaceId(cardElement)
  };
}

function extractName(card) {
  // Multiple selector strategies for resilience
  const selectors = [
    'h3[data-attrid="title"]',
    'span[role="heading"]',
    'div[role="heading"]',
    '[jsaction*="placeCard.title"]'
  ];

  for (const selector of selectors) {
    const element = card.querySelector(selector);
    if (element && element.textContent.trim()) {
      return element.textContent.trim();
    }
  }
  return null;
}

function extractRating(card) {
  // Rating spans with aria-label
  const ratingElement = card.querySelector('span[aria-label*="stars"]');
  if (ratingElement) {
    const ariaLabel = ratingElement.getAttribute('aria-label');
    const match = ariaLabel.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  }

  // Alternative: look for rating spans
  const ratingSpan = card.querySelector('span[aria-label*="Rated"]');
  if (ratingSpan) {
    return parseFloat(ratingSpan.textContent);
  }

  return null;
}
```

### Handling Dynamic Content

#### MutationObserver for Infinite Scroll
```javascript
function observeResultsContainer() {
  const targetNode = document.querySelector('[role="main"]');

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        // New results loaded
        handleNewResults(mutation.addedNodes);
      }
    });
  });

  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });

  return observer;
}
```

#### Individual Business Detail Extraction

```javascript
async function extractDetailedBusinessData(placeId) {
  // Click on business card to open details panel
  const card = findBusinessCardByPlaceId(placeId);
  if (card) {
    card.click();

    // Wait for details panel to load
    await waitForElement('[data-tab="overview"]', 5000);

    return {
      services: extractServices(),
      attributes: extractAttributes(),
      reviews: await extractReviews(),
      posts: extractPosts(),
      hours: extractHours(),
      photos: extractPhotoCount()
    };
  }
}

function extractServices() {
  const services = [];
  const serviceElements = document.querySelectorAll('[data-service-type]');

  serviceElements.forEach(element => {
    services.push(element.textContent.trim());
  });

  return services;
}

function extractReviews() {
  return new Promise((resolve) => {
    const reviews = [];
    const reviewElements = document.querySelectorAll('[data-review-id]');

    reviewElements.forEach(review => {
      reviews.push({
        author: review.querySelector('[data-author]')?.textContent,
        rating: parseFloat(review.querySelector('[aria-label*="stars"]')?.getAttribute('aria-label') || 0),
        text: review.querySelector('[data-review-text]')?.textContent,
        date: review.querySelector('[data-review-date]')?.textContent
      });
    });

    resolve(reviews);
  });
}
```

### Rate Limiting & Anti-Detection

```javascript
class RateLimiter {
  constructor() {
    this.lastAction = 0;
    this.minDelay = 2000; // 2 seconds between actions
    this.maxDelay = 5000; // Max 5 seconds
  }

  async waitForNextAction() {
    const now = Date.now();
    const timeSinceLastAction = now - this.lastAction;
    const requiredDelay = Math.random() * (this.maxDelay - this.minDelay) + this.minDelay;

    if (timeSinceLastAction < requiredDelay) {
      const waitTime = requiredDelay - timeSinceLastAction;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastAction = Date.now();
  }
}

// Usage
const limiter = new RateLimiter();

async function processBusinessCards(cards) {
  for (const card of cards) {
    await limiter.waitForNextAction();
    await extractBusinessData(card);
  }
}
```

---

## SheetJS Excel Generation

### Basic Workbook Creation

```javascript
import * as XLSX from 'xlsx';

function createExcelWorkbook(data, options = {}) {
  const workbook = XLSX.utils.book_new();

  // Create summary sheet
  const summarySheet = createSummarySheet(data, options);
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  // Create business data sheet
  const businessSheet = createBusinessDataSheet(data.businesses);
  XLSX.utils.book_append_sheet(workbook, businessSheet, 'Businesses');

  // Create reviews sheet if deep export
  if (options.includeReviews && data.reviews) {
    const reviewsSheet = createReviewsSheet(data.reviews);
    XLSX.utils.book_append_sheet(workbook, reviewsSheet, 'Reviews');
  }

  return workbook;
}

function createSummarySheet(data, options) {
  const summaryData = [
    ['GMB Excel Export - Competitor Analysis Report'],
    [''],
    ['Search Query:', options.searchQuery || ''],
    ['Location:', options.location || ''],
    ['Export Date:', new Date().toLocaleDateString()],
    ['Export Type:', options.exportType || 'Standard'],
    ['Total Businesses:', data.businesses.length],
    ['Average Rating:', calculateAverageRating(data.businesses)],
    ['Total Reviews:', calculateTotalReviews(data.businesses)]
  ];

  return XLSX.utils.aoa_to_sheet(summaryData);
}
```

### Professional Formatting

```javascript
function applyProfessionalFormatting(workbook) {
  // Apply formatting to each sheet
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    applySheetFormatting(sheet, sheetName);
  });
}

function applySheetFormatting(sheet, sheetName) {
  // Define column widths
  const colWidths = {
    'Summary': [
      { wch: 30 }, // Column A
      { wch: 50 }  // Column B
    ],
    'Businesses': [
      { wch: 5 },   // #
      { wch: 30 },  // Name
      { wch: 40 },  // Address
      { wch: 15 },  // Phone
      { wch: 30 },  // Website
      { wch: 8 },   // Rating
      { wch: 10 },  // Reviews
      { wch: 20 },  // Category
      { wch: 25 }   // Hours
    ]
  };

  if (colWidths[sheetName]) {
    sheet['!cols'] = colWidths[sheetName];
  }

  // Apply header styling
  applyHeaderStyling(sheet);

  // Apply conditional formatting for ratings
  if (sheetName === 'Businesses') {
    applyRatingConditionalFormatting(sheet);
  }
}

function applyHeaderStyling(sheet) {
  // Find header row (usually row 1)
  const range = XLSX.utils.decode_range(sheet['!ref']);
  const headerRow = 0; // 0-indexed

  for (let col = range.s.c; col <= range.e.c; col++) {
    const cellAddress = XLSX.utils.encode_cell({ r: headerRow, c: col });
    if (sheet[cellAddress]) {
      sheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '1A365D' } }, // Dark blue
        alignment: { horizontal: 'center' }
      };
    }
  }
}

function applyRatingConditionalFormatting(sheet) {
  // Add conditional formatting for rating column
  const ratingCol = 5; // Column F (0-indexed)
  const range = XLSX.utils.decode_range(sheet['!ref']);

  // Color scale: Red (1-2) → Yellow (3) → Green (4-5)
  sheet['!conditional'] = [{
    type: 'colorScale',
    priority: 1,
    cfvo: [
      { type: 'num', val: 1 },
      { type: 'num', val: 3 },
      { type: 'num', val: 5 }
    ],
    color: [
      { rgb: 'FF0000' }, // Red
      { rgb: 'FFFF00' }, // Yellow
      { rgb: '00FF00' }  // Green
    ],
    sqref: XLSX.utils.encode_range({
      s: { r: 1, c: ratingCol },
      e: { r: range.e.r, c: ratingCol }
    })
  }];
}
```

### Business Data Sheet Creation

```javascript
function createBusinessDataSheet(businesses) {
  const headers = [
    '#',
    'Business Name',
    'Address',
    'Phone',
    'Website',
    'Rating',
    'Reviews',
    'Primary Category',
    'Secondary Categories',
    'Hours',
    'Services',
    'Attributes',
    'Place ID'
  ];

  const data = [headers];

  businesses.forEach((business, index) => {
    data.push([
      index + 1,
      business.name || '',
      business.address || '',
      business.phone || '',
      business.website ? { t: 's', v: business.website, l: { Target: business.website } } : '',
      business.rating || '',
      business.reviewCount || '',
      business.primaryCategory || '',
      (business.secondaryCategories || []).join(', '),
      business.hours || '',
      (business.services || []).join(', '),
      (business.attributes || []).join(', '),
      business.placeId || ''
    ]);
  });

  const sheet = XLSX.utils.aoa_to_sheet(data);

  // Enable filters on header row
  sheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }) };

  return sheet;
}
```

### Reviews Sheet with Sentiment Analysis

```javascript
function createReviewsSheet(reviews) {
  const headers = [
    'Business Name',
    'Author',
    'Rating',
    'Date',
    'Review Text',
    'Sentiment',
    'Keywords'
  ];

  const data = [headers];

  reviews.forEach(review => {
    const sentiment = analyzeSentiment(review.text);
    const keywords = extractKeywords(review.text);

    data.push([
      review.businessName || '',
      review.author || '',
      review.rating || '',
      review.date || '',
      review.text || '',
      sentiment,
      keywords.join(', ')
    ]);
  });

  return XLSX.utils.aoa_to_sheet(data);
}

function analyzeSentiment(text) {
  // Simple sentiment analysis (can be enhanced with ML)
  const positiveWords = ['great', 'excellent', 'amazing', 'love', 'best', 'wonderful'];
  const negativeWords = ['terrible', 'awful', 'horrible', 'worst', 'hate', 'bad'];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return 'Positive';
  if (negativeCount > positiveCount) return 'Negative';
  return 'Neutral';
}

function extractKeywords(text) {
  // Extract common keywords (2+ characters, not stop words)
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word));

  // Count frequency and return top keywords
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });

  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}
```

### File Download

```javascript
function downloadExcelFile(workbook, filename) {
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Usage
const workbook = createExcelWorkbook(data, options);
downloadExcelFile(workbook, `gmb-export-${Date.now()}.xlsx`);
```

---

## Content Script Communication

### Message Passing Architecture

```javascript
// content/maps-detector.js - Detects Google Maps pages and injects UI
class MapsDetector {
  constructor() {
    this.isInitialized = false;
    this.setupMessageListeners();
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'detectMapsPage':
          sendResponse({ isMapsPage: this.isGoogleMapsPage() });
          break;
        case 'startExtraction':
          this.startExtraction(request.options).then(sendResponse);
          return true; // Keep channel open for async response
        case 'checkCredits':
          this.checkCredits().then(sendResponse);
          return true;
      }
    });
  }

  isGoogleMapsPage() {
    return window.location.hostname.includes('google.com') &&
           window.location.pathname.includes('/maps');
  }

  async checkCredits() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'checkCredits' }, (response) => {
        resolve(response);
      });
    });
  }

  async startExtraction(options) {
    // Inject floating UI
    this.injectExportButton();

    // Start data extraction
    const extractor = new DataExtractor();
    return await extractor.extractAllData(options);
  }

  injectExportButton() {
    if (document.getElementById('gmb-export-button')) return;

    const button = document.createElement('div');
    button.id = 'gmb-export-button';
    button.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: #4285f4;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        cursor: pointer;
        font-family: Arial, sans-serif;
        font-size: 14px;
        font-weight: bold;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: all 0.2s;
      ">
        📊 Export to Excel
      </div>
    `;

    button.onclick = () => this.handleExportClick();
    document.body.appendChild(button);
  }

  async handleExportClick() {
    const credits = await this.checkCredits();
    if (credits.credits < 1) {
      this.showUpgradePrompt();
      return;
    }

    // Show export options modal
    this.showExportOptions();
  }
}
```

### Background Service Worker Communication

```javascript
// background/service-worker.js
class BackgroundHandler {
  constructor() {
    this.activeExtractions = new Map();
    this.setupMessageListeners();
  }

  setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      const tabId = sender.tab.id;

      switch (request.action) {
        case 'startExtraction':
          this.handleExtractionStart(tabId, request, sendResponse);
          return true;

        case 'extractionProgress':
          this.handleExtractionProgress(tabId, request);
          break;

        case 'extractionComplete':
          this.handleExtractionComplete(tabId, request, sendResponse);
          return true;
      }
    });
  }

  async handleExtractionStart(tabId, request, sendResponse) {
    const extractionId = `extraction_${Date.now()}_${tabId}`;

    this.activeExtractions.set(extractionId, {
      tabId,
      startTime: Date.now(),
      progress: 0
    });

    // Check credits first
    const credits = await this.checkCredits(request.userId);
    if (credits < request.estimatedCost) {
      sendResponse({ error: 'Insufficient credits' });
      return;
    }

    // Start extraction in content script
    chrome.tabs.sendMessage(tabId, {
      action: 'startExtraction',
      extractionId,
      options: request.options
    });

    sendResponse({ extractionId });
  }

  handleExtractionProgress(tabId, request) {
    const extraction = this.activeExtractions.get(request.extractionId);
    if (extraction) {
      extraction.progress = request.progress;

      // Update popup if open
      this.updatePopupProgress(tabId, request.progress);
    }
  }

  async handleExtractionComplete(tabId, request, sendResponse) {
    const extraction = this.activeExtractions.get(request.extractionId);
    if (!extraction) return;

    try {
      // Generate Excel file
      const excelData = await generateExcelFile(request.data, request.options);

      // Download file
      chrome.downloads.download({
        url: excelData.url,
        filename: request.filename,
        saveAs: false
      });

      // Deduct credits
      await this.deductCredits(request.userId, request.cost);

      // Log export
      await this.logExport(request);

      sendResponse({ success: true });

    } catch (error) {
      sendResponse({ error: error.message });
    } finally {
      this.activeExtractions.delete(request.extractionId);
    }
  }
}
```

### Popup Communication

```javascript
// popup/popup.js
class PopupHandler {
  constructor() {
    this.currentTab = null;
    this.setupEventListeners();
    this.initializePopup();
  }

  async initializePopup() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tabs[0];

    // Check if we're on Google Maps
    if (this.isGoogleMapsTab(this.currentTab)) {
      this.showExportInterface();
    } else {
      this.showNotMapsMessage();
    }
  }

  isGoogleMapsTab(tab) {
    return tab.url && (
      tab.url.includes('google.com/maps') ||
      tab.url.includes('maps.google.com')
    );
  }

  showExportInterface() {
    document.getElementById('export-section').style.display = 'block';
    document.getElementById('not-maps').style.display = 'none';

    this.updateCreditsDisplay();
    this.setupExportButtons();
  }

  async updateCreditsDisplay() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getCredits' });
      document.getElementById('credits-count').textContent = response.credits;
    } catch (error) {
      console.error('Failed to get credits:', error);
    }
  }

  setupExportButtons() {
    const buttons = document.querySelectorAll('.export-btn');

    buttons.forEach(button => {
      button.addEventListener('click', async () => {
        const exportType = button.dataset.type;

        try {
          const response = await chrome.tabs.sendMessage(this.currentTab.id, {
            action: 'startExtraction',
            type: exportType
          });

          if (response.extractionId) {
            this.showProgressIndicator(response.extractionId);
          }
        } catch (error) {
          this.showError('Failed to start extraction: ' + error.message);
        }
      });
    });
  }

  showProgressIndicator(extractionId) {
    const progressDiv = document.getElementById('progress');
    progressDiv.style.display = 'block';

    // Listen for progress updates
    const progressListener = (message) => {
      if (message.extractionId === extractionId) {
        this.updateProgress(message.progress);

        if (message.progress >= 100) {
          chrome.runtime.onMessage.removeListener(progressListener);
          this.showCompletion();
        }
      }
    };

    chrome.runtime.onMessage.addListener(progressListener);
  }
}
```

---

## Automation Patterns

### Scroll Automation for Infinite Results

```javascript
class ScrollAutomator {
  constructor() {
    this.scrollDelay = 2000;
    this.maxScrolls = 10;
    this.previousResultCount = 0;
  }

  async scrollToLoadAllResults() {
    let scrollCount = 0;
    let noNewResultsCount = 0;

    while (scrollCount < this.maxScrolls && noNewResultsCount < 3) {
      const currentResults = this.getCurrentResultCount();

      if (currentResults > this.previousResultCount) {
        this.previousResultCount = currentResults;
        noNewResultsCount = 0;
      } else {
        noNewResultsCount++;
      }

      await this.performScroll();
      scrollCount++;

      // Wait for new results to load
      await this.waitForNewResults();
    }

    return this.getAllBusinessCards();
  }

  async performScroll() {
    const resultsContainer = document.querySelector('[role="main"] [role="region"]');

    if (resultsContainer) {
      // Scroll to bottom of results
      resultsContainer.scrollTop = resultsContainer.scrollHeight;

      // Alternative: scroll by viewport height
      // window.scrollTo(0, document.body.scrollHeight);
    }
  }

  async waitForNewResults() {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutations) => {
        const hasNewResults = mutations.some(mutation =>
          mutation.type === 'childList' &&
          Array.from(mutation.addedNodes).some(node =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.matches('[role="article"]') || node.querySelector('[role="article"]'))
          )
        );

        if (hasNewResults) {
          observer.disconnect();
          setTimeout(resolve, 1000); // Wait for content to settle
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        observer.disconnect();
        resolve();
      }, 5000);
    });
  }

  getCurrentResultCount() {
    const cards = document.querySelectorAll('[role="article"][jsaction*="placeCard"]');
    return cards.length;
  }

  getAllBusinessCards() {
    return Array.from(document.querySelectorAll('[role="article"][jsaction*="placeCard"]'));
  }
}
```

### Business Card Clicking Automation

```javascript
class BusinessCardAutomator {
  constructor() {
    this.clickDelay = 3000;
    this.maxRetries = 3;
  }

  async clickBusinessCards(cards, onProgress) {
    const results = [];

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];

      try {
        const detailedData = await this.extractDetailedData(card);
        results.push(detailedData);

        onProgress?.((i + 1) / cards.length * 100);

        // Wait before next click
        await this.delay(this.clickDelay);

      } catch (error) {
        console.error(`Failed to extract data for card ${i}:`, error);
        // Continue with next card
      }
    }

    return results;
  }

  async extractDetailedData(card) {
    // Click the card to open details panel
    await this.clickCard(card);

    // Wait for details panel to load
    await this.waitForDetailsPanel();

    // Extract detailed data
    const data = await this.extractDetailsData();

    // Close details panel
    await this.closeDetailsPanel();

    return data;
  }

  async clickCard(card) {
    return new Promise((resolve, reject) => {
      let retries = 0;

      const attemptClick = () => {
        try {
          // Find clickable element within card
          const clickableElement = card.querySelector('a[href*="/place/"]') || card;

          if (clickableElement) {
            clickableElement.click();
            resolve();
          } else {
            throw new Error('No clickable element found');
          }
        } catch (error) {
          retries++;
          if (retries < this.maxRetries) {
            setTimeout(attemptClick, 1000);
          } else {
            reject(error);
          }
        }
      };

      attemptClick();
    });
  }

  async waitForDetailsPanel() {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Details panel did not load'));
      }, 10000);

      const checkForPanel = () => {
        const panel = document.querySelector('[data-tab="overview"]') ||
                     document.querySelector('[role="dialog"]') ||
                     document.querySelector('.details-panel');

        if (panel) {
          clearTimeout(timeout);
          resolve(panel);
        } else {
          setTimeout(checkForPanel, 500);
        }
      };

      checkForPanel();
    });
  }

  async extractDetailsData() {
    // Wait a bit for content to load
    await this.delay(2000);

    return {
      services: this.extractServices(),
      attributes: this.extractAttributes(),
      reviews: await this.extractReviews(),
      posts: this.extractPosts(),
      hours: this.extractHours(),
      photos: this.extractPhotoCount()
    };
  }

  async closeDetailsPanel() {
    // Try multiple close button selectors
    const closeSelectors = [
      'button[aria-label*="Close"]',
      'button[data-close]',
      '.close-button',
      '[jsaction*="close"]'
    ];

    for (const selector of closeSelectors) {
      const closeBtn = document.querySelector(selector);
      if (closeBtn) {
        closeBtn.click();
        await this.delay(1000);
        return;
      }
    }

    // Fallback: press Escape key
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await this.delay(1000);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Progress Tracking and User Feedback

```javascript
class ExtractionProgressTracker {
  constructor() {
    this.totalSteps = 0;
    this.completedSteps = 0;
    this.currentPhase = '';
  }

  initialize(totalBusinesses, includeDetails) {
    this.totalSteps = totalBusinesses + (includeDetails ? totalBusinesses * 2 : 0);
    this.completedSteps = 0;
    this.currentPhase = 'Initializing...';
  }

  updateProgress(phase, increment = 1) {
    this.currentPhase = phase;
    this.completedSteps += increment;

    const percentage = Math.round((this.completedSteps / this.totalSteps) * 100);

    // Send progress update to background script
    chrome.runtime.sendMessage({
      action: 'extractionProgress',
      phase: this.currentPhase,
      progress: percentage,
      completed: this.completedSteps,
      total: this.totalSteps
    });

    // Update UI if available
    this.updateUI(percentage, this.currentPhase);
  }

  updateUI(percentage, phase) {
    // Update floating progress indicator
    const progressElement = document.getElementById('gmb-progress-indicator');
    if (progressElement) {
      progressElement.querySelector('.progress-bar').style.width = `${percentage}%`;
      progressElement.querySelector('.progress-text').textContent = `${phase} (${percentage}%)`;
    }
  }

  showCompletion(success = true) {
    const message = success ? 'Export completed successfully!' : 'Export failed';

    // Show completion notification
    this.showNotification(message, success ? 'success' : 'error');

    // Clean up progress UI
    const progressElement = document.getElementById('gmb-progress-indicator');
    if (progressElement) {
      progressElement.remove();
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `gmb-notification gmb-${type}`;
    notification.textContent = message;

    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: type === 'success' ? '#4CAF50' : '#f44336',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '4px',
      zIndex: '10001',
      fontFamily: 'Arial, sans-serif'
    });

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
}
```

---

## Error Handling & Best Practices

### Comprehensive Error Handling

```javascript
class ExtractionErrorHandler {
  constructor() {
    this.errors = [];
    this.maxRetries = 3;
  }

  async executeWithRetry(operation, context = '') {
    let lastError;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        this.logError(error, context, attempt);

        if (attempt < this.maxRetries) {
          await this.delay(this.getRetryDelay(attempt));
        }
      }
    }

    // All retries failed
    this.handleFatalError(lastError, context);
    throw lastError;
  }

  logError(error, context, attempt) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      attempt,
      timestamp: new Date().toISOString(),
      url: window.location.href
    };

    this.errors.push(errorInfo);
    console.error(`Extraction error (attempt ${attempt}):`, errorInfo);

    // Send error to background script for logging
    chrome.runtime.sendMessage({
      action: 'logError',
      error: errorInfo
    });
  }

  handleFatalError(error, context) {
    // Show user-friendly error message
    this.showUserError('Extraction failed after multiple attempts. Please try again.');

    // Send error report
    this.sendErrorReport(error, context);
  }

  showUserError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'gmb-error-message';
    errorDiv.innerHTML = `
      <div style="
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10002;
        max-width: 400px;
        text-align: center;
      ">
        <h3 style="color: #d32f2f; margin-top: 0;">Export Failed</h3>
        <p>${message}</p>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: #4285f4;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;

    document.body.appendChild(errorDiv);
  }

  async sendErrorReport(error, context) {
    try {
      await fetch('https://api.gmb-export.com/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: error.message,
          context,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        })
      });
    } catch (reportError) {
      console.error('Failed to send error report:', reportError);
    }
  }

  getRetryDelay(attempt) {
    // Exponential backoff: 1s, 2s, 4s
    return Math.pow(2, attempt - 1) * 1000;
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Anti-Detection Measures

```javascript
class AntiDetectionManager {
  constructor() {
    this.userAgent = this.getRandomUserAgent();
    this.requestDelay = this.getRandomDelay();
    this.lastRequestTime = 0;
  }

  getRandomUserAgent() {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];

    return userAgents[Math.floor(Math.random() * userAgents.length)];
  }

  getRandomDelay() {
    // Random delay between 2-5 seconds
    return Math.random() * 3000 + 2000;
  }

  async waitBeforeRequest() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.requestDelay) {
      const waitTime = this.requestDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequestTime = Date.now();
    this.requestDelay = this.getRandomDelay(); // Randomize for next request
  }

  simulateHumanBehavior() {
    // Random mouse movements
    this.simulateMouseMovement();

    // Random scrolling
    this.simulateScrolling();
  }

  simulateMouseMovement() {
    const event = new MouseEvent('mousemove', {
      clientX: Math.random() * window.innerWidth,
      clientY: Math.random() * window.innerHeight,
      bubbles: true
    });

    document.dispatchEvent(event);
  }

  simulateScrolling() {
    // Small random scroll
    const scrollAmount = Math.random() * 100 - 50; // -50 to +50
    window.scrollBy(0, scrollAmount);
  }

  rotateSelectors(selectors) {
    // Rotate through different selector strategies to avoid pattern detection
    const index = Math.floor(Math.random() * selectors.length);
    return selectors[index];
  }
}
```

### Performance Optimization

```javascript
class PerformanceOptimizer {
  constructor() {
    this.cache = new Map();
    this.batchSize = 10;
  }

  async batchProcess(items, processor, onProgress) {
    const results = [];
    const batches = this.chunkArray(items, this.batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchResults = await Promise.all(
        batch.map(item => this.processWithCache(item, processor))
      );

      results.push(...batchResults);

      onProgress?.(((i + 1) / batches.length) * 100);

      // Allow UI to update between batches
      await this.yieldToUI();
    }

    return results;
  }

  async processWithCache(item, processor) {
    const cacheKey = this.getCacheKey(item);

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = await processor(item);
    this.cache.set(cacheKey, result);

    return result;
  }

  getCacheKey(item) {
    // Create a unique key for caching
    return JSON.stringify(item);
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async yieldToUI() {
    // Allow UI updates between heavy operations
    return new Promise(resolve => setTimeout(resolve, 0));
  }

  clearCache() {
    this.cache.clear();
  }
}
```

### Best Practices Summary

1. **Modular Architecture**: Separate concerns (detection, extraction, formatting)
2. **Error Resilience**: Multiple selector strategies, retry logic, graceful degradation
3. **Performance**: Batch processing, caching, UI yielding
4. **Anti-Detection**: Random delays, human-like behavior simulation
5. **User Experience**: Progress indicators, clear error messages, responsive UI
6. **Data Integrity**: Validation, sanitization, consistent formatting
7. **Security**: No sensitive data storage, secure communication
8. **Maintainability**: Clear code structure, comprehensive logging, documentation

---

*This implementation guide provides production-ready code patterns for building a professional Google Maps business data extraction Chrome extension. All code examples include error handling, performance optimizations, and best practices for reliability and user experience.*