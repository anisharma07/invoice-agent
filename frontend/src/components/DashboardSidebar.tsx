import React from 'react';
import { useLocation, useHistory } from 'react-router-dom';
import { IonIcon, IonFooter } from '@ionic/react';
import { homeOutline, folderOutline, briefcaseOutline, settingsOutline, homeSharp, folderSharp, briefcaseSharp, settingsSharp, storefrontOutline, storefrontSharp, documentTextOutline, documentTextSharp } from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';
import './DashboardLayout.css';

interface DashboardSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ isOpen, onClose }) => {
    const location = useLocation();
    const history = useHistory();
    const { isDarkMode } = useTheme();

    const menuItems = [
        {
            title: 'Home',
            path: '/app/dashboard/home',
            icon: homeOutline,
            activeIcon: homeSharp
        },
        {
            title: 'Files',
            path: '/app/dashboard/files',
            icon: folderOutline,
            activeIcon: folderSharp
        },
        {
            title: 'Templates',
            path: '/app/dashboard/templates',
            icon: documentTextOutline,
            activeIcon: documentTextSharp
        },
        {
            title: 'Store',
            path: '/app/dashboard/store',
            icon: storefrontOutline,
            activeIcon: storefrontSharp
        },
        {
            title: 'Jobs',
            path: '/app/dashboard/jobs',
            icon: briefcaseOutline,
            activeIcon: briefcaseSharp
        },
        {
            title: 'Settings',
            path: '/app/dashboard/settings',
            icon: settingsOutline,
            activeIcon: settingsSharp
        }
    ];

    const handleNavigation = (path: string) => {
        history.push(path);
        if (window.innerWidth < 768) {
            onClose();
        }
    };

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <div className={`dashboard-sidebar ${isOpen ? 'open' : ''} ${isDarkMode ? 'dark-theme' : ''}`}>
            <div className="sidebar-header">
                <img src="/favicon.png" alt="Logo" className="sidebar-logo" />
                <span className="sidebar-title">Invoice App</span>
            </div>

            <div className="sidebar-menu">
                {menuItems.map((item) => (
                    <div
                        key={item.path}
                        className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                        onClick={() => handleNavigation(item.path)}
                    >
                        <div className="sidebar-icon">
                            <IonIcon icon={isActive(item.path) ? item.activeIcon : item.icon} />
                        </div>
                        <span className="sidebar-label">{item.title}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DashboardSidebar;
