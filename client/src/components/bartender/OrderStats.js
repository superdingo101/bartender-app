import React from 'react';
import './OrderStats.css';

const OrderStats = ({ orders }) => {
  const pending = orders.filter((o) => o.status === 'PENDING').length;
  const inProgress = orders.filter((o) => o.status === 'IN_PROGRESS').length;
  const completed = orders.filter((o) => o.status === 'COMPLETED').length;
  const cancelled = orders.filter((o) => o.status === 'CANCELLED').length;

  const totalRevenue = orders
    .filter((o) => o.status !== 'CANCELLED')
    .reduce((sum, o) => sum + o.totalPrice, 0);

  const stats = [
    { label: 'Pending', value: pending, color: '#ff9800', icon: '⏳' },
    { label: 'In Progress', value: inProgress, color: '#2196F3', icon: '🔄' },
    { label: 'Completed', value: completed, color: '#4CAF50', icon: '✅' },
    { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, color: '#9C27B0', icon: '💰' },
  ];

  return (
    <div className="order-stats">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card" style={{ borderColor: stat.color }}>
          <div className="stat-icon">{stat.icon}</div>
          <div className="stat-content">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OrderStats;