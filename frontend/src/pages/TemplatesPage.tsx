import React from 'react';
import { IonContent, IonPage, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/react';
import { documentTextOutline } from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';

const TemplatesPage: React.FC = () => {
    const { isDarkMode } = useTheme();

    return (
        <IonPage className={isDarkMode ? 'dark-theme' : ''}>
            <IonContent fullscreen className="ion-padding">
                <IonGrid>
                    <IonRow>
                        <IonCol size="12">
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <IonIcon icon={documentTextOutline} style={{ fontSize: '48px', marginBottom: '10px' }} />
                                <h2>My Templates</h2>
                                <p>Manage your saved templates here.</p>
                            </div>
                        </IonCol>
                    </IonRow>
                    <IonRow>
                        <IonCol size="12" sizeMd="6" sizeLg="4">
                            <IonCard>
                                <IonCardHeader>
                                    <IonCardTitle>Standard Invoice</IonCardTitle>
                                </IonCardHeader>
                                <IonCardContent>
                                    Default template for general use.
                                </IonCardContent>
                            </IonCard>
                        </IonCol>
                        {/* Add more placeholder templates as needed */}
                    </IonRow>
                </IonGrid>
            </IonContent>
        </IonPage>
    );
};

export default TemplatesPage;
