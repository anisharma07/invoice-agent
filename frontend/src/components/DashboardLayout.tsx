import React, { useState } from 'react';
import { IonIcon, IonButtons, IonButton } from '@ionic/react';
import { menuOutline, personCircleOutline, sunny, moon, add } from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import { useTheme } from '../contexts/ThemeContext';
import './DashboardLayout.css';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isDarkMode, toggleDarkMode } = useTheme();
    const history = useHistory();
    const location = useLocation();

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/app/dashboard/home')) return 'Home';
        if (path.includes('/app/dashboard/files')) return 'Files';
        if (path.includes('/app/dashboard/templates')) return 'Templates';
        if (path.includes('/app/dashboard/store')) return 'Store';
        if (path.includes('/app/dashboard/jobs')) return 'Jobs';
        if (path.includes('/app/dashboard/settings')) return 'Settings';
        return 'Dashboard';
    };

    return (
        <div className={`dashboard-container ${isDarkMode ? 'dark-theme' : ''}`}>
            {/* Mobile Overlay */}
            {isSidebarOpen && window.innerWidth < 768 && (
                <div className="dashboard-overlay" onClick={() => setIsSidebarOpen(false)} />
            )}

            <DashboardSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <div className="dashboard-main">
                <header className="dashboard-header">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <IonButton fill="clear" onClick={toggleSidebar} className="ion-hide-md-up">
                            <IonIcon icon={menuOutline} slot="icon-only" />
                        </IonButton>
                        <div style={{ display: 'flex', alignItems: 'center', marginLeft: '12px' }}>
                            <h1 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>{getPageTitle()}</h1>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <IonButton
                            fill="solid"
                            color="primary"
                            onClick={() => { }}
                            style={{ marginRight: '8px' }}
                        >
                            <IonIcon icon={add} slot="start" />
                            Create
                        </IonButton>
                        <IonButton
                            fill="clear"
                            onClick={toggleDarkMode}
                        >
                            <IonIcon icon={isDarkMode ? sunny : moon} />
                        </IonButton>
                        <IonButton fill="clear">
                            <IonIcon icon={personCircleOutline} slot="icon-only" />
                        </IonButton>
                    </div>
                </header>

                <div className="dashboard-content">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;
