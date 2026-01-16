// Background service worker for GMB Excel Export extension

// ===== INLINED UTILITIES (Service workers don't support CommonJS require) =====

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
 * Legacy log function for backward compatibility
 */
function log(level, message, data = null) {
    const levelMap = {
        'log': 'INFO',
        'warn': 'WARN',
        'error': 'ERROR',
        'info': 'INFO',
        'debug': 'DEBUG'
    };

    const mappedLevel = levelMap[level] || 'INFO';
    const context = data ? { data } : {};
    loggers.utils.log(mappedLevel, message, context);
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

// ===== END INLINED UTILITIES =====

// Get component-specific logger
const logger = loggers.background;

// Authentication module for Chrome extension
// Handles OAuth login, token storage, and session management

const SESSION_TOKEN_KEY = 'app_session_token';
const USER_INFO_KEY = 'google-oauth-user-info';
const API_BASE_URL = 'http://localhost:3000'; // TODO: Make configurable

class Auth {
    constructor() {
        this.apiBaseUrl = API_BASE_URL;
    }

    // Get session token from storage
    async getSessionToken() {
        try {
            const result = await chrome.storage.local.get([SESSION_TOKEN_KEY]);
            return result[SESSION_TOKEN_KEY] || null;
        } catch (error) {
            logger.error('Failed to get session token', { error: error.message });
            return null;
        }
    }

    // Set session token in storage
    async setSessionToken(token) {
        try {
            await chrome.storage.local.set({ [SESSION_TOKEN_KEY]: token });
            logger.info('Session token stored');
        } catch (error) {
            logger.error('Failed to set session token', { error: error.message });
            throw error;
        }
    }

    // Remove session token from storage
    async removeSessionToken() {
        try {
            await chrome.storage.local.remove([SESSION_TOKEN_KEY]);
            logger.info('Session token removed');
        } catch (error) {
            logger.error('Failed to remove session token', { error: error.message });
        }
    }

    // Get user info from storage
    async getUserInfo() {
        try {
            const result = await chrome.storage.local.get([USER_INFO_KEY]);
            const info = result[USER_INFO_KEY];
            if (info) {
                return JSON.parse(info);
            }
            return null;
        } catch (error) {
            logger.error('Failed to get user info', { error: error.message });
            return null;
        }
    }

    // Set user info in storage
    async setUserInfo(user) {
        try {
            await chrome.storage.local.set({ [USER_INFO_KEY]: JSON.stringify(user) });
            logger.info('User info stored');
        } catch (error) {
            logger.error('Failed to set user info', { error: error.message });
            throw error;
        }
    }

    // Clear user info from storage
    async clearUserInfo() {
        try {
            await chrome.storage.local.remove([USER_INFO_KEY]);
            logger.info('User info cleared');
        } catch (error) {
            logger.error('Failed to clear user info', { error: error.message });
        }
    }

    // Check if user is authenticated
    async isAuthenticated() {
        const token = await this.getSessionToken();
        const user = await this.getUserInfo();
        return !!(token && user);
    }

    // Get current user from API
    async getMe() {
        return await apiCircuitBreakers.auth.execute(async () => {
            return await retryWithBackoff(async () => {
                const token = await this.getSessionToken();
                const response = await fetch(`${this.apiBaseUrl}/api/trpc/auth.me`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                    },
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error(`API call failed: ${response.status}`);
                }

                const data = await response.json();
                return data.result?.data?.json || null;
            }, {
                maxRetries: 3,
                baseDelay: 1000,
                shouldRetry: (error) => {
                    // Retry on network errors and 5xx status codes
                    return error.message.includes('fetch') ||
                        error.message.includes('NetworkError') ||
                        error.message.includes('500') ||
                        error.message.includes('502') ||
                        error.message.includes('503') ||
                        error.message.includes('504');
                },
                onRetry: (attempt, error, delay) => {
                    logger.warn(`getMe retry ${attempt} in ${delay}ms`, { error: error.message });
                }
            });
        }).catch(error => {
            logger.error('getMe failed after retries', { error: error.message });
            return null;
        });
    }

    // Logout
    async logout() {
        try {
            await this.removeSessionToken();
            await this.clearUserInfo();
            logger.info('Logged out');
        } catch (error) {
            logger.error('Logout failed', { error: error.message });
        }
    }

    // Generate OAuth login URL for Chrome Identity API
    getLoginUrl() {
        const clientId = '1042565699485-gbdl6smh4ugpsph0n3m3c0ioggpsq63m.apps.googleusercontent.com'; // Hardcoded for extension
        const scope = 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';

        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('scope', scope);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('access_type', 'offline');

        return url.toString();
    }

    // Initiate login
    async login() {
        const loginUrl = this.getLoginUrl();
        logger.info('Starting OAuth flow', { loginUrl });

        try {
            // Use Chrome Identity API for OAuth
            const redirectUrl = await chrome.identity.launchWebAuthFlow({
                url: loginUrl,
                interactive: true
            });

            logger.info('OAuth flow completed', { redirectUrl });

            if (redirectUrl) {
                // Extract authorization code from redirect URL
                const url = new URL(redirectUrl);
                const code = url.searchParams.get('code');

                if (code) {
                    logger.info('Got authorization code, exchanging for token');

                    // Exchange code for session token
                    const response = await fetch(`${this.apiBaseUrl}/api/oauth/extension`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            code: code,
                            redirectUri: `https://${chrome.runtime.id}.chromiumapp.org/`
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`Token exchange failed: ${response.status}`);
                    }

                    const data = await response.json();
                    logger.info('Token exchange successful');

                    // Store session token and user info
                    await this.setSessionToken(data.sessionToken);
                    await this.setUserInfo(data.user);

                    logger.info('Login completed successfully');
                } else {
                    throw new Error('No authorization code in redirect URL');
                }
            } else {
                throw new Error('OAuth flow was cancelled');
            }
        } catch (error) {
            logger.error('Login failed', { error: error.message });
            throw error;
        }
    }
}

