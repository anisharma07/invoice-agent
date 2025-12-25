import React, { useState, useEffect } from 'react';
import {
    IonPage,
    IonContent,
    IonButton,
    IonText,
    IonIcon,
    IonSpinner
} from '@ionic/react';
import { logoGoogle, logoApple, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { markUserAsExisting } from '../utils/helper';
import './AuthPage.css';

const AuthPage: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);
    const history = useHistory();
    const { isDarkMode } = useTheme();
    const { isAuthenticated, login, signup, isLoading: authLoading } = useAuth();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            markUserAsExisting();
            history.replace('/app/dashboard/home');
        }
    }, [isAuthenticated, history]);

    const handleGoogleLogin = () => {
        setIsLoading(true);
        login('Google');
    };

    const handleEmailLogin = () => {
        setIsLoading(true);
        login(); // This will redirect to Cognito Hosted UI with email/password
    };

    const handleSignup = () => {
        setIsLoading(true);
        signup(); // This will redirect to Cognito Hosted UI signup
    };

    if (authLoading) {
        return (
            <IonPage className={`auth-page ${isDarkMode ? 'dark' : ''}`}>
                <IonContent fullscreen className="auth-content">
                    <div className="auth-loading-container">
                        <IonSpinner name="crescent" />
                        <p>Loading...</p>
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage className={`auth-page ${isDarkMode ? 'dark' : ''}`}>
            <IonContent fullscreen className="auth-content">
                <div className="auth-wrapper">
                    {/* Left Side - Hero Section (Desktop) */}
                    <div className="auth-hero-section">
                        <div className="hero-shape shape-1"></div>
                        <div className="hero-shape shape-2"></div>

                        <motion.div
                            className="auth-hero-content"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="auth-hero-title">
                                Manage Invoices <br />
                                <span style={{ opacity: 0.8 }}>Like a Pro.</span>
                            </h1>
                            <p className="auth-hero-subtitle">
                                Join thousands of freelancers and small businesses who trust Invoice Calc for their billing needs.
                            </p>
                        </motion.div>
                    </div>

                    {/* Right Side - Form Section */}
                    <div className="auth-form-section">
                        <IonButton
                            fill="clear"
                            className="back-home-btn"
                            onClick={() => history.push('/')}
                        >
                            <IonIcon icon={arrowBack} slot="start" />
                            Back to Home
                        </IonButton>

                        <motion.div
                            className="auth-form-container"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <div className="auth-header">
                                <img src="/favicon.png" alt="Logo" className="auth-logo" />
                                <h2 className="auth-page-title">Welcome</h2>
                                <p className="auth-page-subtitle">
                                    Sign in to access your invoices and manage your business
                                </p>
                            </div>

                            {/* Social Login Buttons */}
                            <div className="social-login-buttons-stacked">
                                <IonButton
                                    expand="block"
                                    fill="outline"
                                    className="social-btn google-btn"
                                    onClick={handleGoogleLogin}
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <IonSpinner name="crescent" />
                                    ) : (
                                        <>
                                            <IonIcon icon={logoGoogle} slot="start" />
                                            Continue with Google
                                        </>
                                    )}
                                </IonButton>

                                <IonButton
                                    expand="block"
                                    fill="outline"
                                    className="social-btn apple-btn"
                                    disabled={true}
                                >
                                    <IonIcon icon={logoApple} slot="start" />
                                    Continue with Apple
                                    <span className="coming-soon-badge">Coming Soon</span>
                                </IonButton>
                            </div>

                            <div className="auth-divider">Or</div>

                            {/* Email Login Button */}
                            <IonButton
                                expand="block"
                                className="submit-btn"
                                color="primary"
                                onClick={handleEmailLogin}
                                disabled={isLoading}
                            >
                                {isLoading ? <IonSpinner name="crescent" /> : 'Sign in with Email'}
                            </IonButton>

                            <div className="toggle-text">
                                <IonText color="medium">
                                    Don't have an account?{' '}
                                    <span
                                        style={{ color: 'var(--ion-color-primary)', cursor: 'pointer', fontWeight: '600' }}
                                        onClick={handleSignup}
                                    >
                                        Sign Up
                                    </span>
                                </IonText>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default AuthPage;
