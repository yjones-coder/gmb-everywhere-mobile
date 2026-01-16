// Authentication module for Chrome extension
// Handles OAuth login, token storage, and session management

// Import utility functions
const {
    loggers
} = require('./utils.js');

// Get component-specific logger
const logger = loggers.auth;

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
        try {
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
        } catch (error) {
            logger.error('getMe failed', { error: error.message });
            return null;
        }
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


    // Handle user info update from content script
    async handleUserInfoUpdate(user) {
        logger.info('Handling user info update', { user });
        await this.setUserInfo(user);
    }
}

// Export singleton instance
const auth = new Auth();