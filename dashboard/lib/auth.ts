/**
 * User type for Google OAuth authentication (dashboard web platform)
 */
export type User = {
    id: number;
    openId: string;
    name: string | null;
    email: string | null;
    loginMethod: string | null;
    lastSignedIn: Date;
};

export async function getSessionToken(): Promise<string | null> {
    // For dashboard, use cookies
    return null;
}

export async function setSessionToken(token: string): Promise<void> {
    // For dashboard, use cookies
    return;
}

export async function removeSessionToken(): Promise<void> {
    // For dashboard, use cookies
    return;
}

export async function getUserInfo(): Promise<User | null> {
    try {
        // Use localStorage for web
        const info = window.localStorage.getItem("dashboard-user-info");
        if (!info) {
            return null;
        }
        const user = JSON.parse(info);
        return user;
    } catch (error) {
        console.error("[Auth] Failed to get user info:", error);
        return null;
    }
}

export async function setUserInfo(user: User): Promise<void> {
    try {
        // Use localStorage for web
        window.localStorage.setItem("dashboard-user-info", JSON.stringify(user));
    } catch (error) {
        console.error("[Auth] Failed to set user info:", error);
    }
}

export async function clearUserInfo(): Promise<void> {
    try {
        // Use localStorage for web
        window.localStorage.removeItem("dashboard-user-info");
    } catch (error) {
        console.error("[Auth] Failed to clear user info:", error);
    }
}

export function getLoginUrl(): string {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
    const redirectUri = `${apiBaseUrl}/api/oauth/callback?redirect=${encodeURIComponent(window.location.origin + "/dashboard")}`;

    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "");
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", "https://www.googleapis.com/auth/business.manage https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("state", btoa(redirectUri));
    url.searchParams.set("access_type", "offline");

    return url.toString();
}