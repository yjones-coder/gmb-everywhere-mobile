// Content script for web app to detect authentication and send to extension

// Import utility functions
const {
    loggers
} = require('./utils.js');

// Get component-specific logger
const logger = loggers.auth;

const USER_INFO_KEY = "google-oauth-user-info";

// Check if on OAuth callback page and extract session token
function checkForOAuthCallback() {
    const url = new URL(window.location.href);
    const sessionToken = url.searchParams.get('sessionToken');
    const userParam = url.searchParams.get('user');

    if (sessionToken) {
        logger.info('Found session token in URL');
        // Send to background script
        chrome.runtime.sendMessage({
            type: 'OAUTH_CALLBACK',
            sessionToken: sessionToken,
            user: userParam
        });
    }
}

// Check for user info in localStorage
function checkForUserInfo() {
    const userInfo = localStorage.getItem(USER_INFO_KEY);
    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            logger.info('Found user info in localStorage');
            // Send to background script
            chrome.runtime.sendMessage({
                type: 'USER_INFO_UPDATE',
                user: user
            });
        } catch (error) {
            logger.error('Failed to parse user info', { error: error.message });
        }
    }
}

// Listen for localStorage changes
function listenForStorageChanges() {
    window.addEventListener('storage', (e) => {
        if (e.key === USER_INFO_KEY && e.newValue) {
            try {
                const user = JSON.parse(e.newValue);
                logger.info('User info updated in localStorage');
                chrome.runtime.sendMessage({
                    type: 'USER_INFO_UPDATE',
                    user: user
                });
            } catch (error) {
                logger.error('Failed to parse updated user info', { error: error.message });
            }
        }
    });
}

// Initialize
function init() {
    logger.info('Initializing auth content script');

    // Check immediately
    checkForOAuthCallback();
    checkForUserInfo();

    // Listen for changes
    listenForStorageChanges();

    // Also check periodically in case we miss the initial load
    setInterval(() => {
        checkForUserInfo();
    }, 1000);
}

init();