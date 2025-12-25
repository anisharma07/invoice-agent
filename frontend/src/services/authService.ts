/**
 * Authentication Service for AWS Cognito
 * 
 * Handles Cognito Hosted UI redirects, token management, and API authentication.
 */

// Cognito configuration from environment
const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || `${window.location.origin}/auth/callback`;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Token storage keys
const TOKEN_KEY = 'auth_access_token';
const ID_TOKEN_KEY = 'auth_id_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

export interface AuthUser {
    sub: string;
    email: string;
    name: string;
    username?: string;
    email_verified?: boolean;
}

export interface AuthTokens {
    access_token: string;
    id_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
}

/**
 * Build Cognito Hosted UI login URL
 */
export function getLoginUrl(provider?: 'Google'): string {
    const params = new URLSearchParams({
        client_id: COGNITO_CLIENT_ID,
        response_type: 'code',
        scope: 'openid email profile',
        redirect_uri: REDIRECT_URI,
    });

    if (provider === 'Google') {
        params.set('identity_provider', 'Google');
    }

    return `https://${COGNITO_DOMAIN}/login?${params.toString()}`;
}

/**
 * Build Cognito Hosted UI signup URL
 */
export function getSignupUrl(): string {
    const params = new URLSearchParams({
        client_id: COGNITO_CLIENT_ID,
        response_type: 'code',
        scope: 'openid email profile',
        redirect_uri: REDIRECT_URI,
    });

    return `https://${COGNITO_DOMAIN}/signup?${params.toString()}`;
}

/**
 * Build Cognito logout URL
 */
export function getLogoutUrl(): string {
    const logoutUri = window.location.origin;
    return `https://${COGNITO_DOMAIN}/logout?client_id=${COGNITO_CLIENT_ID}&logout_uri=${encodeURIComponent(logoutUri)}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code: string): Promise<AuthTokens> {
    const tokenEndpoint = `https://${COGNITO_DOMAIN}/oauth2/token`;

    const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: COGNITO_CLIENT_ID,
        code: code,
        redirect_uri: REDIRECT_URI,
    });

    // Debug logging
    console.log('Token Exchange Debug:', {
        tokenEndpoint,
        client_id: COGNITO_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        code: code.substring(0, 10) + '...',
    });

    const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Token exchange error response:', error);
        throw new Error(`Token exchange failed: ${error}`);
    }

    const tokens = await response.json();
    return tokens;
}

/**
 * Store tokens in localStorage
 */
export function storeTokens(tokens: AuthTokens): void {
    localStorage.setItem(TOKEN_KEY, tokens.access_token);
    localStorage.setItem(ID_TOKEN_KEY, tokens.id_token);
    if (tokens.refresh_token) {
        localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
    }
}

/**
 * Get stored access token
 */
export function getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
}

/**
 * Get stored ID token
 */
export function getIdToken(): string | null {
    return localStorage.getItem(ID_TOKEN_KEY);
}

/**
 * Clear all stored tokens
 */
export function clearTokens(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ID_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}

/**
 * Store user data
 */
export function storeUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Get stored user data
 */
export function getStoredUser(): AuthUser | null {
    const userData = localStorage.getItem(USER_KEY);
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Check if user is authenticated (has valid token)
 */
export function isAuthenticated(): boolean {
    return !!getAccessToken();
}

/**
 * Verify token with backend and get user info
 */
export async function verifyTokenWithBackend(): Promise<AuthUser | null> {
    const token = getAccessToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/api/auth/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            clearTokens();
            return null;
        }

        const data = await response.json();
        if (data.success && data.user) {
            storeUser(data.user);
            return data.user;
        }

        return null;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

/**
 * Get current user from backend
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
    const token = getAccessToken();
    if (!token) return null;

    try {
        const response = await fetch(`${API_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            if (response.status === 401) {
                clearTokens();
            }
            return null;
        }

        const data = await response.json();
        if (data.success && data.user) {
            storeUser(data.user);
            return data.user;
        }

        return null;
    } catch (error) {
        console.error('Failed to get current user:', error);
        return null;
    }
}

/**
 * Parse JWT token to extract claims (without verification)
 */
export function parseJwtClaims(token: string): Record<string, any> | null {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

/**
 * Redirect to Cognito login
 */
export function redirectToLogin(provider?: 'Google'): void {
    window.location.href = getLoginUrl(provider);
}

/**
 * Redirect to Cognito signup
 */
export function redirectToSignup(): void {
    window.location.href = getSignupUrl();
}

/**
 * Logout user - clear tokens and redirect to Cognito logout
 */
export function logout(): void {
    clearTokens();
    window.location.href = getLogoutUrl();
}

/**
 * Logout locally without Cognito redirect (for soft logout)
 */
export function logoutLocal(): void {
    clearTokens();
}

/**
 * Make authenticated API request
 */
export async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = getAccessToken();

    const headers = {
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };

    return fetch(url, {
        ...options,
        headers,
    });
}