// Export singleton instance
const auth = new Auth();

// ===== CIRCUIT BREAKERS FOR API CALLS =====

// Circuit breakers for different types of API operations
const apiCircuitBreakers = {
    auth: new CircuitBreaker({ failureThreshold: 3, recoveryTimeout: 30000 }), // Auth operations
    exports: new CircuitBreaker({ failureThreshold: 5, recoveryTimeout: 60000 }), // Export operations
    credits: new CircuitBreaker({ failureThreshold: 3, recoveryTimeout: 30000 }) // Credit operations
};

// ===== MESSAGE PASSING UTILITIES =====

const MESSAGE_CONFIG = {
    DEFAULT_TIMEOUT: 10000,
    MAX_RETRIES: 3,
    RETRY_DELAY_BASE: 1000,
    QUEUE_PROCESS_INTERVAL: 500,
    CONNECTION_CHECK_INTERVAL: 30000,
    ACK_TIMEOUT: 5000
};

const messageQueue = new Map();
const pendingMessages = new Map();
const connectionHealth = new Map();

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function validateMessage(message) {
    if (!message || typeof message !== 'object') {
        logger.error('Invalid message: not an object', { message });
        return false;
    }

    if (!message.action || typeof message.action !== 'string') {
        logger.error('Invalid message: missing or invalid action', { message });
        return false;
    }

    const requiredFields = {
        'ack': ['messageId'],
        'nack': ['messageId', 'error']
    };

    const fields = requiredFields[message.action];
    if (fields) {
        for (const field of fields) {
            if (!(field in message)) {
                logger.error(`Invalid message: missing required field '${field}' for action '${message.action}'`, { message });
                return false;
            }
        }
    }

    return true;
}

function sendAcknowledgment(messageId, sender) {
    const ackMessage = {
        action: 'ack',
        messageId: messageId,
        timestamp: Date.now()
    };

    try {
        if (sender.tab) {
            chrome.tabs.sendMessage(sender.tab.id, ackMessage);
        } else {
            chrome.runtime.sendMessage(ackMessage);
        }
    } catch (error) {
        logger.error('Failed to send acknowledgment', { messageId, error: error.message });
    }
}

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
        logger.error('Failed to send NACK', { messageId, error: err.message });
    }
}

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

        const pending = {
            message: enhancedMessage,
            resolve: resolve,
            reject: reject,
            timeoutId: null,
            retries: 0,
            config: config
        };

        pendingMessages.set(messageId, pending);

        pending.timeoutId = setTimeout(() => {
            handleMessageTimeout(messageId);
        }, config.timeout);

        attemptSend(pending);
    });
}

