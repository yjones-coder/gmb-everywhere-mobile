// Popup script for GMB Excel Export extension

// Get utility functions from window.GMBUtils (loaded via utils.js in popup.html)
const {
    loggers,
    sendMessageReliably,
    createReliableMessageListener,
    validateMessage,
    sendAcknowledgment,
    sendNack
} = window.GMBUtils;

// Get component-specific logger
const logger = loggers.popup;

logger.info('Popup script loaded');

// ===== UI UTILITY FUNCTIONS =====

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

function throttle(func, limit) {
    let inThrottle;
    return function () {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

let domCache = {};
let cleanupTasks = [];

function cacheDOMElement(id) {
    if (!domCache[id]) {
        domCache[id] = document.getElementById(id);
    }
    return domCache[id];
}

function scheduleCleanup(task) {
    cleanupTasks.push(task);
}

function cleanup() {
    cleanupTasks.forEach(task => {
        if (typeof task === 'function') {
            task();
        }
    });
    cleanupTasks = [];
}

// UI state management
let currentLoadingMessage = '';
let currentErrorMessage = '';

function showLoading(message = 'Loading...') {
    const loadingSpinner = cacheDOMElement('loading-spinner');
    const statusText = cacheDOMElement('status-text');

    if (loadingSpinner && statusText) {
        currentLoadingMessage = message;
        loadingSpinner.style.display = 'inline-block';
        statusText.textContent = message;
        clearError();
    }
}

function hideLoading() {
    const loadingSpinner = cacheDOMElement('loading-spinner');

    if (loadingSpinner) {
        loadingSpinner.style.display = 'none';
    }
}

function showError(message) {
    const errorDiv = cacheDOMElement('error-message');
    const statusText = cacheDOMElement('status-text');

    if (errorDiv && statusText) {
        currentErrorMessage = message;
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        statusText.textContent = 'Error occurred';
        hideLoading();
    }
}

function clearError() {
    const errorDiv = cacheDOMElement('error-message');

    if (errorDiv) {
        errorDiv.style.display = 'none';
        currentErrorMessage = '';
    }
}

function updateUIAsync(updates) {
    requestAnimationFrame(() => {
        updates.forEach(update => update());
    });
}

document.addEventListener('DOMContentLoaded', function () {
    logger.debug('DOMContentLoaded fired');

    // Cache DOM elements
    const startButton = cacheDOMElement('start-export');
    const stopButton = cacheDOMElement('stop-export');
    const statusText = cacheDOMElement('status-text');
    const progressContainer = cacheDOMElement('progress-container');
    const progressFill = cacheDOMElement('progress-fill');
    const progressText = cacheDOMElement('progress-text');

    // Auth elements
    const authText = cacheDOMElement('auth-text');
    const loginBtn = cacheDOMElement('login-btn');
    const logoutBtn = cacheDOMElement('logout-btn');

    // Credits elements
    const creditsSection = cacheDOMElement('credits-section');
    const creditsText = cacheDOMElement('credits-text');
    const buyCreditsBtn = cacheDOMElement('buy-credits-btn');

    // Add cleanup on popup close
    window.addEventListener('beforeunload', cleanup);

    logger.debug('loginBtn element', { found: !!loginBtn });

    if (!loginBtn) {
        logger.error('Login button not found in DOM');
        showError('UI initialization failed: Login button not found');
        return;
    } else {
        logger.debug('Login button found, attaching event listener');
    }

    let isExporting = false;
    let isAuthenticated = false;

    // Check authentication status
    try {
        checkAuthStatus();
    } catch (error) {
        logger.error('Failed to check auth status', { error: error.message });
        showError('Failed to check authentication status');
    }

    // Track if we're on Google Maps (only affects export, not login)
    let isOnMaps = false;

    // Check if we're on Google Maps - only affects export functionality
    try {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            if (chrome.runtime.lastError) {
                logger.error('Failed to query tabs', { error: chrome.runtime.lastError.message });
                // Don't show error - login should still work
                isOnMaps = false;
                statusText.textContent = 'Navigate to Google Maps to export';
                startButton.disabled = true;
                return;
            }

            const currentTab = tabs[0];
            if (!currentTab) {
                isOnMaps = false;
                statusText.textContent = 'Navigate to Google Maps to export';
                startButton.disabled = true;
                return;
            }

            isOnMaps = currentTab.url && currentTab.url.includes('google.com/maps');

            if (!isOnMaps) {
                statusText.textContent = 'Navigate to Google Maps to export';
                startButton.disabled = true;
                // Don't return - login should still work from any page
            } else {
                // Only check export status if we're on Google Maps
                sendMessageReliably({ action: 'getStatus' }, { target: 'background' })
                    .then((response) => {
                        if (response && response.isExporting) {
                            isExporting = true;
                            updateUIForExporting();
                        }
                    })
                    .catch((error) => {
                        logger.error('Failed to get export status', { error: error.message });
                        // Don't show error for this - it's not critical
                    });
            }
        });
    } catch (error) {
        logger.error('Failed to check Google Maps', { error: error.message });
        // Don't disable everything - just export
        statusText.textContent = 'Navigate to Google Maps to export';
        startButton.disabled = true;
    }

    // Auth button handlers with debouncing
    const debouncedLogin = debounce(function (event) {
        logger.debug('Login button clicked', { event: event.type });
        logger.debug('About to send login message to background script');
        showLoading('Initiating login...');
        sendMessageReliably({ action: 'login' }, { target: 'background' })
            .then((response) => {
                logger.debug('Received response from background', { response });
                if (response && response.success) {
                    logger.info('Login initiated successfully');
                    showLoading('Logging in...');
                } else {
                    logger.warn('Login failed', { response });
                    showError(response.error || 'Login failed');
                }
            })
            .catch((error) => {
                logger.error('Login message failed', { error: error.message });
                showError('Failed to initiate login');
            });
    }, 300);

    if (loginBtn) {
        loginBtn.addEventListener('click', debouncedLogin);
        scheduleCleanup(() => loginBtn.removeEventListener('click', debouncedLogin));
        logger.debug('Login button event listener attached');
    }

    const debouncedLogout = debounce(function () {
        showLoading('Logging out...');
        sendMessageReliably({ action: 'logout' }, { target: 'background' })
            .then((response) => {
                if (response && response.success) {
                    updateAuthUI(false);
                    creditsSection.style.display = 'none';
                } else {
                    showError(response.error || 'Logout failed');
                }
            })
            .catch((error) => {
                logger.error('Logout message failed', { error: error.message });
                showError('Failed to logout');
            });
    }, 300);

    logoutBtn.addEventListener('click', debouncedLogout);
    scheduleCleanup(() => logoutBtn.removeEventListener('click', debouncedLogout));

    const debouncedBuyCredits = debounce(function () {
        try {
            showLoading('Opening credits page...');
            chrome.tabs.create({ url: 'http://localhost:3001/credits' }, () => {
                if (chrome.runtime.lastError) {
                    showError('Failed to open credits page');
                } else {
                    hideLoading();
                }
            });
        } catch (error) {
            logger.error('Failed to open credits page', { error: error.message });
            showError('Failed to open credits page');
        }
    }, 300);

    buyCreditsBtn.addEventListener('click', debouncedBuyCredits);
    scheduleCleanup(() => buyCreditsBtn.removeEventListener('click', debouncedBuyCredits));

    function checkAuthStatus() {
        sendMessageReliably({ action: 'checkAuth' }, { target: 'background' })
            .then((response) => {
                if (response && response.isAuthenticated) {
                    isAuthenticated = true;
                    updateAuthUI(true, response.user);
                    fetchCredits();
                    clearError();
                } else {
                    isAuthenticated = false;
                    updateAuthUI(false);
                    creditsSection.style.display = 'none';
                }
            })
            .catch((error) => {
                logger.error('Check auth message failed', { error: error.message });
                showError('Failed to check authentication');
            });
    }

    function fetchCredits() {
        sendMessageReliably({ action: 'getCredits' }, { target: 'background' })
            .then((response) => {
                if (response && response.balance !== undefined) {
                    creditsText.textContent = `Credits: ${response.balance}`;
                    creditsSection.style.display = 'block';
                    // Enable/disable start button based on credits AND being on Google Maps
                    // Start button requires: authenticated + on Google Maps + has credits
                    startButton.disabled = !isOnMaps || response.balance < 1;
                    if (!isOnMaps) {
                        statusText.textContent = 'Navigate to Google Maps to export';
                    }
                }
            })
            .catch((error) => {
                logger.error('Get credits message failed', { error: error.message });
            });
    }

    function updateAuthUI(authenticated, user = null) {
        if (authenticated && user) {
            authText.textContent = `Logged in as ${user.name || user.email}`;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            // Start button requires: authenticated + on Google Maps
            // Credits check happens in fetchCredits
            startButton.disabled = !isOnMaps;
            if (!isOnMaps) {
                statusText.textContent = 'Navigate to Google Maps to export';
            }
        } else {
            authText.textContent = 'Not logged in';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            startButton.disabled = true;
        }
    }

    const debouncedStartExport = debounce(function () {
        if (isExporting) return;

        isExporting = true;
        updateUIAsync([
            () => updateUIForExporting(),
            () => showLoading('Starting export...')
        ]);

        // Send message to background script to start export
        sendMessageReliably({ action: 'startExport' }, { target: 'background' })
            .then((response) => {
                if (response && response.success) {
                    logger.info('Export started');
                    hideLoading();
                }
            })
            .catch((error) => {
                logger.error('Failed to start export', { error: error.message });
                isExporting = false;
                updateUIAsync([
                    () => updateUIForStopped(),
                    () => showError('Failed to start export')
                ]);
            });
    }, 300);

    startButton.addEventListener('click', debouncedStartExport);
    scheduleCleanup(() => startButton.removeEventListener('click', debouncedStartExport));

    const debouncedStopExport = debounce(function () {
        if (!isExporting) return;

        isExporting = false;
        updateUIAsync([
            () => updateUIForStopped(),
            () => showLoading('Stopping export...')
        ]);

        // Send message to background script to stop export
        sendMessageReliably({ action: 'stopExport' }, { target: 'background' })
            .then((response) => {
                if (response && response.success) {
                    logger.info('Export stopped');
                    hideLoading();
                }
            })
            .catch((error) => {
                logger.error('Failed to stop export', { error: error.message });
                showError('Failed to stop export');
            });
    }, 300);

    stopButton.addEventListener('click', debouncedStopExport);
    scheduleCleanup(() => stopButton.removeEventListener('click', debouncedStopExport));

    function updateUIForExporting() {
        statusText.textContent = 'Exporting data...';
        startButton.disabled = true;
        stopButton.disabled = false;
        progressContainer.style.display = 'block';
    }

    function updateUIForStopped() {
        if (isOnMaps) {
            statusText.textContent = 'Export stopped';
            startButton.disabled = !isAuthenticated;
        } else {
            statusText.textContent = 'Navigate to Google Maps to export';
            startButton.disabled = true;
        }
        stopButton.disabled = true;
        progressContainer.style.display = 'none';
    }

    // Throttled progress update function
    const throttledProgressUpdate = throttle(function (progress) {
        updateUIAsync([
            () => { progressFill.style.width = progress + '%'; },
            () => { progressText.textContent = `Exporting... ${progress}%`; }
        ]);
    }, 100);

    // Listen for progress updates from background script
    const messageListener = createReliableMessageListener(function (message, sender, sendResponse) {
        if (message.action === 'progressUpdate') {
            const progress = message.progress;
            throttledProgressUpdate(progress);
        } else if (message.action === 'exportComplete') {
            logger.info('Export completed successfully');
            isExporting = false;
            updateUIAsync([
                () => {
                    statusText.textContent = 'Export complete!';
                    // Only enable start button if on Google Maps and authenticated
                    startButton.disabled = !isOnMaps || !isAuthenticated;
                    stopButton.disabled = true;
                    progressContainer.style.display = 'none';
                    hideLoading();
                    clearError();
                }
            ]);
            // Refresh credits after successful export
            if (isAuthenticated) {
                fetchCredits();
            }
        } else if (message.action === 'exportError') {
            logger.error('Export failed', { error: message.error });
            isExporting = false;
            updateUIAsync([
                () => {
                    statusText.textContent = 'Export failed: ' + message.error;
                    // Only enable start button if on Google Maps and authenticated
                    startButton.disabled = !isOnMaps || !isAuthenticated;
                    stopButton.disabled = true;
                    progressContainer.style.display = 'none';
                    hideLoading();
                    showError(message.error);
                }
            ]);
        }
    });

    chrome.runtime.onMessage.addListener(messageListener);
    scheduleCleanup(() => chrome.runtime.onMessage.removeListener(messageListener));
});