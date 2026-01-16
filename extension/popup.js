// Popup script for GMB Excel Export extension

document.addEventListener('DOMContentLoaded', function () {
    const startButton = document.getElementById('start-export');
    const stopButton = document.getElementById('stop-export');
    const statusText = document.getElementById('status-text');
    const progressContainer = document.getElementById('progress-container');
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');

    // Auth elements
    const authText = document.getElementById('auth-text');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    let isExporting = false;
    let isAuthenticated = false;

    // Check authentication status
    checkAuthStatus();

    // Check if we're on Google Maps
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        const currentTab = tabs[0];
        const isOnMaps = currentTab.url && currentTab.url.includes('google.com/maps');

        if (!isOnMaps) {
            statusText.textContent = 'Please navigate to Google Maps first';
            startButton.disabled = true;
            return;
        }

        // Check if export is already running
        chrome.runtime.sendMessage({ action: 'getStatus' }, function (response) {
            if (response && response.isExporting) {
                isExporting = true;
                updateUIForExporting();
            }
        });
    });

    // Auth button handlers
    loginBtn.addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'login' }, function (response) {
            if (response && response.success) {
                console.log('Login initiated');
            }
        });
    });

    logoutBtn.addEventListener('click', function () {
        chrome.runtime.sendMessage({ action: 'logout' }, function (response) {
            if (response && response.success) {
                updateAuthUI(false);
            }
        });
    });

    function checkAuthStatus() {
        chrome.runtime.sendMessage({ action: 'checkAuth' }, function (response) {
            if (response && response.isAuthenticated) {
                isAuthenticated = true;
                updateAuthUI(true, response.user);
            } else {
                isAuthenticated = false;
                updateAuthUI(false);
            }
        });
    }

    function updateAuthUI(authenticated, user = null) {
        if (authenticated && user) {
            authText.textContent = `Logged in as ${user.name || user.email}`;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            startButton.disabled = false;
        } else {
            authText.textContent = 'Not logged in';
            loginBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            startButton.disabled = true;
        }
    }

    startButton.addEventListener('click', function () {
        if (isExporting) return;

        isExporting = true;
        updateUIForExporting();

        // Send message to background script to start export
        chrome.runtime.sendMessage({ action: 'startExport' }, function (response) {
            if (response && response.success) {
                console.log('Export started');
            }
        });
    });

    stopButton.addEventListener('click', function () {
        if (!isExporting) return;

        isExporting = false;
        updateUIForStopped();

        // Send message to background script to stop export
        chrome.runtime.sendMessage({ action: 'stopExport' }, function (response) {
            if (response && response.success) {
                console.log('Export stopped');
            }
        });
    });

    function updateUIForExporting() {
        statusText.textContent = 'Exporting data...';
        startButton.disabled = true;
        stopButton.disabled = false;
        progressContainer.style.display = 'block';
    }

    function updateUIForStopped() {
        statusText.textContent = 'Export stopped';
        startButton.disabled = false;
        stopButton.disabled = true;
        progressContainer.style.display = 'none';
    }

    // Listen for progress updates from background script
    chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
        if (message.action === 'progressUpdate') {
            const progress = message.progress;
            progressFill.style.width = progress + '%';
            progressText.textContent = `Exporting... ${progress}%`;
        } else if (message.action === 'exportComplete') {
            isExporting = false;
            statusText.textContent = 'Export complete!';
            startButton.disabled = false;
            stopButton.disabled = true;
            progressContainer.style.display = 'none';
        } else if (message.action === 'exportError') {
            isExporting = false;
            statusText.textContent = 'Export failed: ' + message.error;
            startButton.disabled = false;
            stopButton.disabled = true;
            progressContainer.style.display = 'none';
        }
    });
});