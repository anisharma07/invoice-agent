import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from '@ionic/react';
import { useTheme } from '../../contexts/ThemeContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

interface RevenueChartProps {
    data: { [key: string]: number };
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
    const { isDarkMode } = useTheme();

    // Ensure we have all months or at least the ones with data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    // Filter to only show months with data or current year? 
    // For simplicity, let's show all months if we have data spread out, or just the keys if sparse.
    // Better: Show last 6 months or all available keys sorted.

    // Let's just use the keys provided, assuming they are sorted or we sort them.
    // Actually, the analytics utility returns keys like "Dec".
    // We should probably sort them chronologically.

    const sortedKeys = Object.keys(data).sort((a, b) => {
        return months.indexOf(a) - months.indexOf(b);
    });

    const chartData = {
        labels: sortedKeys.length > 0 ? sortedKeys : months,
        datasets: [
            {
                label: 'Revenue',
                data: sortedKeys.length > 0 ? sortedKeys.map(k => data[k]) : Array(12).fill(0),
                borderColor: isDarkMode ? '#3880ff' : '#3880ff',
                backgroundColor: isDarkMode ? 'rgba(56, 128, 255, 0.2)' : 'rgba(56, 128, 255, 0.1)',
                tension: 0.4,
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                grid: {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                },
                ticks: {
                    color: isDarkMode ? '#aaa' : '#666',
                }
            },
            x: {
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
                <IonCardTitle>Revenue Overview</IonCardTitle>
                <IonCardSubtitle>Monthly revenue performance</IonCardSubtitle>
            </IonCardHeader>
            <IonCardContent>
                <div style={{ height: '250px' }}>
                    <Line data={chartData} options={options} />
                </div>
            </IonCardContent>
        </IonCard>
    );
};

export default RevenueChart;
