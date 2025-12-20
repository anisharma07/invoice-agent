import React, { useEffect } from "react";
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
} from "ionicons/icons";
import { useHistory } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { markUserAsExisting } from "../utils/helper";
import "./LandingPage.css";

const LandingPage: React.FC = () => {
  const { isDarkMode } = useTheme();
  const history = useHistory();

  const handleGetStarted = () => {
    try {
      markUserAsExisting();
      history.replace("/app/files");
    } catch (error) {
      console.error("Error in handleGetStarted:", error);
    }
  };

  return (
    <IonPage className={`landing-page ${isDarkMode ? "dark" : ""}`}>
      <IonHeader className="ion-no-border">
        <IonToolbar className="landing-toolbar">
          <IonTitle className="logo-text">InviSheet</IonTitle>
          <div slot="end" className="desktop-nav ion-hide-sm-down">
            <IonButton fill="clear" color="dark">Solution</IonButton>
            <IonButton fill="clear" color="dark">Pricing</IonButton>
            <IonButton fill="clear" color="dark">About Us</IonButton>
            <IonButton onClick={handleGetStarted} color="primary" shape="round">
              Get Started
            </IonButton>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <IonGrid>
              <IonRow className="ion-align-items-center">
                <IonCol size="12" sizeMd="6" className="hero-text-col">
                  <h1 className="hero-title">
                    AI-rich invoicing, <br />
                    <span className="highlight">powered by spreadsheets</span>
                  </h1>
                  <p className="hero-subtitle">
                    Manage your business globally with InviSheet. Experience automated workflows,
                    AI-driven invoice editing, and the flexibility of spreadsheets in one powerful app.
                  </p>

                  <div className="cta-buttons">
                    <IonButton
                      size="large"
                      expand="block"
                      className="primary-cta"
                      onClick={handleGetStarted}
                    >
                      Download InviSheet Now
                      <IonIcon slot="end" icon={arrowForward} />
                    </IonButton>
                    <IonText color="medium" className="trial-text">
                      <small>Free for small businesses • No credit card required</small>
                    </IonText>
                  </div>

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
                <IonCol size="12" sizeMd="6" className="hero-image-col">
                  {/* Placeholder for Hero Image - could be an SVG or screenshot */}
                  <div className="hero-image-placeholder">
                    <IonIcon icon={documentTextOutline} className="floating-icon main" />
                    <IonIcon icon={flashOutline} className="floating-icon sub-1" />
                    <IonIcon icon={createOutline} className="floating-icon sub-2" />
                  </div>
                </IonCol>
              </IonRow>
            </IonGrid>
          </div>
        </section>

        {/* Key Features Grid */}
        <section className="features-section">
          <IonGrid>
            <IonRow>
              <IonCol size="12" className="section-header">
                <h2>Why Choose InviSheet?</h2>
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
        </section>

        {/* Detailed Feature: AI Editing */}
        <section className="detail-section alt-bg">
          <IonGrid>
            <IonRow className="ion-align-items-center">
              <IonCol size="12" sizeMd="6">
                <div className="detail-content">
                  <IonChip color="primary">New</IonChip>
                  <h2>Invoice Editing with AI</h2>
                  <p>
                    Forget complex menus. With InviSheet, simply tell the AI what to change.
                    "Add a 10% discount", "Change currency to USD", or "Update the due date".
                    It's like having a personal assistant for your billing.
                  </p>
                  <ul className="feature-list">
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Natural Language Processing</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Smart Error Detection</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Instant Formatting Updates</li>
                  </ul>
                  <IonButton fill="outline" onClick={handleGetStarted}>Try AI Editing</IonButton>
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <div className="detail-image-placeholder ai-theme">
                  <IonIcon icon={createOutline} />
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* Detailed Feature: Automated Workflows */}
        <section className="detail-section">
          <IonGrid>
            <IonRow className="ion-align-items-center reverse-col">
              <IonCol size="12" sizeMd="6">
                <div className="detail-image-placeholder workflow-theme">
                  <IonIcon icon={timeOutline} />
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <div className="detail-content">
                  <h2>Automated Workflows</h2>
                  <p>
                    Stop doing repetitive tasks manually. InviSheet automates your billing cycle
                    from generation to follow-up.
                  </p>
                  <ul className="feature-list">
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Recurring Invoices</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Auto-Payment Reminders</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Scheduled Reporting</li>
                  </ul>
                  <IonButton fill="outline" onClick={handleGetStarted}>Automate Now</IonButton>
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* Global Focus Section */}
        <section className="detail-section alt-bg">
          <IonGrid>
            <IonRow className="ion-align-items-center">
              <IonCol size="12" sizeMd="6">
                <div className="detail-content">
                  <h2>Built for Global Business</h2>
                  <p>
                    Whether you are in New York, London, or Tokyo, InviSheet adapts to your needs.
                    Multi-currency support, customizable tax rules, and global invoice templates.
                  </p>
                  <ul className="feature-list">
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Multi-Currency Support</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Global Tax Compliance</li>
                    <li><IonIcon icon={checkmarkCircle} color="success" /> Multi-Language Invoices</li>
                  </ul>
                </div>
              </IonCol>
              <IonCol size="12" sizeMd="6">
                <div className="detail-image-placeholder global-theme">
                  <IonIcon icon={globeOutline} />
                </div>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* FAQ Section */}
        <section className="faq-section">
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
                      <IonLabel>Is InviSheet free to use?</IonLabel>
                    </IonItem>
                    <div className="ion-padding" slot="content">
                      Yes, InviSheet offers a comprehensive free tier for small businesses and freelancers.
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
                      Absolutely. InviSheet syncs across all your devices - mobile, tablet, and desktop,
                      so you can invoice from anywhere.
                    </div>
                  </IonAccordion>
                </IonAccordionGroup>
              </IonCol>
            </IonRow>
          </IonGrid>
        </section>

        {/* Footer */}
        <IonFooter className="landing-footer">
          <IonGrid>
            <IonRow>
              <IonCol size="12" sizeMd="4">
                <h3>InviSheet</h3>
                <p>AI-rich invoicing, powered by spreadsheets.</p>
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
                  <li>Pricing</li>
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
                <p>support@invisheet.com</p>
                <p>1-800-INVISHEET</p>
              </IonCol>
            </IonRow>
            <IonRow>
              <IonCol size="12" className="copyright">
                <p>© 2025 InviSheet. All rights reserved.</p>
              </IonCol>
            </IonRow>
          </IonGrid>
        </IonFooter>
      </IonContent>
    </IonPage>
  );
};

export default LandingPage;
