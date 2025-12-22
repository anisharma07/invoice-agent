import React from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonCard, IonCardContent } from '@ionic/react';
import { useTheme } from '../contexts/ThemeContext';

const AccountPage: React.FC = () => {
    const { isDarkMode } = useTheme();

    return (
        <IonPage className={isDarkMode ? 'dark-theme' : ''}>
            <IonContent fullscreen className="ion-padding">
                <IonCard>
                    <IonCardContent>
                        <h2>My Account</h2>
                        <p>Account settings and profile information will appear here.</p>
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default AccountPage;
