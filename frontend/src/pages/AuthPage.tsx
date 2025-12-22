import React, { useState } from 'react';
import {
    IonPage,
    IonContent,
    IonButton,
    IonInput,
    IonItem,
    IonLabel,
    IonText,
    IonIcon,
    IonSpinner
} from '@ionic/react';
import { logoGoogle, logoApple, mailOutline, lockClosedOutline, personOutline, arrowForward, arrowBack } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { markUserAsExisting } from '../utils/helper';
import './AuthPage.css';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const history = useHistory();
    const { isDarkMode } = useTheme();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            markUserAsExisting();
            history.replace('/app/dashboard/home');
        }, 1500);
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setEmail('');
        setPassword('');
        setName('');
    };

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
                                <h2 className="auth-page-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                                <p className="auth-page-subtitle">
                                    {isLogin
                                        ? 'Enter your email to access your dashboard'
                                        : 'Get started with your free account today'}
                                </p>
                            </div>

                            <form onSubmit={handleAuth}>
                                <AnimatePresence mode='wait'>
                                    {!isLogin && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <IonItem className="custom-input" lines="none">
                                                <IonLabel position="stacked">Full Name</IonLabel>
                                                <IonInput
                                                    value={name}
                                                    placeholder="John Doe"
                                                    onIonChange={e => setName(e.detail.value!)}
                                                    required={!isLogin}
                                                />
                                                <IonIcon slot="start" icon={personOutline} size="small" style={{ marginTop: '28px', marginRight: '8px' }} />
                                            </IonItem>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <IonItem className="custom-input" lines="none">
                                    <IonLabel position="stacked">Email Address</IonLabel>
                                    <IonInput
                                        type="email"
                                        value={email}
                                        placeholder="name@example.com"
                                        onIonChange={e => setEmail(e.detail.value!)}
                                        required
                                    />
                                    <IonIcon slot="start" icon={mailOutline} size="small" style={{ marginTop: '28px', marginRight: '8px' }} />
                                </IonItem>

                                <IonItem className="custom-input" lines="none">
                                    <IonLabel position="stacked">Password</IonLabel>
                                    <IonInput
                                        type="password"
                                        value={password}
                                        placeholder="••••••••"
                                        onIonChange={e => setPassword(e.detail.value!)}
                                        required
                                    />
                                    <IonIcon slot="start" icon={lockClosedOutline} size="small" style={{ marginTop: '28px', marginRight: '8px' }} />
                                </IonItem>

                                <IonButton
                                    expand="block"
                                    type="submit"
                                    className="submit-btn"
                                    color="primary"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <IonSpinner name="crescent" /> : (isLogin ? 'Sign In' : 'Create Account')}
                                    {!isLoading && <IonIcon slot="end" icon={arrowForward} />}
                                </IonButton>
                            </form>

                            <div className="auth-divider">Or continue with</div>

                            <div className="social-login-buttons">
                                <IonButton fill="outline" className="social-btn">
                                    <IonIcon icon={logoGoogle} slot="start" />
                                    Google
                                </IonButton>
                                <IonButton fill="outline" className="social-btn">
                                    <IonIcon icon={logoApple} slot="start" />
                                    Apple
                                </IonButton>
                            </div>

                            <div className="toggle-text">
                                <IonText color="medium">
                                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                                    <span
                                        style={{ color: 'var(--ion-color-primary)', cursor: 'pointer', fontWeight: '600' }}
                                        onClick={toggleMode}
                                    >
                                        {isLogin ? 'Sign Up' : 'Sign In'}
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
