import { SESSION_TOKEN_KEY, USER_INFO_KEY } from "@/constants/oauth";

/**
 * User type for Google OAuth authentication (web platform)
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
    console.log("[Auth] Web platform uses cookie-based auth, skipping token retrieval");
    return null;
}

export async function setSessionToken(token: string): Promise<void> {
    console.log("[Auth] Web platform uses cookie-based auth, skipping token storage");
    return;
}

export async function removeSessionToken(): Promise<void> {
    console.log("[Auth] Web platform uses cookie-based auth, skipping token removal");
    return;
}

export async function getUserInfo(): Promise<User | null> {
    try {
        console.log("[Auth] Getting user info...");

        // Use localStorage for web
        const info = window.localStorage.getItem(USER_INFO_KEY);

        if (!info) {
            console.log("[Auth] No user info found");
            return null;
        }
        const user = JSON.parse(info);
        console.log("[Auth] User info retrieved:", user);
        return user;
    } catch (error) {
        console.error("[Auth] Failed to get user info:", error);
        return null;
    }
}

export async function setUserInfo(user: User): Promise<void> {
    try {
        console.log("[Auth] Setting user info...", user);

        // Use localStorage for web
        window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
        console.log("[Auth] User info stored in localStorage successfully");
    } catch (error) {
        console.error("[Auth] Failed to set user info:", error);
    }
}

export async function clearUserInfo(): Promise<void> {
    try {
        // Use localStorage for web
        window.localStorage.removeItem(USER_INFO_KEY);
    } catch (error) {
        console.error("[Auth] Failed to clear user info:", error);
    }
}