function attemptSend(pending) {
    const { message, config } = pending;

    try {
        let sent = false;

        if (config.target === 'content' && config.tabId) {
            chrome.tabs.sendMessage(config.tabId, message, (response) => {
                handleSendResponse(message.messageId, response, chrome.runtime.lastError);
            });
            sent = true;
        } else if (config.target === 'background' || config.target === 'popup') {
            chrome.runtime.sendMessage(message, (response) => {
                handleSendResponse(message.messageId, response, chrome.runtime.lastError);
            });
            sent = true;
        }

        if (!sent) {
            queueMessage(config.target, pending);
        }
    } catch (error) {
        logger.error('Failed to send message', { messageId: message.messageId, error: error.message });
        handleMessageFailure(message.messageId, error.message);
    }
}

function handleSendResponse(messageId, response, error) {
    const pending = pendingMessages.get(messageId);
    if (!pending) return;

    if (error) {
        logger.warn('Message send failed', { messageId, error: error.message });
        handleMessageFailure(messageId, error.message);
        return;
    }

    if (response && response.action === 'ack') {
        updateConnectionHealth(pending.config.target, true);
        return;
    }

    if (response && response.action === 'nack') {
        handleMessageFailure(messageId, response.error);
        return;
    }

    clearTimeout(pending.timeoutId);
    pendingMessages.delete(messageId);
    updateConnectionHealth(pending.config.target, true);
    pending.resolve(response);
}

function handleMessageTimeout(messageId) {
    const pending = pendingMessages.get(messageId);
    if (!pending) return;

    logger.warn('Message timeout', { messageId, retries: pending.retries });
    handleMessageFailure(messageId, 'Timeout');
}

function handleMessageFailure(messageId, error) {
    const pending = pendingMessages.get(messageId);
    if (!pending) return;

    pending.retries++;

    if (pending.retries < pending.config.maxRetries) {
        const delay = MESSAGE_CONFIG.RETRY_DELAY_BASE * Math.pow(2, pending.retries - 1);
        logger.info(`Retrying message ${messageId} in ${delay}ms (attempt ${pending.retries}/${pending.config.maxRetries})`);

        setTimeout(() => {
            attemptSend(pending);
        }, delay);
    } else {
        clearTimeout(pending.timeoutId);
        pendingMessages.delete(messageId);
        updateConnectionHealth(pending.config.target, false);
        pending.reject(new Error(`Message failed after ${pending.config.maxRetries} retries: ${error}`));
    }
}

function queueMessage(target, pending) {
    if (!messageQueue.has(target)) {
        messageQueue.set(target, []);
    }
    messageQueue.get(target).push(pending);
    logger.info(`Queued message ${pending.message.messageId} for target ${target}`);
}

function processQueue(target) {
    const queue = messageQueue.get(target);
    if (!queue || queue.length === 0) return;

    const readyMessages = [];

    for (const pending of queue) {
        attemptSend(pending);
        readyMessages.push(pending);
    }

    messageQueue.set(target, queue.filter(p => !readyMessages.includes(p)));
}

function updateConnectionHealth(target, healthy) {
    connectionHealth.set(target, {
        lastSeen: Date.now(),
        isHealthy: healthy
    });
}

function checkConnectionHealth() {
    const now = Date.now();

    for (const [target, health] of connectionHealth.entries()) {
        if (!health.isHealthy && (now - health.lastSeen) > MESSAGE_CONFIG.CONNECTION_CHECK_INTERVAL) {
            logger.warn(`Connection to ${target} appears unhealthy, attempting recovery`);
            if (target === 'content') {
                reinjectContentScript();
            }
        }
    }
}

