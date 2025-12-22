import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
import { CustomerStats } from '../../utils/invoiceAnalytics';
import { useTheme } from '../../contexts/ThemeContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface CustomersChartProps {
    customers: CustomerStats[];
}

const CustomersChart: React.FC<CustomersChartProps> = ({ customers }) => {
    const { isDarkMode } = useTheme();

    // Top 5 customers
    const topCustomers = customers.slice(0, 5);

    const data = {
        labels: topCustomers.map(c => c.name || c.email || 'Unknown'),
        datasets: [
            {
                label: 'Total Spent',
                data: topCustomers.map(c => c.totalSpent),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: { color: isDarkMode ? '#fff' : '#666' }
            },
            title: {
                display: false,
            },
        },
        scales: {
            y: {
                ticks: { color: isDarkMode ? '#ccc' : '#666' },
                grid: { color: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }
            },
            x: {
                ticks: { color: isDarkMode ? '#ccc' : '#666' },
                grid: { display: false }
            }
        }
    };

    return (
        <IonCard className={isDarkMode ? 'dark-card' : ''}>
            <IonCardHeader>
                <IonCardTitle>Top Customers</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <Bar data={data} options={options} />
            </IonCardContent>
        </IonCard>
    );
};

export default CustomersChart;
