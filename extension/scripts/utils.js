// Utility functions for GMB Excel Export extension

/**
 * Check if current page is Google Maps
 * @returns {boolean}
 */
function isOnGoogleMaps() {
    return window.location.hostname === 'www.google.com' &&
        window.location.pathname.startsWith('/maps');
}

/**
 * Wait for an element to appear in the DOM
 * @param {string} selector - CSS selector
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Element>}
 */
function waitForElement(selector, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.querySelector(selector);
        if (element) {
            resolve(element);
            return;
        }

        const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        }, timeout);
    });
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function}
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Sanitize text content for Excel export
 * @param {string} text - Text to sanitize
 * @returns {string}
 */
function sanitizeText(text) {
    if (!text) return '';
    return text
        .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Remove control characters
        .trim();
}

/**
 * Generate a unique ID
 * @returns {string}
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Format date for Excel
 * @param {Date|string} date - Date to format
 * @returns {string}
 */
function formatDateForExcel(date) {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
}

/**
 * Log messages with extension prefix
 * @param {string} level - Log level (log, warn, error)
 * @param {string} message - Message to log
 * @param {*} data - Additional data
 */
function log(level, message, data = null) {
    const prefix = '[GMB Export]';
    const logMessage = `${prefix} ${message}`;

    switch (level) {
        case 'warn':
            console.warn(logMessage, data);
            break;
        case 'error':
            console.error(logMessage, data);
            break;
        default:
            console.log(logMessage, data);
    }
}

/**
 * Check if extension has required permissions
 * @returns {Promise<boolean>}
 */
async function checkPermissions() {
    try {
        const result = await chrome.permissions.contains({
            permissions: ['activeTab', 'storage'],
            origins: ['https://www.google.com/maps/*']
        });
        return result;
    } catch (error) {
        log('error', 'Failed to check permissions', error);
        return false;
    }
}

/**
 * Request additional permissions if needed
 * @returns {Promise<boolean>}
 */
async function requestPermissions() {
    try {
        const granted = await chrome.permissions.request({
            permissions: ['activeTab', 'storage'],
            origins: ['https://www.google.com/maps/*']
        });
        return granted;
    } catch (error) {
        log('error', 'Failed to request permissions', error);
        return false;
    }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        isOnGoogleMaps,
        waitForElement,
        debounce,
        sanitizeText,
        generateId,
        formatDateForExcel,
        log,
        checkPermissions,
        requestPermissions
    };
}