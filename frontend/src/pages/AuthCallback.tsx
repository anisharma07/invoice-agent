/**
 * Auth Callback Page
 * 
 * Handles the OAuth callback from Cognito Hosted UI,
 * exchanges the authorization code for tokens.
 */

import React, { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { IonPage, IonContent, IonSpinner, IonText } from '@ionic/react';
import { useAuth } from '../contexts/AuthContext';
import './AuthPage.css';

const AuthCallback: React.FC = () => {
    const history = useHistory();
    const location = useLocation();
    const { handleCallback, error } = useAuth();
    const [processing, setProcessing] = useState(true);
    const [localError, setLocalError] = useState<string | null>(null);

    // Prevent double processing in React Strict Mode
    const hasProcessed = React.useRef(false);

    useEffect(() => {
        const processCallback = async () => {
            // Prevent double execution (React Strict Mode calls effects twice)
            if (hasProcessed.current) {
                return;
            }
            hasProcessed.current = true;

            // Get authorization code from URL
            const params = new URLSearchParams(location.search);
            const code = params.get('code');
            const errorParam = params.get('error');
            const errorDescription = params.get('error_description');

            if (errorParam) {
                setLocalError(errorDescription || errorParam);
                setProcessing(false);
                return;
            }

            if (!code) {
                setLocalError('No authorization code received');
                setProcessing(false);
                return;
            }

            try {
                const success = await handleCallback(code);
                if (success) {
                    // Redirect to dashboard using window.location for reliable navigation
                    window.location.href = '/app/dashboard/home';
                } else {
                    setLocalError('Authentication failed. Please try again.');
                }
            } catch (err) {
                setLocalError(err instanceof Error ? err.message : 'Authentication failed');
            } finally {
                setProcessing(false);
            }
        };

        processCallback();
    }, [location.search, handleCallback, history]);

    const displayError = localError || error;

    return (
        <IonPage className="auth-page">
            <IonContent fullscreen className="auth-content">
                <div className="auth-callback-container">
                    {processing ? (
                        <div className="auth-callback-loading">
                            <IonSpinner name="crescent" />
                            <IonText>
                                <h2>Signing you in...</h2>
                                <p>Please wait while we complete your authentication.</p>
                            </IonText>
                        </div>
                    ) : displayError ? (
                        <div className="auth-callback-error">
                            <IonText color="danger">
                                <h2>Authentication Error</h2>
                                <p>{displayError}</p>
                            </IonText>
                            <button
                                className="auth-retry-btn"
                                onClick={() => history.replace('/auth')}
                            >
                                Try Again
                            </button>
                        </div>
                    ) : null}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AuthCallback;
