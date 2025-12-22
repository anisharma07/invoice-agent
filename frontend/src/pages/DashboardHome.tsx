import React, { useState, useEffect } from 'react';
import {
    IonContent,
    IonPage,
    IonIcon,
    IonButton,
    IonSpinner,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonText
} from '@ionic/react';
import {
    layers,
    chevronForward,
    bulbOutline
} from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';
import { useInvoice } from '../contexts/InvoiceContext';
import { useHistory } from 'react-router-dom';
import { tempMeta } from '../templates-meta';
import DashboardStats from '../components/Dashboard/DashboardStats';
import RevenueChart from '../components/Dashboard/RevenueChart';
import TopItemsChart from '../components/Dashboard/TopItemsChart';
import CustomersChart from '../components/Dashboard/CustomersChart';
import GSTChart from '../components/Dashboard/GSTChart';
import { parseInvoiceData, InvoiceAnalytics } from '../utils/invoiceAnalytics';

const DashboardHome: React.FC = () => {
    const { isDarkMode } = useTheme();
    const { store, updateSelectedFile } = useInvoice();
    const history = useHistory();

    const [isSmallScreen, setIsSmallScreen] = useState(false);
    const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
    const [analytics, setAnalytics] = useState<InvoiceAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    // Check screen size
    useEffect(() => {
        const checkScreenSize = () => {
            setIsSmallScreen(window.innerWidth < 692);
        };

        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [recent, allFiles] = await Promise.all([
                store._getRecentInvoices(5),
                store._getUserInvoices()
            ]);
            setRecentInvoices(recent);

            let data = parseInvoiceData(allFiles);

            // If no data, use dummy data for visualization
            if (data.totalInvoices === 0) {
                data = {
                    totalRevenue: 45250.00,
                    totalInvoices: 12,
                    averageInvoiceValue: 3770.83,
                    revenueByMonth: {
                        'Jan': 5000,
                        'Feb': 7500,
                        'Mar': 4200,
                        'Apr': 8900,
                        'May': 6500,
                        'Jun': 9800,
                        'Jul': 3350
                    },
                    topItems: [
                        { name: 'Web Development', count: 8, revenue: 15000 },
                        { name: 'UI Design', count: 5, revenue: 8500 },
                        { name: 'SEO Optimization', count: 4, revenue: 4200 },
                        { name: 'Consulting', count: 3, revenue: 3000 },
                        { name: 'Hosting', count: 10, revenue: 2000 }
                    ],
                    recentActivity: [],
                    gstByMonth: {
                        'Jan': 900,
                        'Feb': 1350,
                        'Mar': 756,
                        'Apr': 1602,
                        'May': 1170,
                        'Jun': 1764,
                        'Jul': 603
                    },
                    customers: [
                        { name: 'Acme Corp', email: 'contact@acme.com', phone: '', totalSpent: 12000, invoiceCount: 3, lastPurchase: '2023-07-15' },
                        { name: 'Globex', email: 'info@globex.com', phone: '', totalSpent: 8500, invoiceCount: 2, lastPurchase: '2023-06-20' },
                        { name: 'Soylent Corp', email: 'sales@soylent.com', phone: '', totalSpent: 5000, invoiceCount: 1, lastPurchase: '2023-05-10' },
                        { name: 'Initech', email: 'bill@initech.com', phone: '', totalSpent: 4500, invoiceCount: 2, lastPurchase: '2023-07-01' },
                        { name: 'Umbrella Corp', email: 'wesker@umbrella.com', phone: '', totalSpent: 3000, invoiceCount: 1, lastPurchase: '2023-04-05' }
                    ]
                };
            }

            setAnalytics(data);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getTemplateMetadata = (templateId: number) => {
        return tempMeta.find((meta) => meta.template_id === templateId);
    };

    if (loading) {
        return (
            <IonPage className={isDarkMode ? 'dark-theme' : ''}>
                <IonContent fullscreen className="ion-padding">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <IonSpinner />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage className={isDarkMode ? 'dark-theme' : ''}>
            <IonContent fullscreen className="ion-padding">
                <div className="dashboard-home-container">
                    {/* Welcome Section */}
                    <div className="welcome-section" style={{ marginBottom: '24px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Dashboard</h1>
                        <p style={{ color: '#666', margin: 0 }}>Overview of your business performance.</p>
                    </div>

                    {/* Stats Section */}
                    <div style={{ marginBottom: '24px' }}>
                        <DashboardStats analytics={analytics} />
                    </div>

                    {/* Charts Section */}
                    <IonGrid className="ion-no-padding" style={{ marginBottom: '24px' }}>
                        <IonRow>
                            <IonCol size="12" sizeMd="8">
                                <RevenueChart data={analytics?.revenueByMonth || {}} />
                            </IonCol>
                            <IonCol size="12" sizeMd="4">
                                <TopItemsChart items={analytics?.topItems || []} />
                            </IonCol>
                        </IonRow>
                        <IonRow>
                            <IonCol size="12" sizeMd="6">
                                <CustomersChart customers={analytics?.customers || []} />
                            </IonCol>
                            <IonCol size="12" sizeMd="6">
                                <GSTChart data={analytics?.gstByMonth || {}} />
                            </IonCol>
                        </IonRow>
                    </IonGrid>

                    {/* Insights Section */}
                    <div style={{ marginBottom: '24px' }}>
                        <IonCard className="settings-card-light">
                            <IonCardHeader>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <IonIcon icon={bulbOutline} style={{ color: '#ffc409', fontSize: '24px' }} />
                                    <IonCardTitle>Business Insights</IonCardTitle>
                                </div>
                            </IonCardHeader>
                            <IonCardContent>
                                <IonGrid>
                                    <IonRow>
                                        <IonCol size="12" sizeMd="6">
                                            <div style={{ padding: '10px' }}>
                                                <h3 style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>Sales Performance</h3>
                                                <p style={{ color: 'var(--ion-color-medium)' }}>
                                                    You have generated <strong>{analytics?.totalInvoices || 0}</strong> invoices with a total revenue of <strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(analytics?.totalRevenue || 0)}</strong>.
                                                    {analytics?.averageInvoiceValue ? ` Your average invoice value is ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(analytics.averageInvoiceValue)}.` : ''}
                                                </p>
                                            </div>
                                        </IonCol>
                                        <IonCol size="12" sizeMd="6">
                                            <div style={{ padding: '10px' }}>
                                                <h3 style={{ fontWeight: 'bold', margin: '0 0 5px 0' }}>Top Products</h3>
                                                <p style={{ color: 'var(--ion-color-medium)' }}>
                                                    {analytics?.topItems && analytics.topItems.length > 0 ? (
                                                        <>
                                                            Your best selling item is <strong>{analytics.topItems[0].name}</strong> with {analytics.topItems[0].count} units sold.
                                                        </>
                                                    ) : (
                                                        "No product data available yet."
                                                    )}
                                                </p>
                                            </div>
                                        </IonCol>
                                    </IonRow>
                                </IonGrid>
                            </IonCardContent>
                        </IonCard>
                    </div>

                    {/* Recent Invoices */}
                    {recentInvoices.length > 0 && (
                        <div style={{ padding: "0 5px", marginTop: "8px" }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h3 style={{
                                    margin: "0",
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    color: isDarkMode ? "var(--ion-color-step-750)" : "var(--ion-color-step-650)",
                                }}>
                                    Recently Opened
                                </h3>
                                <IonButton fill="clear" size="small" routerLink="/app/dashboard/files">
                                    View All
                                </IonButton>
                            </div>

                            <div style={{
                                display: "grid",
                                gridTemplateColumns: isSmallScreen ? "1fr" : "repeat(auto-fill, minmax(280px, 1fr))",
                                gap: "12px",
                            }}>
                                {recentInvoices.map((invoice) => {
                                    const templateData = getTemplateMetadata(invoice.templateId);
                                    return (
                                        <div
                                            key={invoice.fileName}
                                            onClick={() => {
                                                updateSelectedFile(invoice.fileName);
                                                history.push(`/app/editor/${invoice.fileName}`);
                                            }}
                                            style={{
                                                border: `1px solid ${isDarkMode ? "var(--ion-color-step-200)" : "var(--ion-color-step-150)"}`,
                                                borderRadius: "8px",
                                                padding: "12px",
                                                cursor: "pointer",
                                                backgroundColor: isDarkMode ? "var(--ion-color-step-50)" : "var(--ion-background-color)",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "12px",
                                                transition: "all 0.2s ease",
                                            }}
                                        >
                                            <div style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "6px",
                                                backgroundColor: isDarkMode ? "var(--ion-color-step-100)" : "var(--ion-color-step-50)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                flexShrink: 0,
                                            }}>
                                                <IonIcon icon={layers} style={{ fontSize: "24px", color: isDarkMode ? "var(--ion-color-step-400)" : "var(--ion-color-step-500)" }} />
                                            </div>
                                            <div style={{ flex: 1, overflow: "hidden" }}>
                                                <h4 style={{
                                                    margin: "0 0 4px 0",
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    color: isDarkMode ? "var(--ion-color-step-800)" : "var(--ion-color-step-700)",
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}>
                                                    {invoice.fileName}
                                                </h4>
                                                <p style={{
                                                    margin: "0",
                                                    fontSize: "12px",
                                                    color: isDarkMode ? "var(--ion-color-step-500)" : "var(--ion-color-step-450)",
                                                }}>
                                                    {templateData?.name || "Unknown Template"}
                                                </p>
                                            </div>
                                            <IonIcon icon={chevronForward} style={{ fontSize: "16px", color: isDarkMode ? "var(--ion-color-step-400)" : "var(--ion-color-step-350)" }} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </IonContent>
        </IonPage>
    );
};

export default DashboardHome;
