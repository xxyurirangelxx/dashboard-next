'use client';

import { useRef } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    ChartDataLabels
);

ChartJS.defaults.color = '#64748b';
ChartJS.defaults.borderColor = '#e2e8f0';
ChartJS.defaults.font.family = "'Inter', sans-serif";
ChartJS.defaults.plugins.tooltip.backgroundColor = '#0f172a';
ChartJS.defaults.plugins.tooltip.titleFont = { size: 14 };
ChartJS.defaults.plugins.tooltip.bodyFont = { size: 12 };
ChartJS.defaults.plugins.datalabels.display = false;

export default function DashboardChart({ type, data, options, className = '' }) {
    const chartRef = useRef(null);

    return (
        <div className={`relative h-96 ${className}`}>
            <Chart
                ref={chartRef}
                type={type}
                data={data}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    ...options,
                }}
            />
        </div>
    );
}
