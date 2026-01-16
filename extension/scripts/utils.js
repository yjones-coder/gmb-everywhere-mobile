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
 * Logger class for structured logging across the extension
 */
class Logger {
    constructor(component = 'Unknown') {
        this.component = component;
        this.levels = {
            DEBUG: 0,
            INFO: 1,
            WARN: 2,
            ERROR: 3
        };

        // Get log level from environment or default to INFO
        this.currentLevel = this.getLogLevel();
        this.operationCounter = 0;
    }

    /**
     * Get log level from environment
     */
    getLogLevel() {
        // Check for debug mode in chrome storage or environment
        try {
            // In production, default to WARN to reduce noise
            // In development/debug mode, allow DEBUG
            const isDebug = typeof chrome !== 'undefined' &&
                chrome.storage &&
                localStorage.getItem('gmb_debug_mode') === 'true';

            return isDebug ? this.levels.DEBUG : this.levels.INFO;
        } catch (e) {
            // Fallback to INFO if storage access fails
            return this.levels.INFO;
        }
    }

    /**
     * Generate operation ID for tracking related operations
     */
    generateOperationId() {
        return `${this.component}_${Date.now()}_${++this.operationCounter}`;
    }

    /**
     * Get anonymized user context
     */
    getUserContext() {
        try {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                // Try to get user info for context (anonymized)
                const userInfo = localStorage.getItem('google-oauth-user-info');
                if (userInfo) {
                    const user = JSON.parse(userInfo);
                    return {
                        userId: user.id ? btoa(user.id).substring(0, 8) : 'anonymous',
                        email: user.email ? user.email.split('@')[0] + '@***' : null
                    };
                }
            }
        } catch (e) {
            // Ignore errors in user context retrieval
        }
        return { userId: 'anonymous' };
    }

    /**
     * Format log message with structured context
     */
    formatMessage(level, message, context = {}) {
        const timestamp = new Date().toISOString();
        const operationId = context.operationId || this.generateOperationId();
        const userContext = this.getUserContext();

        const logEntry = {
            timestamp,
            level,
            component: this.component,
            operationId,
            message,
            ...userContext,
            ...context
        };

        // Remove undefined values
        Object.keys(logEntry).forEach(key => {
            if (logEntry[key] === undefined) {
                delete logEntry[key];
            }
        });

        return logEntry;
    }

    /**
     * Check if log level should be output
     */
    shouldLog(level) {
        return this.levels[level] >= this.currentLevel;
    }

    /**
     * Output log message
     */
    log(level, message, context = {}) {
        if (!this.shouldLog(level)) {
            return;
        }

        const logEntry = this.formatMessage(level, message, context);
        const prefix = `[GMB Export:${this.component}]`;

        // Use appropriate console method
        switch (level) {
            case 'DEBUG':
                console.debug(prefix, logEntry);
                break;
            case 'INFO':
                console.info(prefix, logEntry);
                break;
            case 'WARN':
                console.warn(prefix, logEntry);
                break;
            case 'ERROR':
                console.error(prefix, logEntry);
                break;
            default:
                console.log(prefix, logEntry);
        }
    }

    /**
     * Debug level logging
     */
    debug(message, context = {}) {
        this.log('DEBUG', message, context);
    }

    /**
     * Info level logging
     */
    info(message, context = {}) {
        this.log('INFO', message, context);
    }

    /**
     * Warning level logging
     */
    warn(message, context = {}) {
        this.log('WARN', message, context);
    }

    /**
     * Error level logging
     */
    error(message, context = {}) {
        this.log('ERROR', message, context);
    }

    /**
     * Create child logger for specific operations
     */
    child(operationId, additionalContext = {}) {
        const childLogger = new Logger(this.component);
        childLogger.operationCounter = this.operationCounter;

        // Override log method to include operation context
        const originalLog = childLogger.log.bind(childLogger);
        childLogger.log = (level, message, context = {}) => {
            originalLog(level, message, {
                operationId,
                ...additionalContext,
                ...context
            });
        };

        return childLogger;
    }
}

// Create component-specific loggers
const loggers = {
    background: new Logger('Background'),
    content: new Logger('Content'),
    popup: new Logger('Popup'),
    scraper: new Logger('Scraper'),
    excel: new Logger('Excel'),
    auth: new Logger('Auth'),
    utils: new Logger('Utils')
};

