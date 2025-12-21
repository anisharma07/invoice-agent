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
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/react';
import { useTheme } from '../../contexts/ThemeContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface TopItemsChartProps {
    items: { name: string; count: number; revenue: number }[];
}

const TopItemsChart: React.FC<TopItemsChartProps> = ({ items }) => {
    const { isDarkMode } = useTheme();

    const chartData = {
        labels: items.map(i => i.name),
        datasets: [
            {
                label: 'Revenue',
                data: items.map(i => i.revenue),
                backgroundColor: isDarkMode ? 'rgba(45, 211, 111, 0.8)' : 'rgba(45, 211, 111, 0.7)',
                borderRadius: 4,
            },
        ],
    };

    const options = {
        indexAxis: 'y' as const,
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
        },
        scales: {
            x: {
                beginAtZero: true,
                grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    color: isDarkMode ? '#aaa' : '#666',
                }
            },
            y: {
                grid: {
                    display: false,
                },
                ticks: {
                    color: isDarkMode ? '#aaa' : '#666',
                }
            },
        },
    };

    return (
        <IonCard className={isDarkMode ? 'dark-theme' : ''}>
            <IonCardHeader>
                <IonCardTitle>Top Selling Items</IonCardTitle>
                <IonCardSubtitle>By revenue</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
                <div style={{ height: '250px' }}>
                    <Bar data={chartData} options={options} />
                </div>
            </IonCardContent>
        </IonCard>
    );
};

export default TopItemsChart;
