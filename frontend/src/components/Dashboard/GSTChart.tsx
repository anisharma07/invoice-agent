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
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle } from '@ionic/react';
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

interface GSTChartProps {
    data: { [key: string]: number };
}

const GSTChart: React.FC<GSTChartProps> = ({ data }) => {
    const { isDarkMode } = useTheme();

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sortedKeys = Object.keys(data).sort((a, b) => months.indexOf(a) - months.indexOf(b));

    const chartData = {
        labels: sortedKeys.length > 0 ? sortedKeys : months,
        datasets: [
            {
                fill: true,
                label: 'GST Collected',
                data: sortedKeys.length > 0 ? sortedKeys.map(k => data[k]) : [],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.4,
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
                <IonCardTitle>GST Overview</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
                <Line data={chartData} options={options} />
            </IonCardContent>
        </IonCard>
    );
};

export default GSTChart;
