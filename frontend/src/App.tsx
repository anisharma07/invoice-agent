import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Redirect } from "react-router-dom";
import InvoicePage from "./pages/InvoicePage";
import InvoicesPage from "./pages/InvoicesPage";
import SettingsPage from "./pages/SettingsPage";
import LandingPage from "./pages/LandingPage";
import PricingPage from "./pages/PricingPage";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import InvoiceAIPage from "./pages/InvoiceAIPage";
import TemplatesPage from "./pages/TemplatesPage";
import DashboardLayout from "./components/DashboardLayout";
import DashboardHome from "./pages/DashboardHome";
import JobsPage from "./pages/JobsPage";
import ProtectedRoute from "./components/ProtectedRoute";

import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import { InvoiceProvider } from "./contexts/InvoiceContext";
import { AuthProvider } from "./contexts/AuthContext";
import PWAUpdatePrompt from "./components/PWAUpdatePrompt";
import OfflineIndicator from "./components/OfflineIndicator";
import AuthCallback from "./pages/AuthCallback";
import { usePWA } from "./hooks/usePWA";
/* Core CSS required for Ionic components to work properly */
import "@ionic/react/css/core.css";

/* Basic CSS for apps built with Ionic */
import "@ionic/react/css/normalize.css";
import "@ionic/react/css/structure.css";
import "@ionic/react/css/typography.css";

/* Optional CSS utils that can be commented out */
import "@ionic/react/css/padding.css";
import "@ionic/react/css/float-elements.css";
import "@ionic/react/css/text-alignment.css";
import "@ionic/react/css/text-transformation.css";
import "@ionic/react/css/flex-utils.css";
import "@ionic/react/css/display.css";

/* Theme variables */
import "./theme/variables.css";
import "./App.css";

setupIonicReact();

const AppContent: React.FC = () => {
  const { } = useTheme();
  const { isOnline } = usePWA();

  return (
    <IonApp className="light-theme">
      <InvoiceProvider>
        <IonReactRouter>
          <IonRouterOutlet>
            <Route exact path="/">
              <LandingPage />
            </Route>
            <Route exact path="/pricing">
              <PricingPage />
            </Route>
            <Route exact path="/auth">
              <AuthPage />
            </Route>
            <Route exact path="/auth/callback">
              <AuthCallback />
            </Route>
            <Route path="/app">
              <ProtectedRoute>
                {!isOnline && <OfflineIndicator />}
                <IonRouterOutlet>
                  {/* Dashboard Routes */}
                  <Route path="/app/dashboard" render={() => (
                    <DashboardLayout>
                      <IonRouterOutlet>
                        <Route exact path="/app/dashboard/home" component={DashboardHome} />
                        <Route exact path="/app/dashboard/invoices" component={InvoicesPage} />
                        <Route exact path="/app/dashboard/templates" component={TemplatesPage} />

                        <Route exact path="/app/dashboard/jobs" component={JobsPage} />
                        <Route exact path="/app/dashboard/settings" component={SettingsPage} />
                        <Route exact path="/app/dashboard/account" component={AccountPage} />
                        <Route exact path="/app/dashboard">
                          <Redirect to="/app/dashboard/home" />
                        </Route>
                      </IonRouterOutlet>
                    </DashboardLayout>
                  )} />

                  <Route exact path="/app/editor/:fileName">
                    <InvoicePage />
                  </Route>
                  <Route exact path="/app/editor">
                    <InvoicePage />
                  </Route>

                  {/* Legacy Redirects */}
                  <Route exact path="/app/files">
                    <Redirect to="/app/dashboard/invoices" />
                  </Route>
                  <Route exact path="/app/settings">
                    <Redirect to="/app/dashboard/settings" />
                  </Route>

                  <Route exact path="/app/invoice-ai/:templateId">
                    <InvoiceAIPage />
                  </Route>
                  <Route exact path="/app/invoice-ai">
                    <InvoiceAIPage />
                  </Route>
                  <Route exact path="/app/invoice-store">
                    <Redirect to="/app/dashboard/templates" />
                  </Route>
                  <Route exact path="/app">
                    <Redirect to="/app/dashboard/home" />
                  </Route>
                </IonRouterOutlet>
              </ProtectedRoute>
            </Route>
          </IonRouterOutlet>
        </IonReactRouter>
        <PWAUpdatePrompt />
      </InvoiceProvider>
    </IonApp>
  );
};

const App: React.FC = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </ThemeProvider>
);

export default App;