function reinjectContentScript() {
    chrome.tabs.query({ url: '*://www.google.com/maps/*' }, (tabs) => {
        for (const tab of tabs) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content.js']
            }).catch(error => {
                logger.error('Failed to re-inject content script', { tabId: tab.id, error: error.message });
            });
        }
    });
}

function createReliableMessageListener(handler) {
    return function (message, sender, sendResponse) {
        if (!validateMessage(message)) {
            sendNack(message.messageId || 'unknown', 'Invalid message', sender);
            return false;
        }

        if (message.requiresAck && message.messageId) {
            sendAcknowledgment(message.messageId, sender);
        }

        try {
            const result = handler(message, sender, sendResponse);
            return result;
        } catch (error) {
            logger.error('Message handler error', { message: message.action, error: error.message });
            if (message.messageId) {
                sendNack(message.messageId, error.message, sender);
            }
            return false;
        }
    };
}

// Initialize message passing system
function initializeMessagePassing() {
    setInterval(() => {
        for (const target of messageQueue.keys()) {
            processQueue(target);
        }
    }, MESSAGE_CONFIG.QUEUE_PROCESS_INTERVAL);

    setInterval(checkConnectionHealth, MESSAGE_CONFIG.CONNECTION_CHECK_INTERVAL);

    logger.info('Message passing system initialized');
}

initializeMessagePassing();

let isExporting = false;
let exportTabId = null;
let currentExportId = null;