// Legacy log function for backward compatibility
function log(level, message, data = null) {
    // Map old levels to new levels
    const levelMap = {
        'log': 'INFO',
        'warn': 'WARN',
        'error': 'ERROR',
        'info': 'INFO',
        'debug': 'DEBUG'
    };

    const mappedLevel = levelMap[level] || 'INFO';
    const context = data ? { data } : {};

    // Use utils logger for legacy calls
    loggers.utils.log(mappedLevel, message, context);
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

// ===== RETRY AND CIRCUIT BREAKER UTILITIES =====

/**
 * Calculate exponential backoff delay
 * @param {number} attempt - Current attempt number (0-based)
 * @param {number} baseDelay - Base delay in milliseconds
 * @param {number} maxDelay - Maximum delay in milliseconds
 * @param {number} backoffFactor - Backoff multiplier
 * @returns {number} Delay in milliseconds
 */
function calculateExponentialBackoff(attempt, baseDelay = 1000, maxDelay = 30000, backoffFactor = 2) {
    const delay = baseDelay * Math.pow(backoffFactor, attempt);
    return Math.min(delay, maxDelay);
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries
 * @param {number} options.baseDelay - Base delay between retries
 * @param {number} options.maxDelay - Maximum delay between retries
 * @param {number} options.backoffFactor - Exponential backoff factor
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @param {Function} options.onRetry - Callback called before each retry
 * @returns {Promise} Result of the function
 */
async function retryWithBackoff(fn, options = {}) {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 30000,
        backoffFactor = 2,
        shouldRetry = (error) => true,
        onRetry = null
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry if this is the last attempt or error shouldn't be retried
            if (attempt === maxRetries || !shouldRetry(error)) {
                throw error;
            }

            const delay = calculateExponentialBackoff(attempt, baseDelay, maxDelay, backoffFactor);

            log('warn', `Attempt ${attempt + 1} failed, retrying in ${delay}ms`, { error: error.message });

            if (onRetry) {
                onRetry(attempt + 1, error, delay);
            }

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Circuit breaker for handling repeated failures
 */
class CircuitBreaker {
    constructor(options = {}) {
        this.failureThreshold = options.failureThreshold || 5;
        this.recoveryTimeout = options.recoveryTimeout || 60000; // 1 minute
        this.monitoringPeriod = options.monitoringPeriod || 60000; // 1 minute

        this.failures = 0;
        this.lastFailureTime = null;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttemptTime = null;

        // Track failures in sliding window
        this.failureHistory = [];
    }

    /**
     * Execute a function with circuit breaker protection
     * @param {Function} fn - Function to execute
     * @returns {Promise} Result of the function
     */
    async execute(fn) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttemptTime) {
                throw new Error('Circuit breaker is OPEN - service unavailable');
            } else {
                // Transition to HALF_OPEN
                this.state = 'HALF_OPEN';
                log('info', 'Circuit breaker transitioning to HALF_OPEN');
            }
        }

        try {
            const result = await fn();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure(error);
            throw error;
        }
    }

    /**
     * Handle successful execution
     */
    onSuccess() {
        if (this.state === 'HALF_OPEN') {
            // Reset to CLOSED on successful half-open attempt
            this.state = 'CLOSED';
            this.failures = 0;
            this.failureHistory = [];
            this.lastFailureTime = null;
            this.nextAttemptTime = null;
            log('info', 'Circuit breaker reset to CLOSED after successful half-open attempt');
        } else if (this.state === 'CLOSED') {
            // Clean up old failure history
            this.cleanupOldFailures();
        }
    }

    /**
     * Handle failed execution
     * @param {Error} error - The error that occurred
     */
    onFailure(error) {
        this.failures++;
        this.lastFailureTime = Date.now();
        this.failureHistory.push({
            timestamp: Date.now(),
            error: error.message
        });

        // Clean up old failures outside monitoring period
        this.cleanupOldFailures();

        if (this.state === 'HALF_OPEN') {
            // Half-open attempt failed, go back to OPEN
            this.state = 'OPEN';
            this.nextAttemptTime = Date.now() + this.recoveryTimeout;
            log('warn', 'Circuit breaker half-open attempt failed, returning to OPEN');
        } else if (this.state === 'CLOSED' && this.failures >= this.failureThreshold) {
            // Too many failures, open the circuit
            this.state = 'OPEN';
            this.nextAttemptTime = Date.now() + this.recoveryTimeout;
            log('error', `Circuit breaker opened after ${this.failures} failures`);
        }
    }

    /**
     * Clean up failure history outside the monitoring period
     */
    cleanupOldFailures() {
        const cutoffTime = Date.now() - this.monitoringPeriod;
        this.failureHistory = this.failureHistory.filter(failure => failure.timestamp > cutoffTime);
        this.failures = this.failureHistory.length;
    }

    /**
     * Get current circuit breaker status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            state: this.state,
            failures: this.failures,
            failureThreshold: this.failureThreshold,
            lastFailureTime: this.lastFailureTime,
            nextAttemptTime: this.nextAttemptTime,
            timeUntilNextAttempt: this.nextAttemptTime ? Math.max(0, this.nextAttemptTime - Date.now()) : 0
        };
    }

    /**
     * Manually reset the circuit breaker
     */
    reset() {
        this.state = 'CLOSED';
        this.failures = 0;
        this.failureHistory = [];
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
        log('info', 'Circuit breaker manually reset');
    }
}

