import React from 'react';
// StatsCards component
import { IonCard, IonCardContent, IonGrid, IonRow, IonCol, IonIcon, IonText } from '@ionic/react';
import { cashOutline, documentTextOutline, timeOutline, trendingUpOutline, cartOutline } from 'ionicons/icons';
import { InvoiceAnalytics } from '../../utils/invoiceAnalytics';

interface StatsCardsProps {
  analytics: InvoiceAnalytics | null;
}

const StatsCards: React.FC<StatsCardsProps> = ({ analytics }) => {
  // Default values if no analytics
  const totalRevenue = analytics ? analytics.totalRevenue : 0;
  const totalInvoices = analytics ? analytics.totalInvoices : 0;
  const avgValue = analytics ? analytics.averageInvoiceValue : 0;
  
  const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const stats = [
    { 
        title: 'Total Revenue', 
        value: formatCurrency(totalRevenue), 
        icon: cashOutline, 
        color: '#2dd36f', 
        trend: 'Lifetime' 
    },
    { 
        title: 'Invoices', 
        value: totalInvoices.toString(), 
        icon: documentTextOutline, 
        color: '#3880ff', 
        trend: 'Total generated' 
    },
    { 
        title: 'Avg. Value', 
        value: formatCurrency(avgValue), 
        icon: trendingUpOutline, 
        color: '#ffc409', 
        trend: 'Per invoice' 
    },
    { 
        title: 'Top Item', 
        value: analytics?.topItems?.[0]?.name || '-', 
        icon: cartOutline, 
        color: '#eb445a', 
        trend: analytics?.topItems?.[0] ? `${analytics.topItems[0].count} sold` : '-' 
    },
  ];

  return (
    <IonGrid className="ion-no-padding">
      <IonRow>
        {stats.map((stat, index) => (
          <IonCol size="6" sizeMd="3" key={index}>
            <IonCard className="settings-card-light" style={{ margin: '5px', height: '100%' }}>
              <IonCardContent>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <IonText color="medium" style={{ fontSize: '0.9rem' }}>{stat.title}</IonText>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '5px 0', wordBreak: 'break-word' }}>{stat.value}</h2>
                  </div>
                  <div style={{ 
                    backgroundColor: `${stat.color}20`, 
                    padding: '8px', 
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '36px'
                  }}>
                    <IonIcon icon={stat.icon} style={{ color: stat.color, fontSize: '1.2rem' }} />
                  </div>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <IonText color="medium" style={{ fontSize: '0.8rem', fontWeight: '500' }}>
                    {stat.trend}
                  </IonText>
                </div>
              </IonCardContent>
            </IonCard>
          </IonCol>
        ))}
      </IonRow>
    </IonGrid>
  );
};

export default StatsCards;
