import React, { useEffect, useRef, useState } from "react";
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
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonAccordion,
  IonAccordionGroup,
  IonItem,
  IonLabel,
  IonFooter,
  IonChip,
} from "@ionic/react";
import {
  flashOutline,
  documentTextOutline,
  createOutline,
  gridOutline,
  star,
  checkmarkCircle,
  arrowForward,
  logoGooglePlaystore,
  desktopOutline,
  phonePortraitOutline,
  globeOutline,
  peopleOutline,
  timeOutline,
  walletOutline,
  closeCircleOutline,
  alertCircleOutline,
} from "ionicons/icons";

import { useTheme } from "../contexts/ThemeContext";
import { markUserAsExisting } from "../utils/helper";
import { motion, useScroll, useTransform } from "framer-motion";
import "./LandingPage.css";

const LandingPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const targetRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);

  return (
    <IonPage className={`landing-page ${isDarkMode ? "dark" : ""}`}>
      <IonHeader className={`ion-no-border ${isScrolled ? 'scrolled' : ''}`}>
        <IonToolbar className="landing-toolbar">
          <div className="logo-container" slot="start">
            <img src="/favicon.png" alt="Invoice Calc Logo" className="header-logo" />
            <IonTitle className="logo-text">Invoice Calc</IonTitle>
          </div>
          <div slot="end" className="desktop-nav ion-hide-sm-down">
            <IonButton fill="clear" color="dark">Solution</IonButton>
            <IonButton fill="clear" color="dark" href="/pricing">Pricing</IonButton>
            <IonButton fill="clear" color="dark">About Us</IonButton>
            <IonButton href="/auth" color="primary" shape="round">
              Get Started
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen scrollEvents={true} onIonScroll={(e) => setIsScrolled(e.detail.scrollTop > 50)}>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <IonGrid>
              <IonRow className="ion-align-items-center ion-justify-content-center text-center">
                <IonCol size="12" sizeMd="10" className="hero-text-col">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                  >
                    <h1 className="hero-title">
                      Invoicing solutions, <br />
                      built on spreadsheets <br />
                      <span className="highlight">powered with AI</span>
                    </h1>
                    <p className="hero-subtitle">
                      The only AI invoice system that thinks in spreadsheets, not PDFs.
                    </p>

                    <div className="cta-buttons">
                      <IonButton
                        size="large"
                        expand="block"
                        className="primary-cta"
                        href="/auth"
                      >
                        Try Now
                        <IonIcon slot="end" icon={arrowForward} />
                      </IonButton>
                      <IonText color="medium" className="trial-text">
                        <small>Sign in to get started for free</small>
                      </IonText>
                    </div>
                  </motion.div>
                </IonCol>
              </IonRow>

              {/* Dashboard Preview with Scroll Effect */}
              <IonRow className="ion-justify-content-center dashboard-preview-row">
                <IonCol size="12" sizeMd="10">
                  <motion.div
                    className="dashboard-preview-container"
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                  >
                    <div className="dashboard-frame">
                      <div className="browser-header">
                        <div className="dots">
                          <span className="dot red"></span>
                          <span className="dot yellow"></span>
                          <span className="dot green"></span>
                        </div>
                        <div className="address-bar">invoicecalc.com/dashboard</div>
                      </div>
                      <img src="/images/dashboard.png" alt="Dashboard Preview" className="dashboard-img-placeholder" />
                    </div>
                  </motion.div>
                </IonCol>
              </IonRow>

              <IonRow className="ion-justify-content-center stats-row">
                <IonCol size="12" sizeMd="8">
                  <div className="hero-stats">
                    <div className="stat-item">
                      <IonIcon icon={peopleOutline} />
                      <div>
                        <strong>100K+</strong>
                        <span>Global Users</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <IonIcon icon={star} color="warning" />
                      <div>
                        <strong>4.8/5</strong>
                        <span>App Rating</span>
                      </div>
                    </div>
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid >
          </div >
        </section >

        {/* Comparison Table Section */}
        <section className="comparison-section" ref={targetRef}>
          <IonGrid>
            <IonRow>
              <IonCol size="12" className="section-header">
                <h2>Why Choose Us</h2>
                <p>See how Invoice Calc stacks up against the competition.</p>
              </IonCol>
            </IonRow>
            <IonRow className="ion-justify-content-center">
              <IonCol size="12" sizeMd="12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="comparison-table-container"
                >
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th className="highlight-col">We Offer (Spreadsheet + AI)</th>
                        <th>Traditional Invoice Apps</th>
                        <th>Google Sheets / Excel</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="highlight-col"><IonIcon icon={checkmarkCircle} color="success" /> Built-in Spreadsheet (cell-level control)</td>
                        <td><IonIcon icon={closeCircleOutline} color="danger" /> No (form-based)</td>
                        <td><IonIcon icon={checkmarkCircle} color="success" /> Yes</td>
                      </tr>
                      <tr>
                        <td className="highlight-col"><IonIcon icon={checkmarkCircle} color="success" /> Native formulas (GST, totals, discounts, FX)</td>
                        <td><IonIcon icon={alertCircleOutline} color="warning" /> Limited</td>
                        <td><IonIcon icon={checkmarkCircle} color="success" /> Yes</td>
                      </tr>
                      <tr>
                        <td className="highlight-col"><IonIcon icon={checkmarkCircle} color="success" /> AI generates editable spreadsheet invoices</td>
                        <td><IonIcon icon={closeCircleOutline} color="danger" /> No</td>
                        <td><IonIcon icon={closeCircleOutline} color="danger" /> No</td>
                      </tr>
                      <tr>
                        <td className="highlight-col"><IonIcon icon={checkmarkCircle} color="success" /> Edit rows, cells, formulas via AI prompts</td>
                        <td><IonIcon icon={closeCircleOutline} color="danger" /> No</td>
                        <td><IonIcon icon={closeCircleOutline} color="danger" /> No</td>
                      </tr>
                      <tr>
                        <td className="highlight-col"><IonIcon icon={checkmarkCircle} color="success" /> Fully customizable at cell & formula level</td>
                        <td><IonIcon icon={alertCircleOutline} color="warning" /> Locked templates</td>
                        <td><IonIcon icon={checkmarkCircle} color="success" /> High</td>
                      </tr>
                      <tr>
                        <td className="highlight-col"><IonIcon icon={checkmarkCircle} color="success" /> Invoice, Proforma, GST, Packing Slip, Sales Order</td>
                        <td><IonIcon icon={alertCircleOutline} color="warning" /> Limited</td>
                        <td><IonIcon icon={alertCircleOutline} color="warning" /> Manual</td>
                      </tr>
                      <tr>
                        <td className="highlight-col"><IonIcon icon={checkmarkCircle} color="success" /> Transparent & auditable formulas</td>
                        <td><IonIcon icon={alertCircleOutline} color="warning" /> Black-box</td>
                        <td><IonIcon icon={alertCircleOutline} color="warning" /> Manual</td>
                      </tr>
                    </tbody>
                  </table>
                </motion.div>
              </IonCol>
            </IonRow>

            <IonRow className="ion-justify-content-center ion-margin-top">
              <IonCol size="12" sizeMd="10" className="ion-text-center">
                <h3 style={{ fontWeight: 600, color: 'var(--ion-color-dark)', marginTop: '2rem', fontSize: '1.5rem' }}>
                  Generate invoices you can compute, edit, audit, and automate
                </h3>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* Key Features Grid */}
        < section className="features-section" >
          <IonGrid>
            <IonRow>
              <IonCol size="12" className="section-header">
                <h2>Why Choose Invoice Calc?</h2>
                <p>The ultimate invoicing solution for the modern global business.</p>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" sizeMd="3">
                <IonCard className="feature-card">
                  <IonCardContent>
                    <div className="icon-box">
                      <IonIcon icon={flashOutline} />
                    </div>
                    <h3>Automated Workflows</h3>
                    <p>Save time with smart automation for recurring invoices and payment reminders.</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="3">
                <IonCard className="feature-card">
                  <IonCardContent>
                    <div className="icon-box">
                      <IonIcon icon={documentTextOutline} />
                    </div>
                    <h3>Instant Generation</h3>
                    <p>Generate professional invoices in seconds using our streamlined templates.</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="3">
                <IonCard className="feature-card">
                  <IonCardContent>
                    <div className="icon-box">
                      <IonIcon icon={createOutline} />
                    </div>
                    <h3>AI Editing</h3>
                    <p>Edit and customize invoices using natural language commands powered by AI.</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
              <IonCol size="12" sizeMd="3">
                <IonCard className="feature-card">
                  <IonCardContent>
                    <div className="icon-box">
                      <IonIcon icon={gridOutline} />
                    </div>
                    <h3>Spreadsheet Power</h3>
                    <p>Enjoy the familiarity and flexibility of spreadsheets with app-like power.</p>
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section >

        {/* Templates Collection Section */}
        <section className="detail-section alt-bg">
          <IonGrid>
            <IonRow className="ion-align-items-center">
              <IonCol size="12" sizeMd="6">
                <div className="detail-content">
                  <IonChip color="warning">Creative</IonChip>
                  <h2>100s of Prebuilt Templates</h2>
                  <p>
                    Start with a professionally designed template and customize it with our Template Editor or AI Assistant.
                    Unleash your creativity and create the perfect invoice for your brand.
                  </p>
                  <ul className="feature-list">
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Professional Designs</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Fully Customizable</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Faster AI Generation</li>
                  </ul>
                  <IonButton fill="outline" href="/auth">Explore Templates</IonButton>
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <div className="detail-image-placeholder" style={{
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #fefce8 0%, #fff7ed 100%)', // Warn/Orange tint
                  perspective: '1000px'
                }}>
                  <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    top: '20px' // Slight offset to center the fan
                  }}>
                    {/* Invoice 1 */}
                    <img
                      src="/invoices/invoice-1.png"
                      alt="Template 1"
                      style={{
                        position: 'absolute',
                        width: '200px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                        transform: 'rotate(-15deg) translateX(-80px) translateY(20px)',
                        zIndex: 1,
                        border: '1px solid rgba(0,0,0,0.05)'
                      }}
                    />
                    {/* Invoice 2 */}
                    <img
                      src="/invoices/invoice-2.png"
                      alt="Template 2"
                      style={{
                        position: 'absolute',
                        width: '200px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                        transform: 'rotate(-7deg) translateX(-40px) translateY(5px)',
                        zIndex: 2,
                        border: '1px solid rgba(0,0,0,0.05)'
                      }}
                    />
                    {/* Invoice 3 */}
                    <img
                      src="/invoices/invoice-3.png"
                      alt="Template 3"
                      style={{
                        position: 'absolute',
                        width: '200px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                        transform: 'rotate(0deg) translateY(-10px)',
                        zIndex: 3,
                        border: '1px solid rgba(0,0,0,0.05)'
                      }}
                    />
                    {/* Invoice 4 */}
                    <img
                      src="/invoices/invoice-4.png"
                      alt="Template 4"
                      style={{
                        position: 'absolute',
                        width: '200px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                        transform: 'rotate(7deg) translateX(40px) translateY(5px)',
                        zIndex: 4,
                        border: '1px solid rgba(0,0,0,0.05)'
                      }}
                    />
                    {/* Invoice 5 */}
                    <img
                      src="/invoices/invoice-5.png"
                      alt="Template 5"
                      style={{
                        position: 'absolute',
                        width: '200px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
                        transform: 'rotate(15deg) translateX(80px) translateY(20px)',
                        zIndex: 5,
                        border: '1px solid rgba(0,0,0,0.05)'
                      }}
                    />
                  </div>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* Detailed Feature: AI Editing */}
        <section className="detail-section">
          <IonGrid>
            <IonRow className="ion-align-items-center reverse-col">
              <IonCol size="12" sizeMd="6">
                <div className="detail-image-placeholder ai-theme" style={{ overflow: 'hidden', padding: 0 }}>
                  <img src="/invoices/invoice-editing.png" alt="AI Invoice Editing" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <div className="detail-content">
                  <IonChip color="primary">New</IonChip>
                  <h2>Invoice Editing with AI</h2>
                  <p>
                    Forget complex menus. With Invoice Calc, simply tell the AI what to change.
                    "Add a 10% discount", "Change currency to USD", or "Update the due date".
                    It's like having a personal assistant for your billing.
                  </p>
                  <ul className="feature-list">
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Natural Language Processing</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Smart Error Detection</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Instant Formatting Updates</li>
                  </ul>
                  <IonButton fill="outline" href="/auth">Try AI Editing</IonButton>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* Detailed Feature: Automated Workflows */}
        <section className="detail-section alt-bg">
          <IonGrid>
            <IonRow className="ion-align-items-center">
              <IonCol size="12" sizeMd="6">
                <div className="detail-content">
                  <h2>Automated Workflows</h2>
                  <p>
                    Stop doing repetitive tasks manually. Invoice Calc automates your billing cycle
                    from generation to follow-up.
                  </p>
                  <ul className="feature-list">
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Recurring Invoices</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Auto-Payment Reminders</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Scheduled Reporting</li>
                  </ul>
                  <IonButton fill="outline" href="/auth">Automate Now</IonButton>
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <div className="detail-image-placeholder workflow-theme">
                  <IonIcon icon={timeOutline} />
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* FAQ Section */}
        < section className="faq-section" >
          <IonGrid>
            <IonRow>
              <IonCol size="12" className="section-header">
                <h2>Frequently Asked Questions</h2>
              </IonCol>
            </IonRow>
            <IonRow className="ion-justify-content-center">
              <IonCol size="12" sizeMd="8">
                <IonAccordionGroup>
                  <IonAccordion value="first">
                    <IonItem slot="header" color="light">
                      <IonLabel>Is Invoice Calc free to use?</IonLabel>
                    </IonItem>
                    <div className="ion-padding" slot="content">
                      Yes, Invoice Calc offers a comprehensive free tier for small businesses and freelancers.
                      Premium features are available for larger teams and advanced automation needs.
                    </div>
                  </IonAccordion>
                  <IonAccordion value="second">
                    <IonItem slot="header" color="light">
                      <IonLabel>How does the AI editing work?</IonLabel>
                    </IonItem>
                    <div className="ion-padding" slot="content">
                      Our AI understands natural language commands. You can simply type or speak what you want to change
                      (e.g., "Add a line item for Consulting, $500"), and the invoice updates instantly.
                    </div>
                  </IonAccordion>
                  <IonAccordion value="third">
                    <IonItem slot="header" color="light">
                      <IonLabel>Can I use it on multiple devices?</IonLabel>
                    </IonItem>
                    <div className="ion-padding" slot="content">
                      Absolutely. Invoice Calc syncs across all your devices - mobile, tablet, and desktop,
                      so you can invoice from anywhere.
                    </div>
                  </IonAccordion>
                </IonAccordionGroup>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section >

        {/* Footer */}
        < IonFooter className="landing-footer" >
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4">
                <h3>Invoice Calc</h3>
                <p>Invoicing solutions, powered by spreadsheets.</p>
                <div className="social-links">
                  <IonIcon icon={logoGooglePlaystore} />
                  <IonIcon icon={desktopOutline} />
                  <IonIcon icon={phonePortraitOutline} />
                </div>
              </IonCol>
              <IonCol size="6" sizeMd="2">
                <h5>Product</h5>
                <ul>
                  <li>Features</li>
                  <li><a href="/pricing" style={{ color: 'inherit', textDecoration: 'none' }}>Pricing</a></li>
                  <li>Templates</li>
                </ul>
              </IonCol>
              <IonCol size="6" sizeMd="2">
                <h5>Company</h5>
                <ul>
                  <li>About Us</li>
                  <li>Careers</li>
                  <li>Contact</li>
                </ul>
              </IonCol>
              <IonCol size="12" sizeMd="4">
                <h5>Contact</h5>
                <p>support@invoicecalc.com</p>
                <p>1-800-INVOICECALC</p>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" className="copyright">
                <p>© 2025 Invoice Calc. All rights reserved.</p>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonFooter >
      </IonContent >
    </IonPage >
  );
};

export default LandingPage;