// ===== MESSAGE PASSING SYSTEM =====

/**
 * Message passing configuration
 */
const MESSAGE_CONFIG = {
    DEFAULT_TIMEOUT: 10000, // 10 seconds
    MAX_RETRIES: 3,
    RETRY_DELAY_BASE: 1000, // 1 second base delay
    QUEUE_PROCESS_INTERVAL: 500, // Check queue every 500ms
    CONNECTION_CHECK_INTERVAL: 30000, // Check connections every 30 seconds
    ACK_TIMEOUT: 5000 // Wait 5 seconds for acknowledgment
};

/**
 * Message queue for when components aren't ready
 */
const messageQueue = new Map(); // target -> queued messages
const pendingMessages = new Map(); // messageId -> {message, resolve, reject, timeoutId, retries}
const connectionHealth = new Map(); // target -> {lastSeen, isHealthy}

/**
 * Validate message structure
 * @param {object} message - Message to validate
 * @returns {boolean}
 */
function validateMessage(message) {
    if (!message || typeof message !== 'object') {
        log('error', 'Invalid message: not an object', message);
        return false;
    }

    if (!message.action || typeof message.action !== 'string') {
        log('error', 'Invalid message: missing or invalid action', message);
        return false;
    }

    // Check for required fields based on action
    const requiredFields = {
        'ack': ['messageId'],
        'nack': ['messageId', 'error']
    };

    const fields = requiredFields[message.action];
    if (fields) {
        for (const field of fields) {
            if (!(field in message)) {
                log('error', `Invalid message: missing required field '${field}' for action '${message.action}'`, message);
                return false;
            }
        }
    }

    return true;
}

/**
 * Send acknowledgment for a message
 * @param {string} messageId - ID of message to acknowledge
 * @param {object} sender - Sender info
 */
function sendAcknowledgment(messageId, sender) {
    const ackMessage = {
        action: 'ack',
        messageId: messageId,
        timestamp: Date.now()
    };

    try {
        if (sender.tab) {
            // Send to content script
            chrome.tabs.sendMessage(sender.tab.id, ackMessage);
        } else {
            // Send to background/popup
            chrome.runtime.sendMessage(ackMessage);
        }
    } catch (error) {
        log('error', 'Failed to send acknowledgment', { messageId, error });
    }
}

/**
 * Send negative acknowledgment
 * @param {string} messageId - ID of message
 * @param {string} error - Error message
 * @param {object} sender - Sender info
 */
function sendNack(messageId, error, sender) {
    const nackMessage = {
        action: 'nack',
        messageId: messageId,
        error: error,
        timestamp: Date.now()
    };

    try {
        if (sender.tab) {
            chrome.tabs.sendMessage(sender.tab.id, nackMessage);
        } else {
            chrome.runtime.sendMessage(nackMessage);
        }
    } catch (err) {
        log('error', 'Failed to send NACK', { messageId, error: err });
    }
}

