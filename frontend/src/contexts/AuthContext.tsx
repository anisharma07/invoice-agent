/**
 * Authentication Context for React
 * 
 * Provides authentication state and methods throughout the app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
    AuthUser,
    AuthTokens,
    isAuthenticated as checkIsAuthenticated,
    getStoredUser,
    storeUser,
    storeTokens,
    clearTokens,
    verifyTokenWithBackend,
    exchangeCodeForTokens,
    redirectToLogin,
    redirectToSignup,
    logout as authLogout,
    logoutLocal,
    parseJwtClaims,
} from '../services/authService';

interface AuthContextType {
    user: AuthUser | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    login: (provider?: 'Google') => void;
    signup: () => void;
    logout: () => void;
    handleCallback: (code: string) => Promise<boolean>;
    clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check authentication status on mount
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true);
            try {
                if (checkIsAuthenticated()) {
                    // 1. Parse fresh user data from ID token (Primary source)
                    const idToken = localStorage.getItem('auth_id_token');
                    if (idToken) {
                        const claims = parseJwtClaims(idToken);
                        if (claims) {
                            const freshUser: AuthUser = {
                                sub: claims.sub,
                                email: claims.email || '',
                                name: claims.name || claims.given_name || '',
                                username: claims['cognito:username'] || claims.preferred_username,
                                email_verified: claims.email_verified,
                            };
                            storeUser(freshUser);
                            setUser(freshUser);
                        }
                    } else {
                        // 2. Fallback to stored user if no ID token
                        const storedUser = getStoredUser();
                        if (storedUser) {
                            setUser(storedUser);
                        }
                    }

                    // 3. Try to verify with backend (Optional)
                    // If backend returns data, merge it CAUTIOUSLY.
                    // Do NOT overwrite valid token data with nulls from backend if backend is misconfigured.
                    try {
                        const verifiedUser = await verifyTokenWithBackend();
                        if (verifiedUser) {
                            setUser(prevUser => {
                                if (!prevUser) return verifiedUser;
                                return {
                                    ...verifiedUser,
                                    // Keep local email/name if backend returns null/empty
                                    email: verifiedUser.email || prevUser.email,
                                    name: verifiedUser.name || prevUser.name,
                                    // Logical OR: if either says it's verified, treat as verified
                                    email_verified: verifiedUser.email_verified || prevUser.email_verified
                                };
                            });
                        }
                    } catch (backendErr) {
                        console.warn('Backend verification failed on init:', backendErr);
                    }
                }
            } catch (err) {
                console.error('Auth initialization error:', err);
                clearTokens();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = useCallback((provider?: 'Google') => {
        redirectToLogin(provider);
    }, []);

    const signup = useCallback(() => {
        redirectToSignup();
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        authLogout();
    }, []);

    const handleCallback = useCallback(async (code: string): Promise<boolean> => {
        setIsLoading(true);
        setError(null);

        try {
            // Exchange code for tokens
            const tokens = await exchangeCodeForTokens(code);
            storeTokens(tokens);

            // Parse user info from ID token
            const claims = parseJwtClaims(tokens.id_token);

            if (claims) {
                const authUser: AuthUser = {
                    sub: claims.sub,
                    email: claims.email || claims['cognito:username'] || '',
                    name: claims.name || claims.given_name || claims['cognito:username'] || '',
                    username: claims['cognito:username'] || claims.preferred_username,
                    email_verified: claims.email_verified,
                };
                storeUser(authUser);
                setUser(authUser);
            }

            // Verify with backend
            try {
                const verifiedUser = await verifyTokenWithBackend();
                if (verifiedUser) {
                    // Safe merge here too
                    setUser(prevUser => {
                        if (!prevUser) return verifiedUser;
                        return {
                            ...verifiedUser,
                            email: verifiedUser.email || prevUser.email,
                            name: verifiedUser.name || prevUser.name,
                            email_verified: verifiedUser.email_verified || prevUser.email_verified
                        };
                    });
                }
            } catch (backendErr) {
                console.warn('Backend verification failed, using token data:', backendErr);
                // Continue with token data - user is still authenticated via Cognito
            }

            return true;
        } catch (err) {
            console.error('Authentication callback error:', err);
            setError(err instanceof Error ? err.message : 'Authentication failed');
            clearTokens();
            return false;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        signup,
        logout,
        handleCallback,
        clearError,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