// Operation-level retry configuration
const EXPORT_RETRY_CONFIG = {
    maxRetries: 2,
    baseDelay: 5000, // 5 seconds
    maxDelay: 30000  // 30 seconds
};

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(createReliableMessageListener(function (message, sender, sendResponse) {

    switch (message.action) {
        case 'getStatus':
            sendResponse({ isExporting: isExporting });
            break;

        case 'startExport':
            if (isExporting) {
                sendResponse({ success: false, error: 'Export already running' });
                return;
            }

            // Start export with operation-level retry
            (async () => {
                let exportAttempt = 0;

                const attemptExport = async () => {
                    exportAttempt++;
                    logger.info(`Starting export attempt ${exportAttempt}`);

                    try {
                        const token = await auth.getSessionToken();
                        if (!token) {
                            throw new Error('Not authenticated');
                        }

                        // Create export (this checks credits)
                        const createData = await apiCircuitBreakers.exports.execute(async () => {
                            return await retryWithBackoff(async () => {
                                const response = await fetch(`${auth.apiBaseUrl}/api/trpc/exports.create`, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    body: JSON.stringify({
                                        json: {}
                                    })
                                });

                                if (!response.ok) {
                                    const errorData = await response.json();
                                    throw new Error(errorData.error?.message || `Failed to create export: ${response.status}`);
                                }

                                const data = await response.json();
                                return data;
                            }, {
                                maxRetries: 3,
                                baseDelay: 1000,
                                shouldRetry: (error) => {
                                    // Retry on network errors and 5xx status codes
                                    return error.message.includes('fetch') ||
                                        error.message.includes('NetworkError') ||
                                        error.message.includes('500') ||
                                        error.message.includes('502') ||
                                        error.message.includes('503') ||
                                        error.message.includes('504');
                                },
                                onRetry: (attempt, error, delay) => {
                                    logger.warn(`[Export] Create retry ${attempt} in ${delay}ms`, { error: error.message });
                                }
                            });
                        });

                        const exportId = createData.result?.data?.json?.exportId;
                        currentExportId = exportId;

                        // Get the active tab
                        const tabs = await new Promise((resolve, reject) => {
                            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                                if (chrome.runtime.lastError) {
                                    reject(new Error(chrome.runtime.lastError.message));
                                } else {
                                    resolve(tabs);
                                }
                            });
                        });

                        if (tabs.length === 0) {
                            throw new Error('No active tab found');
                        }

                        const tab = tabs[0];
                        if (!tab.url || !tab.url.includes('google.com/maps')) {
                            throw new Error('Not on Google Maps');
                        }

                        isExporting = true;
                        exportTabId = tab.id;

                        // Send message to content script to start scraping with retry
                        await sendMessageReliably({ action: 'startScraping' }, { target: 'content', tabId: tab.id });

                        logger.info(`Export attempt ${exportAttempt} started successfully`);
                        sendResponse({ success: true });

                    } catch (error) {
                        logger.error(`Export attempt ${exportAttempt} failed`, { error: error.message });

                        // Clean up on failure
                        isExporting = false;
                        exportTabId = null;
                        currentExportId = null;

                        // Check if we should retry the entire operation
                        if (exportAttempt < EXPORT_RETRY_CONFIG.maxRetries &&
                            (error.message.includes('fetch') ||
                                error.message.includes('NetworkError') ||
                                error.message.includes('Content script not ready'))) {

                            const delay = Math.min(
                                EXPORT_RETRY_CONFIG.baseDelay * Math.pow(2, exportAttempt - 1),
                                EXPORT_RETRY_CONFIG.maxDelay
                            );

                            logger.warn(`Retrying entire export operation in ${delay}ms (attempt ${exportAttempt + 1}/${EXPORT_RETRY_CONFIG.maxRetries})`);

                            setTimeout(attemptExport, delay);
                            return;
                        }

                        // Max retries reached or non-retryable error
                        sendResponse({ success: false, error: `Export failed after ${exportAttempt} attempts: ${error.message}` });
                    }
                };

                // Start the first attempt
                attemptExport();

            })();
            return true; // Keep message channel open for async response

        case 'stopExport':
            if (!isExporting) {
                sendResponse({ success: false, error: 'No export running' });
                return;
            }

            isExporting = false;

            // Send message to content script to stop scraping
            if (exportTabId) {
                sendMessageReliably({ action: 'stopScraping' }, { target: 'content', tabId: exportTabId })
                    .catch((error) => {
                        logger.warn('Failed to stop scraping', { error: error.message });
                    });
            }

            exportTabId = null;
            currentExportId = null;
            sendResponse({ success: true });
            break;

        case 'progressUpdate':
            // Forward progress updates to popup
            sendMessageReliably(message, { target: 'popup' }).catch(error => {
                logger.warn('Failed to forward progress update', { error: error.message });
            });
            break;

        case 'exportComplete':
            isExporting = false;
            exportTabId = null;

            // Handle partial success - check if we need to retry failed components
            const hasPartialFailures = message.partialFailures && message.partialFailures.length > 0;
            const totalBusinesses = message.totalBusinesses || 0;
            const successfulBusinesses = message.successfulBusinesses || 0;

            if (hasPartialFailures && successfulBusinesses > 0 && successfulBusinesses < totalBusinesses) {
                logger.warn(`Export completed with partial failures: ${successfulBusinesses}/${totalBusinesses} businesses extracted`);

                // Notify user of partial success and offer retry for failed components
                sendMessageReliably({
                    action: 'exportComplete',
                    partialSuccess: true,
                    successfulBusinesses: successfulBusinesses,
                    totalBusinesses: totalBusinesses,
                    partialFailures: message.partialFailures
                }, { target: 'popup' }).catch(error => {
                    logger.warn('Failed to forward partial success notification', { error: error.message });
                });

                // For now, we'll complete the export but log the partial failures
                // In a future enhancement, we could implement retry for specific failed businesses
                logger.info('Partial failures detected', { partialFailures: message.partialFailures });
            } else {
                // Forward completion to popup
                sendMessageReliably(message, { target: 'popup' }).catch(error => {
                    logger.warn('Failed to forward export completion', { error: error.message });
                });
            }

            // Update export status to completed (this deducts credits)
            if (currentExportId) {
                (async () => {
                    try {
                        const token = await auth.getSessionToken();
                        if (token) {
                            await apiCircuitBreakers.exports.execute(async () => {
                                return await retryWithBackoff(async () => {
                                    const response = await fetch(`${auth.apiBaseUrl}/api/trpc/exports.updateStatus`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`
                                        },
                                        body: JSON.stringify({
                                            json: {
                                                exportId: currentExportId,
                                                status: 'completed'
                                            }
                                        })
                                    });

                                    if (!response.ok) {
                                        throw new Error(`Failed to update export status: ${response.status}`);
                                    }

                                    return await response.json();
                                }, {
                                    maxRetries: 3,
                                    baseDelay: 1000,
                                    shouldRetry: (error) => {
                                        // Retry on network errors and 5xx status codes
                                        return error.message.includes('fetch') ||
                                            error.message.includes('NetworkError') ||
                                            error.message.includes('500') ||
                                            error.message.includes('502') ||
                                            error.message.includes('503') ||
                                            error.message.includes('504');
                                    },
                                    onRetry: (attempt, error, delay) => {
                                        logger.warn(`[Export] Update status retry ${attempt} in ${delay}ms`, { error: error.message });
                                    }
                                });
                            });
                        }
                    } catch (error) {
                        logger.error('Failed to update export status after retries', { error: error.message });
                    }
                })();
            }

            currentExportId = null;
            break;

        case 'exportError':
            isExporting = false;
            exportTabId = null;
            currentExportId = null;
            // Forward error to popup
            sendMessageReliably(message, { target: 'popup' }).catch(error => {
                logger.warn('Failed to forward export error', { error: error.message });
            });
            break;

        case 'login':
            console.log('Login action received');
            auth.login().then(() => {
                sendResponse({ success: true });
            }).catch((error) => {
                console.log('Login error:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true;

        case 'logout':
            auth.logout().then(() => {
                sendResponse({ success: true });
            }).catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
            return true;

        case 'checkAuth':
            auth.isAuthenticated().then((isAuthenticated) => {
                if (isAuthenticated) {
                    return auth.getUserInfo().then((user) => {
                        sendResponse({ isAuthenticated: true, user: user });
                    });
                } else {
                    sendResponse({ isAuthenticated: false });
                }
            }).catch((error) => {
                sendResponse({ isAuthenticated: false, error: error.message });
            });
            return true;

        case 'getCredits':
            (async () => {
                try {
                    const token = await auth.getSessionToken();
                    if (!token) {
                        sendResponse({ balance: 0 });
                        return;
                    }

                    const data = await apiCircuitBreakers.credits.execute(async () => {
                        return await retryWithBackoff(async () => {
                            const response = await fetch(`${auth.apiBaseUrl}/api/trpc/credits.balance`, {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                }
                            });

                            if (!response.ok) {
                                throw new Error(`Failed to get credits: ${response.status}`);
                            }

                            return await response.json();
                        }, {
                            maxRetries: 3,
                            baseDelay: 1000,
                            shouldRetry: (error) => {
                                // Retry on network errors and 5xx status codes
                                return error.message.includes('fetch') ||
                                    error.message.includes('NetworkError') ||
                                    error.message.includes('500') ||
                                    error.message.includes('502') ||
                                    error.message.includes('503') ||
                                    error.message.includes('504');
                            },
                            onRetry: (attempt, error, delay) => {
                                logger.warn(`[Credits] Balance retry ${attempt} in ${delay}ms`, { error: error.message });
                            }
                        });
                    });

                    const balance = data.result?.data?.json?.balance || 0;
                    sendResponse({ balance: balance });
                } catch (error) {
                    logger.error('Failed to get credits after retries', { error: error.message });
                    sendResponse({ balance: 0 });
                }
            })();
            return true;

        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
}));

// Handle tab updates to reset export state if user navigates away
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (isExporting && exportTabId === tabId && changeInfo.url && !changeInfo.url.includes('google.com/maps')) {
        // User navigated away from Google Maps, stop export
        isExporting = false;
        exportTabId = null;
        currentExportId = null;
        sendMessageReliably({ action: 'exportError', error: 'Navigated away from Google Maps' }, { target: 'popup' })
            .catch(error => logger.warn('Failed to send navigation error', { error: error.message }));
    }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (isExporting && exportTabId === tabId) {
        // Tab was closed, stop export
        isExporting = false;
        exportTabId = null;
        currentExportId = null;
        sendMessageReliably({ action: 'exportError', error: 'Google Maps tab was closed' }, { target: 'popup' })
            .catch(error => logger.warn('Failed to send tab closed error', { error: error.message }));
    }
});