/**
 * Send message reliably with retries and acknowledgments
 * @param {object} message - Message to send
 * @param {object} options - Options {target: 'background'|'content'|'popup', tabId, timeout, maxRetries}
 * @returns {Promise<object>} Response
 */
function sendMessageReliably(message, options = {}) {
    return new Promise((resolve, reject) => {
        if (!validateMessage(message)) {
            reject(new Error('Invalid message structure'));
            return;
        }

        const messageId = generateId();
        const enhancedMessage = {
            ...message,
            messageId: messageId,
            timestamp: Date.now(),
            requiresAck: true
        };

        const config = {
            timeout: options.timeout || MESSAGE_CONFIG.DEFAULT_TIMEOUT,
            maxRetries: options.maxRetries || MESSAGE_CONFIG.MAX_RETRIES,
            target: options.target || 'background',
            tabId: options.tabId
        };

        // Store pending message
        const pending = {
            message: enhancedMessage,
            resolve: resolve,
            reject: reject,
            timeoutId: null,
            retries: 0,
            config: config
        };

        pendingMessages.set(messageId, pending);

        // Set timeout
        pending.timeoutId = setTimeout(() => {
            handleMessageTimeout(messageId);
        }, config.timeout);

        // Try to send immediately
        attemptSend(pending);
    });
}

/**
 * Attempt to send a message
 * @param {object} pending - Pending message object
 */
function attemptSend(pending) {
    const { message, config } = pending;

    try {
        let sent = false;

        if (config.target === 'content' && config.tabId) {
            // Send to content script
            chrome.tabs.sendMessage(config.tabId, message, (response) => {
                handleSendResponse(message.messageId, response, chrome.runtime.lastError);
            });
            sent = true;
        } else if (config.target === 'background' || config.target === 'popup') {
            // Send to background or popup
            chrome.runtime.sendMessage(message, (response) => {
                handleSendResponse(message.messageId, response, chrome.runtime.lastError);
            });
            sent = true;
        }

        if (!sent) {
            // Queue message if target not ready
            queueMessage(config.target, pending);
        }
    } catch (error) {
        log('error', 'Failed to send message', { messageId: message.messageId, error });
        handleMessageFailure(message.messageId, error.message);
    }
}

/**
 * Handle response to sent message
 * @param {string} messageId - Message ID
 * @param {*} response - Response received
 * @param {*} error - Chrome runtime error
 */
function handleSendResponse(messageId, response, error) {
    const pending = pendingMessages.get(messageId);
    if (!pending) return;

    if (error) {
        log('warn', 'Message send failed', { messageId, error });
        handleMessageFailure(messageId, error.message);
        return;
    }

    // Check if it's an acknowledgment
    if (response && response.action === 'ack') {
        // Message acknowledged, wait for actual response
        updateConnectionHealth(pending.config.target, true);
        return;
    }

    if (response && response.action === 'nack') {
        // Negative acknowledgment
        handleMessageFailure(messageId, response.error);
        return;
    }

    // Actual response received
    clearTimeout(pending.timeoutId);
    pendingMessages.delete(messageId);
    updateConnectionHealth(pending.config.target, true);
    pending.resolve(response);
}

/**
 * Handle message timeout
 * @param {string} messageId - Message ID
 */
function handleMessageTimeout(messageId) {
    const pending = pendingMessages.get(messageId);
    if (!pending) return;

    log('warn', 'Message timeout', { messageId, retries: pending.retries });
    handleMessageFailure(messageId, 'Timeout');
}

/**
 * Handle message failure
 * @param {string} messageId - Message ID
 * @param {string} error - Error message
 */
function handleMessageFailure(messageId, error) {
    const pending = pendingMessages.get(messageId);
    if (!pending) return;

    pending.retries++;

    if (pending.retries < pending.config.maxRetries) {
        // Retry with exponential backoff
        const delay = MESSAGE_CONFIG.RETRY_DELAY_BASE * Math.pow(2, pending.retries - 1);
        log('info', `Retrying message ${messageId} in ${delay}ms (attempt ${pending.retries}/${pending.config.maxRetries})`);

        setTimeout(() => {
            attemptSend(pending);
        }, delay);
    } else {
        // Max retries reached
        clearTimeout(pending.timeoutId);
        pendingMessages.delete(messageId);
        updateConnectionHealth(pending.config.target, false);
        pending.reject(new Error(`Message failed after ${pending.config.maxRetries} retries: ${error}`));
    }
}

