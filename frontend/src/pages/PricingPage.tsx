import React from 'react';
import {
    IonButton,
    IonContent,
    IonPage,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonGrid,
    IonRow,
    IonCol,
    IonIcon,
    IonText,
    IonBadge
} from '@ionic/react';
import {
    checkmarkCircle,
    arrowBack,
    star,
    giftOutline,
    infiniteOutline,
    timeOutline
} from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'framer-motion';
import './PricingPage.css';

const PricingPage: React.FC = () => {
    const { isDarkMode } = useTheme();

    return (
        <IonPage className={`pricing-page ${isDarkMode ? 'dark' : ''}`}>
            <IonHeader className="ion-no-border">
                <IonToolbar className="transparent-toolbar">
                    <IonButton slot="start" fill="clear" color="dark" href="/">
                        <IonIcon icon={arrowBack} /> Back
                    </IonButton>
                    <IonTitle>Plans & Pricing</IonTitle>
                </IonToolbar>
            </IonHeader>

            <IonContent fullscreen className="pricing-content">
                <div className="pricing-header">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="pricing-title">Simple, transparent pricing</h1>
                        <p className="pricing-subtitle">
                            Choose the plan that's right for your business. No hidden fees.
                        </p>
                    </motion.div>
                </div>

                <IonGrid className="pricing-grid">
                    <IonRow className="ion-justify-content-center">
                        <IonCol size="12" sizeMd="10">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="special-offer-banner"
                            >
                                <IonIcon icon={giftOutline} size="large" />
                                <span>Special Launch Offer: First 500 users get the Basic Plan for FREE!</span>
                                <IonBadge color="light" style={{ marginLeft: '1rem' }}>Limited Time</IonBadge>
                            </motion.div>
                        </IonCol>
                    </IonRow>

                    <IonRow className="ion-justify-content-center ion-align-items-stretch">
                        {/* Free Plan */}
                        <IonCol size="12" sizeMd="4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                style={{ height: '100%' }}
                            >
                                <div className="pricing-card">
                                    <div className="plan-name">Starter</div>
                                    <div className="plan-price">
                                        FREE
                                        <span>/forever</span>
                                    </div>
                                    <p className="plan-description">Good for part-time freelancers</p>
                                    <ul className="plan-features">
                                        <li><IonIcon icon={checkmarkCircle} /> Basic Invoice Usage</li>
                                        <li><IonIcon icon={checkmarkCircle} /> 25 Invoices Limit</li>
                                        <li><IonIcon icon={checkmarkCircle} /> 100 AI Coins</li>
                                        <li><IonIcon icon={checkmarkCircle} /> Basic Templates</li>
                                        <li><IonIcon icon={checkmarkCircle} /> Basic Features</li>
                                    </ul>
                                    <IonButton expand="block" fill="outline" href="/auth">
                                        Get Started
                                    </IonButton>
                                </div>
                            </motion.div>
                        </IonCol>

                        {/* Basic Plan */}
                        <IonCol size="12" sizeMd="4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                style={{ height: '100%' }}
                            >
                                <div className="pricing-card featured">
                                    <span className="popular-badge">Most Popular</span>
                                    <div className="plan-name">Basic</div>
                                    <div className="plan-price">
                                        <span className="original-price">₹3000</span>
                                        FREE
                                        <span>/lifetime</span>
                                    </div>
                                    <p className="plan-description">For growing businesses</p>
                                    <ul className="plan-features">
                                        <li><IonIcon icon={giftOutline} color="secondary" /> <strong>Free for First 500 Users</strong></li>
                                        <li><IonIcon icon={checkmarkCircle} /> Higher Invoice Limits</li>
                                        <li><IonIcon icon={checkmarkCircle} /> 1000 AI Coins</li>
                                        <li><IonIcon icon={checkmarkCircle} /> Upcoming Offline Tools</li>
                                        <li><IonIcon icon={checkmarkCircle} /> Priority Support</li>
                                    </ul>
                                    <IonButton expand="block" color="primary" href="/auth">
                                        Claim Free Access
                                    </IonButton>
                                    <p className="coupon-note">* Use coupon code at checkout</p>
                                </div>
                            </motion.div>
                        </IonCol>

                        {/* Premium Plan */}
                        <IonCol size="12" sizeMd="4">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.5 }}
                                style={{ height: '100%' }}
                            >
                                <div className="pricing-card">
                                    <div className="plan-name">Premium</div>
                                    <div className="plan-price">
                                        ₹5000 <span>/lifetime</span>
                                    </div>
                                    <p className="plan-description">For power users & agencies</p>
                                    <ul className="plan-features">
                                        <li><IonIcon icon={star} color="warning" /> <strong>All Features Included</strong></li>
                                        <li><IonIcon icon={infiniteOutline} /> Highest Invoice Limits</li>
                                        <li><IonIcon icon={checkmarkCircle} /> 5000 AI Coins</li>
                                        <li><IonIcon icon={checkmarkCircle} /> All Premium Templates</li>
                                        <li><IonIcon icon={checkmarkCircle} /> AI Invoice Editing</li>
                                    </ul>
                                    <IonButton expand="block" color="dark" href="/auth">
                                        Get Premium
                                    </IonButton>
                                </div>
                            </motion.div>
                        </IonCol>
                    </IonRow>

                    <IonRow>
                        <IonCol size="12">
                            <p className="pricing-footer-text">
                                Secure payment processing. 30-day money-back guarantee for paid plans.
                            </p>
                        </IonCol>
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default PricingPage;
