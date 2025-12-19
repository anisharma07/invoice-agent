import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonIcon } from '@ionic/react';
import { construct } from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';

const JobsPage: React.FC = () => {
    const { isDarkMode } = useTheme();

    return (
        <IonPage className={isDarkMode ? 'dark-theme' : ''}>
            <IonContent fullscreen className="ion-padding">
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    textAlign: 'center',
                    color: isDarkMode ? 'var(--ion-color-medium)' : 'var(--ion-color-medium-tint)'
                }}>
                    <IonIcon icon={construct} style={{ fontSize: '64px', marginBottom: '16px' }} />
                    <h2>Jobs Feature Coming Soon</h2>
                    <p>We are working hard to bring you job management capabilities.</p>
                </div>
            </IonContent>
        </IonPage>
    );
};

export default JobsPage;
