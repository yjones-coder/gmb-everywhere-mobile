// Background service worker for GMB Excel Export extension
import './scripts/auth.js';

let isExporting = false;
let exportTabId = null;

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    switch (message.type) {
        case 'OAUTH_CALLBACK':
            auth.handleOAuthCallback(message).then(() => {
                sendResponse({ success: true });
            }).catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
            return true;

        case 'USER_INFO_UPDATE':
            auth.handleUserInfoUpdate(message.user).then(() => {
                sendResponse({ success: true });
            }).catch((error) => {
                sendResponse({ success: false, error: error.message });
            });
            return true;
    }

    switch (message.action) {
        case 'getStatus':
            sendResponse({ isExporting: isExporting });
            break;

        case 'startExport':
            if (isExporting) {
                sendResponse({ success: false, error: 'Export already running' });
                return;
            }

            // Get the active tab
            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length === 0) {
                    sendResponse({ success: false, error: 'No active tab found' });
                    return;
                }

                const tab = tabs[0];
                if (!tab.url || !tab.url.includes('google.com/maps')) {
                    sendResponse({ success: false, error: 'Not on Google Maps' });
                    return;
                }

                isExporting = true;
                exportTabId = tab.id;

                // Send message to content script to start scraping
                chrome.tabs.sendMessage(tab.id, { action: 'startScraping' }, function (response) {
                    if (chrome.runtime.lastError) {
                        console.error('Error sending message to content script:', chrome.runtime.lastError);
                        isExporting = false;
                        exportTabId = null;
                        sendResponse({ success: false, error: 'Content script not ready' });
                    } else {
                        sendResponse({ success: true });
                    }
                });
            });
            return true; // Keep message channel open for async response

        case 'stopExport':
            if (!isExporting) {
                sendResponse({ success: false, error: 'No export running' });
                return;
            }

            isExporting = false;

            // Send message to content script to stop scraping
            if (exportTabId) {
                chrome.tabs.sendMessage(exportTabId, { action: 'stopScraping' }, function (response) {
                    // Ignore response
                });
            }

            exportTabId = null;
            sendResponse({ success: true });
            break;

        case 'progressUpdate':
            // Forward progress updates to popup
            chrome.runtime.sendMessage(message);
            break;

        case 'exportComplete':
            isExporting = false;
            exportTabId = null;
            // Forward completion to popup
            chrome.runtime.sendMessage(message);
            break;

        case 'exportError':
            isExporting = false;
            exportTabId = null;
            // Forward error to popup
            chrome.runtime.sendMessage(message);
            break;

        case 'login':
            auth.login().then(() => {
                sendResponse({ success: true });
            }).catch((error) => {
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

        default:
            sendResponse({ success: false, error: 'Unknown action' });
    }
});

// Handle tab updates to reset export state if user navigates away
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (isExporting && exportTabId === tabId && changeInfo.url && !changeInfo.url.includes('google.com/maps')) {
        // User navigated away from Google Maps, stop export
        isExporting = false;
        exportTabId = null;
        chrome.runtime.sendMessage({ action: 'exportError', error: 'Navigated away from Google Maps' });
    }
});

chrome.tabs.onRemoved.addListener(function (tabId, removeInfo) {
    if (isExporting && exportTabId === tabId) {
        // Tab was closed, stop export
        isExporting = false;
        exportTabId = null;
        chrome.runtime.sendMessage({ action: 'exportError', error: 'Google Maps tab was closed' });
    }
});