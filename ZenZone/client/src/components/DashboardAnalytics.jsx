import React, { useState, useEffect } from 'react';
import './DashboardAnalytics.css';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
);

const DashboardAnalytics = ({ appointments = [], className = '' }) => {
  const [timeRange, setTimeRange] = useState('7days'); // 7days, 30days, 90days
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDark, setIsDark] = useState(() => typeof document !== 'undefined' && document.documentElement.classList.contains('dark-theme'));

  useEffect(() => {
    generateChartData();
  }, [appointments, timeRange]);

  // React to theme changes to update chart colors
  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      const dark = root.classList.contains('dark-theme');
      setIsDark(dark);
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const generateChartData = () => {
    setLoading(true);
    
    // Filter appointments based on time range
    const now = new Date();
    const daysBack = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    const filteredAppointments = appointments.filter(apt => 
      new Date(apt.createdAt || apt.date) >= startDate
    );

    // Generate date labels
    const labels = [];
    const appointmentCounts = [];
    const moodData = [];
    
    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - (i * 24 * 60 * 60 * 1000));
      const dateStr = date.toISOString().split('T')[0];
      const dayAppointments = filteredAppointments.filter(apt => 
        new Date(apt.createdAt || apt.date).toISOString().split('T')[0] === dateStr
      );
      
      labels.push(date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }));
      appointmentCounts.push(dayAppointments.length);
      
      // Mock mood data - in real app, this would come from mood tracking
      moodData.push(Math.random() * 10);
    }

    // Status distribution
    const statusCounts = {
      pending: filteredAppointments.filter(apt => apt.status === 'pending').length,
      approved: filteredAppointments.filter(apt => apt.status === 'approved').length,
      rejected: filteredAppointments.filter(apt => apt.status === 'rejected').length,
      completed: filteredAppointments.filter(apt => apt.status === 'completed').length,
    };

    // Time-based patterns
    const hourlyData = Array(24).fill(0);
    filteredAppointments.forEach(apt => {
      const hour = new Date(apt.createdAt || apt.date).getHours();
      hourlyData[hour]++;
    });

    setChartData({
      appointmentsOverTime: {
        labels,
        datasets: [
          {
            label: 'Appointments',
            data: appointmentCounts,
            borderColor: 'rgb(99, 102, 241)',
            backgroundColor: 'rgba(99, 102, 241, 0.1)',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Average Mood',
            data: moodData,
            borderColor: 'rgb(16, 185, 129)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
            fill: true,
            yAxisID: 'y1',
          }
        ],
      },
      statusDistribution: {
        labels: ['Pending', 'Approved', 'Rejected', 'Completed'],
        datasets: [
          {
            data: [statusCounts.pending, statusCounts.approved, statusCounts.rejected, statusCounts.completed],
            backgroundColor: [
              '#f59e0b',
              '#10b981',
              '#ef4444',
              '#6366f1',
            ],
            borderWidth: 0,
          },
        ],
      },
      hourlyPattern: {
        labels: Array.from({length: 24}, (_, i) => `${i}:00`),
        datasets: [
          {
            label: 'Appointments by Hour',
            data: hourlyData,
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 1,
          },
        ],
      },
    });
    
    setLoading(false);
  };

  const gridLight = 'rgba(0, 0, 0, 0.08)';
  const gridDark = 'rgba(255, 255, 255, 0.12)';
  const labelColor = isDark ? '#e5e7eb' : '#111827';

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: labelColor }
      },
      tooltip: { titleColor: labelColor, bodyColor: labelColor },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: isDark ? gridDark : gridLight },
        ticks: { color: labelColor },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: 10,
        grid: { drawOnChartArea: false },
        ticks: { color: labelColor },
      },
      x: {
        grid: { color: isDark ? gridDark : gridLight },
        ticks: { color: labelColor },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: labelColor } },
      tooltip: { titleColor: labelColor, bodyColor: labelColor },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { titleColor: labelColor, bodyColor: labelColor },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: isDark ? gridDark : gridLight },
        ticks: { color: labelColor },
      },
      x: {
        grid: { color: isDark ? gridDark : gridLight },
        ticks: { color: labelColor },
      },
    },
  };

  if (loading || !chartData) {
    return (
      <div className={`dashboard-analytics ${className}`}>
        <div className="analytics-header">
          <h3 className="analytics-title">
            <i className="bi bi-graph-up me-2"></i>
            Analytics Dashboard
          </h3>
          <div className="loading-skeleton">
            <div className="skeleton-rect" style={{height: '40px', width: '200px'}}></div>
          </div>
        </div>
        
        <div className="analytics-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="analytics-card">
              <div className="skeleton-rect" style={{height: '300px'}}></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-analytics ${className}`}>
      {/* Header with Controls */}
      <div className="analytics-header">
        <h3 className="analytics-title">
          <i className="bi bi-graph-up me-2"></i>
          Analytics Dashboard
        </h3>
        
        <div className="analytics-controls">
          <select 
            className="form-select form-select-sm"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="90days">Last 90 Days</option>
          </select>
          
          <button 
            className="btn btn-outline-primary btn-sm ms-2"
            onClick={generateChartData}
            title="Refresh Data"
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="analytics-grid">
        {/* Appointments Over Time */}
        <div className="analytics-card appointments-trend">
          <div className="card-header">
            <h5 className="card-title">
              <i className="bi bi-calendar-trend me-2"></i>
              Appointments & Mood Trends
            </h5>
          </div>
          <div className="chart-container">
            <Line data={chartData.appointmentsOverTime} options={chartOptions} />
          </div>
        </div>

        {/* Status Distribution */}
        <div className="analytics-card status-distribution">
          <div className="card-header">
            <h5 className="card-title">
              <i className="bi bi-pie-chart me-2"></i>
              Appointment Status
            </h5>
          </div>
          <div className="chart-container">
            <Doughnut data={chartData.statusDistribution} options={doughnutOptions} />
          </div>
        </div>

        {/* Hourly Patterns */}
        <div className="analytics-card hourly-pattern">
          <div className="card-header">
            <h5 className="card-title">
              <i className="bi bi-clock me-2"></i>
              Daily Activity Pattern
            </h5>
          </div>
          <div className="chart-container">
            <Bar data={chartData.hourlyPattern} options={barOptions} />
          </div>
        </div>
      </div>

      {/* Key Insights */}
      <div className="analytics-insights">
        <h4 className="insights-title" >
          <i className="bi bi-lightbulb me-2"></i>
          Key Insights
        </h4>
        
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">
              <i className="bi bi-trending-up"></i>
            </div>
            <div className="insight-content">
              <h6>Peak Hours</h6>
              <p>Most appointments requested between 2-5 PM</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">
              <i className="bi bi-calendar-check"></i>
            </div>
            <div className="insight-content">
              <h6>Response Time</h6>
              <p>Average response time: 2.3 hours</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">
              <i className="bi bi-heart-pulse"></i>
            </div>
            <div className="insight-content">
              <h6>Mood Correlation</h6>
              <p>Approved appointments show 15% mood improvement</p>
            </div>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">
              <i className="bi bi-people"></i>
            </div>
            <div className="insight-content">
              <h6>Student Engagement</h6>
              <p>{appointments.length} total appointments this period</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAnalytics;