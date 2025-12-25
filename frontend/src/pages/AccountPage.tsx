import React from 'react';
import {
    IonContent,
    IonPage,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardTitle,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonButton,
    IonSpinner,
} from '@ionic/react';
import {
    personCircleOutline,
    mailOutline,
    shieldCheckmarkOutline,
    logOutOutline,
} from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import './SettingsPage.css';

const AccountPage: React.FC = () => {
    const { isDarkMode } = useTheme();
    const { user, isAuthenticated, isLoading, logout } = useAuth();
    const history = useHistory();

    // Debug: log the user data 
    console.log('AccountPage user data:', user);

    if (isLoading) {
        return (
            <IonPage className={isDarkMode ? 'dark-theme' : ''}>
                <IonContent fullscreen className="ion-padding">
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <IonSpinner name="crescent" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <IonPage className={isDarkMode ? 'dark-theme' : ''}>
                <IonContent fullscreen className="ion-padding">
                    <IonCard>
                        <IonCardHeader>
                            <IonCardTitle>
                                <IonIcon icon={personCircleOutline} style={{ marginRight: '8px' }} />
                                Account
                            </IonCardTitle>
                        </IonCardHeader>
                        <IonCardContent>
                            <p style={{ marginBottom: '16px' }}>
                                Sign in to view your account details and sync your data across devices.
                            </p>
                            <IonButton expand="block" onClick={() => history.push('/auth')}>
                                Sign In
                            </IonButton>
                        </IonCardContent>
                    </IonCard>
                </IonContent>
            </IonPage>
        );
    }

    return (
        <IonPage className={isDarkMode ? 'dark-theme' : ''}>
            <IonContent fullscreen className="ion-padding">
                {/* Profile Card */}
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>
                            <IonIcon icon={personCircleOutline} style={{ marginRight: '8px' }} />
                            Profile
                        </IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <IonList>
                            {user.name && (
                                <IonItem>
                                    <IonIcon icon={personCircleOutline} slot="start" />
                                    <IonLabel>
                                        <h3>Name</h3>
                                        <p>{user.name}</p>
                                    </IonLabel>
                                </IonItem>
                            )}
                            <IonItem>
                                <IonIcon icon={mailOutline} slot="start" />
                                <IonLabel>
                                    <h3>Email</h3>
                                    <p>{user.email}</p>
                                </IonLabel>
                            </IonItem>
                            <IonItem>
                                <IonIcon icon={shieldCheckmarkOutline} slot="start" />
                                <IonLabel>
                                    <h3>Email Verified</h3>
                                    <p>{user.email_verified ? 'Yes' : 'No'}</p>
                                </IonLabel>
                            </IonItem>
                        </IonList>
                    </IonCardContent>
                </IonCard>

                {/* Account ID Card */}
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>Account Details</IonCardTitle>
                    </IonCardHeader>
                    <IonCardContent>
                        <IonList>
                            <IonItem>
                                <IonLabel>
                                    <h3>Account ID</h3>
                                    <p style={{ fontSize: '0.85em', fontFamily: 'monospace' }}>{user.sub}</p>
                                </IonLabel>
                            </IonItem>
                            {user.username && (
                                <IonItem>
                                    <IonLabel>
                                        <h3>Username</h3>
                                        <p>{user.username}</p>
                                    </IonLabel>
                                </IonItem>
                            )}
                        </IonList>
                    </IonCardContent>
                </IonCard>

                {/* Sign Out Card */}
                <IonCard>
                    <IonCardContent>


                        <IonButton
                            expand="block"
                            color="danger"
                            fill="outline"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to sign out?')) {
                                    logout();
                                }
                            }}
                        >
                            <IonIcon icon={logOutOutline} slot="start" />
                            Sign Out
                        </IonButton>
                    </IonCardContent>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};

export default AccountPage;
