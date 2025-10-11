import React, { useState } from 'react';
import axios from 'axios';
import './OrderCard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const OrderCard = ({ order, token, updating, onStatusChange }) => {
  const [loading, setLoading] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return '#ff9800';
      case 'IN_PROGRESS': return '#2196F3';
      case 'COMPLETED': return '#4CAF50';
      case 'CANCELLED': return '#f44336';
      default: return '#999';
    }
  };

  const getNextStatus = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING': return 'IN_PROGRESS';
      case 'IN_PROGRESS': return 'COMPLETED';
      default: return null;
    }
  };

  const getNextStatusLabel = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING': return 'Start Making';
      case 'IN_PROGRESS': return 'Mark Complete';
      default: return null;
    }
  };

  const handleStatusUpdate = async () => {
    const nextStatus = getNextStatus(order.status);
    if (!nextStatus) return;

    setLoading(true);
    try {
      await axios.put(
        `${API_URL}/api/orders/${order.id}/status`,
        { status: nextStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error('Failed to update order:', error);
      alert('Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTimeAgo = (dateString) => {
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className={`order-card ${updating ? 'updating' : ''}`}>
      <div className="order-header">
        <div className="order-info">
          <h3 className="order-drink">{order.drink.name}</h3>
          <span className="order-quantity">×{order.quantity}</span>
        </div>
        <div
          className="order-status"
          style={{ backgroundColor: getStatusColor(order.status) }}
        >
          {order.status.replace('_', ' ')}
        </div>
      </div>

      <div className="order-details">
        <div className="detail-row">
          <span className="detail-label">Customer:</span>
          <span className="detail-value">{order.customerName || 'Guest'}</span>
        </div>
        
        {order.notes && (
          <div className="detail-row">
            <span className="detail-label">Notes:</span>
            <span className="detail-value notes">{order.notes}</span>
          </div>
        )}
        
        <div className="detail-row">
          <span className="detail-label">Event:</span>
          <span className="detail-value">{order.event?.name}</span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Ordered:</span>
          <span className="detail-value">
            {formatTime(order.createdAt)} ({getTimeAgo(order.createdAt)})
          </span>
        </div>

        <div className="detail-row">
          <span className="detail-label">Total:</span>
          <span className="detail-value price">${order.totalPrice.toFixed(2)}</span>
        </div>
      </div>

      {getNextStatus(order.status) && (
        <button
          className="action-button"
          onClick={handleStatusUpdate}
          disabled={loading}
        >
          {loading ? 'Updating...' : getNextStatusLabel(order.status)}
        </button>
      )}
    </div>
  );
};

export default OrderCard;