/**
 * Queue message when target is not ready
 * @param {string} target - Target component
 * @param {object} pending - Pending message
 */
function queueMessage(target, pending) {
    if (!messageQueue.has(target)) {
        messageQueue.set(target, []);
    }
    messageQueue.get(target).push(pending);
    log('info', `Queued message ${pending.message.messageId} for target ${target}`);
}

/**
 * Process queued messages for a target
 * @param {string} target - Target component
 */
function processQueue(target) {
    const queue = messageQueue.get(target);
    if (!queue || queue.length === 0) return;

    const readyMessages = [];

    for (const pending of queue) {
        // Try to send queued message
        attemptSend(pending);
        readyMessages.push(pending);
    }

    // Remove processed messages
    messageQueue.set(target, queue.filter(p => !readyMessages.includes(p)));
}

/**
 * Update connection health status
 * @param {string} target - Target component
 * @param {boolean} healthy - Whether connection is healthy
 */
function updateConnectionHealth(target, healthy) {
    connectionHealth.set(target, {
        lastSeen: Date.now(),
        isHealthy: healthy
    });
}

/**
 * Check connection health and attempt recovery
 */
function checkConnectionHealth() {
    const now = Date.now();

    for (const [target, health] of connectionHealth.entries()) {
        if (!health.isHealthy && (now - health.lastSeen) > MESSAGE_CONFIG.CONNECTION_CHECK_INTERVAL) {
            log('warn', `Connection to ${target} appears unhealthy, attempting recovery`);
            // Try to re-establish connection
            if (target === 'content') {
                // Re-inject content script if needed
                reinjectContentScript();
            }
        }
    }
}

/**
 * Re-inject content script into active tabs
 */
function reinjectContentScript() {
    chrome.tabs.query({ url: '*://www.google.com/maps/*' }, (tabs) => {
        for (const tab of tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            }).catch(error => {
                log('error', 'Failed to re-inject content script', { tabId: tab.id, error });
            });
        }
    });
}

/**
 * Enhanced message listener with acknowledgment
 * @param {function} handler - Message handler function
 * @returns {function} Enhanced listener
 */
function createReliableMessageListener(handler) {
    return function (message, sender, sendResponse) {
        if (!validateMessage(message)) {
            sendNack(message.messageId || 'unknown', 'Invalid message', sender);
            return false;
        }

        // Send acknowledgment if required
        if (message.requiresAck && message.messageId) {
            sendAcknowledgment(message.messageId, sender);
        }

        // Handle the message
        try {
            const result = handler(message, sender, sendResponse);
            return result; // Return true to keep channel open for async responses
        } catch (error) {
            log('error', 'Message handler error', { message: message.action, error });
            if (message.messageId) {
                sendNack(message.messageId, error.message, sender);
            }
            return false;
        }
    };
}

/**
 * Initialize message passing system
 */
function initializeMessagePassing() {
    // Start queue processing
    setInterval(() => {
        for (const target of messageQueue.keys()) {
            processQueue(target);
        }
    }, MESSAGE_CONFIG.QUEUE_PROCESS_INTERVAL);

    // Start connection health monitoring
    setInterval(checkConnectionHealth, MESSAGE_CONFIG.CONNECTION_CHECK_INTERVAL);

    log('info', 'Message passing system initialized');
}

// Initialize when loaded
if (typeof window !== 'undefined') {
    // Browser environment
    initializeMessagePassing();

    // Export all utilities on window.GMBUtils for use by other content scripts
    window.GMBUtils = {
        // Basic utilities
        isOnGoogleMaps,
        waitForElement,
        debounce,
        sanitizeText,
        generateId,
        formatDateForExcel,
        log,
        Logger,
        loggers,
        checkPermissions,
        requestPermissions,
        // Retry utilities
        retryWithBackoff,
        CircuitBreaker,
        calculateExponentialBackoff,
        // Message passing
        MESSAGE_CONFIG,
        sendMessageReliably,
        createReliableMessageListener,
        validateMessage,
        sendAcknowledgment,
        sendNack,
        updateConnectionHealth,
        reinjectContentScript
    };
}