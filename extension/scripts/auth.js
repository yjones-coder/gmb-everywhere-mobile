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
            console.error('[Auth] Failed to get session token:', error);
            return null;
        }
    }

    // Set session token in storage
    async setSessionToken(token) {
        try {
            await chrome.storage.local.set({ [SESSION_TOKEN_KEY]: token });
            console.log('[Auth] Session token stored');
        } catch (error) {
            console.error('[Auth] Failed to set session token:', error);
            throw error;
        }
    }

    // Remove session token from storage
    async removeSessionToken() {
        try {
            await chrome.storage.local.remove([SESSION_TOKEN_KEY]);
            console.log('[Auth] Session token removed');
        } catch (error) {
            console.error('[Auth] Failed to remove session token:', error);
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
            console.error('[Auth] Failed to get user info:', error);
            return null;
        }
    }

    // Set user info in storage
    async setUserInfo(user) {
        try {
            await chrome.storage.local.set({ [USER_INFO_KEY]: JSON.stringify(user) });
            console.log('[Auth] User info stored');
        } catch (error) {
            console.error('[Auth] Failed to set user info:', error);
            throw error;
        }
    }

    // Clear user info from storage
    async clearUserInfo() {
        try {
            await chrome.storage.local.remove([USER_INFO_KEY]);
            console.log('[Auth] User info cleared');
        } catch (error) {
            console.error('[Auth] Failed to clear user info:', error);
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
            console.error('[Auth] getMe failed:', error);
            return null;
        }
    }

    // Logout
    async logout() {
        try {
            await this.removeSessionToken();
            await this.clearUserInfo();
            console.log('[Auth] Logged out');
        } catch (error) {
            console.error('[Auth] Logout failed:', error);
        }
    }

    // Generate OAuth login URL
    getLoginUrl() {
        // Use same logic as web app
        const clientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID'; // TODO: Configure for extension
        const redirectUri = `${this.apiBaseUrl}/api/oauth/callback`;
        const scope = 'https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
        const state = btoa(redirectUri); // Simple encoding

        const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        url.searchParams.set('client_id', clientId);
        url.searchParams.set('redirect_uri', redirectUri);
        url.searchParams.set('scope', scope);
        url.searchParams.set('response_type', 'code');
        url.searchParams.set('state', state);
        url.searchParams.set('access_type', 'offline');

        return url.toString();
    }

    // Initiate login
    async login() {
        const loginUrl = this.getLoginUrl();
        console.log('[Auth] Opening OAuth URL:', loginUrl);

        // Open in new tab
        chrome.tabs.create({ url: loginUrl });
    }

    // Handle OAuth callback data from content script
    async handleOAuthCallback(data) {
        console.log('[Auth] Handling OAuth callback:', data);

        if (data.sessionToken) {
            await this.setSessionToken(data.sessionToken);
        }

        if (data.user) {
            try {
                const userJson = atob(data.user);
                const userData = JSON.parse(userJson);
                const userInfo = {
                    id: userData.id,
                    openId: userData.openId,
                    name: userData.name,
                    email: userData.email,
                    loginMethod: userData.loginMethod,
                    lastSignedIn: new Date(userData.lastSignedIn || Date.now())
                };
                await this.setUserInfo(userInfo);
            } catch (error) {
                console.error('[Auth] Failed to parse user data:', error);
            }
        }
    }

    // Handle user info update from content script
    async handleUserInfoUpdate(user) {
        console.log('[Auth] Handling user info update:', user);
        await this.setUserInfo(user);
    }
}

// Export singleton instance
const auth = new Auth();