import { AXIOS_TIMEOUT_MS, COOKIE_NAME, ONE_YEAR_MS } from "../../shared/const.js";
import { ForbiddenError } from "../../shared/_core/errors.js";
import axios, { type AxiosInstance } from "axios";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";

// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
};

// Google OAuth token response
interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

// Google user info response
interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

// Internal user info format
export interface UserInfo {
  openId: string;
  email: string;
  name: string;
  loginMethod: string;
  platform: string;
}

class GoogleOAuthService {
  private clientId: string;
  private clientSecret: string;
  private tokenEndpoint = "https://oauth2.googleapis.com/token";
  private userInfoEndpoint = "https://www.googleapis.com/oauth2/v2/userinfo";

  constructor(private client: AxiosInstance) {
    this.clientId = ENV.googleClientId;
    this.clientSecret = ENV.googleClientSecret;

    console.log("[GoogleOAuth] Initialized with clientId:", this.clientId ? "✓" : "✗");
    if (!this.clientId || !this.clientSecret) {
      console.error(
        "[GoogleOAuth] ERROR: Google OAuth credentials not configured! Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.",
      );
    }
  }

  private decodeState(state: string): string {
    try {
      return atob(state);
    } catch (error) {
      console.error("[GoogleOAuth] Failed to decode state:", error);
      return state;
    }
  }

  async exchangeCodeForToken(code: string, state: string): Promise<GoogleTokenResponse> {
    const redirectUri = this.decodeState(state);

    const params = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    });

    try {
      const { data } = await this.client.post<GoogleTokenResponse>(
        this.tokenEndpoint,
        params.toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      console.log("[GoogleOAuth] Token exchange successful");
      return data;
    } catch (error: any) {
      console.error("[GoogleOAuth] Token exchange failed:", error.response?.data || error.message);
      throw new Error("Failed to exchange code for token");
    }
  }

  async getUserInfo(accessToken: string): Promise<UserInfo> {
    try {
      const { data } = await this.client.get<GoogleUserInfo>(this.userInfoEndpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      console.log("[GoogleOAuth] User info retrieved:", data.email);

      // Convert Google user info to internal format
      return {
        openId: data.id,
        email: data.email,
        name: data.name,
        loginMethod: "google",
        platform: "google",
      };
    } catch (error: any) {
      console.error("[GoogleOAuth] Failed to get user info:", error.response?.data || error.message);
      throw new Error("Failed to get user info");
    }
  }
}

const createOAuthHttpClient = (): AxiosInstance =>
  axios.create({
    timeout: AXIOS_TIMEOUT_MS,
  });

class SDKServer {
  private readonly client: AxiosInstance;
  private readonly googleOAuthService: GoogleOAuthService;

  constructor(client: AxiosInstance = createOAuthHttpClient()) {
    this.client = client;
    this.googleOAuthService = new GoogleOAuthService(this.client);
  }

  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(code: string, state: string): Promise<GoogleTokenResponse> {
    return this.googleOAuthService.exchangeCodeForToken(code, state);
  }

  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.access_token);
   */
  async getUserInfo(accessToken: string): Promise<UserInfo> {
    return this.googleOAuthService.getUserInfo(accessToken);
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {},
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options,
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {},
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null,
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      console.warn("[Auth] Missing session cookie");
      return null;
    }

    try {
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (!isNonEmptyString(openId) || !isNonEmptyString(appId) || !isNonEmptyString(name)) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }

      return {
        openId,
        appId,
        name,
      };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  async authenticateRequest(req: Request): Promise<User> {
    // Regular authentication flow
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let token: string | undefined;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      token = authHeader.slice("Bearer ".length).trim();
    }

    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = token || cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    let user = await db.getUserByOpenId(sessionUserId);

    // If user not in DB, we can't auto-sync from Google without storing refresh tokens
    // User must go through OAuth flow again
    if (!user) {
      console.error("[Auth] User not found in database:", sessionUserId);
      throw ForbiddenError("User not found - please sign in again");
    }

    // Update last signed in timestamp
    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export const sdk = new SDKServer();
