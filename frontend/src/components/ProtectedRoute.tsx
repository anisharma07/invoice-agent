/**
 * ProtectedRoute Component
 * 
 * Wraps routes that require authentication.
 * Redirects unauthenticated users to the auth page.
 */

import React from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { IonSpinner, IonContent, IonPage } from '@ionic/react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    // Show loading spinner while checking authentication status
    if (isLoading) {
        return (
            <IonPage>
                <IonContent className="ion-padding ion-text-center">
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%'
                    }}>
                        <IonSpinner name="crescent" />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // Redirect to auth page if not authenticated
    if (!isAuthenticated) {
        return <Redirect to="/auth" />;
    }

    // Render protected content
    return <>{children}</>;
};

export default ProtectedRoute;
