import React, { useState } from 'react';
import axios from 'axios';
import './OrderQueue.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const OrderQueue = ({ orders, token, onOrderUpdate, onOrderClick }) => {
  const [updating, setUpdating] = useState({});

  const updateOrderStatus = async (orderId, newStatus) => {
    setUpdating((prev) => ({ ...prev, [orderId]: true }));
    try {
      await axios.put(
        `${API_URL}/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onOrderUpdate();
    } catch (error) {
      console.error('Failed to update order:', error);
      alert('Failed to update order status: ' + (error.response?.data?.error || error.message));
    } finally {
      setUpdating((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  const handleStartOrder = (orderId) => {
    updateOrderStatus(orderId, 'IN_PROGRESS');
  };

  const handleCompleteOrder = (orderId) => {
    updateOrderStatus(orderId, 'COMPLETED');
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) {
      return;
    }
    updateOrderStatus(orderId, 'CANCELLED');
  };

  const handleCardClick = (order) => {
    // Only call the click handler if it exists and order is IN_PROGRESS
    if (onOrderClick && order.status === 'IN_PROGRESS') {
      onOrderClick(order);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <p>No orders to display</p>
      </div>
    );
  }

  return (
    <div className="order-queue">
      {orders.map((order) => (
        <div
          key={order.id}
          className={`order-card ${order.status.toLowerCase()} ${
            order.status === 'IN_PROGRESS' ? 'clickable' : ''
          }`}
          onClick={() => handleCardClick(order)}
        >
          <div className="order-header">
            <div className="order-info">
              <h3 className="drink-name">{order.drink?.name || 'Unknown Drink'}</h3>
              <p className="customer-name">{order.customerName || 'Anonymous'}</p>
            </div>
            <div className="order-quantity">
              <span className="quantity-badge">{order.quantity}x</span>
            </div>
          </div>

          <div className="order-meta">
            <span className="order-time">
              {new Date(order.createdAt).toLocaleTimeString()}
            </span>
            <span className={`order-status status-${order.status.toLowerCase()}`}>
              {order.status.replace('_', ' ')}
            </span>
          </div>

          {order.notes && (
            <div className="order-notes">
              <span className="notes-icon">📝</span>
              <span className="notes-text">{order.notes}</span>
            </div>
          )}

          <div className="order-actions">
            {order.status === 'PENDING' && (
              <button
                className="btn-start"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartOrder(order.id);
                }}
                disabled={updating[order.id]}
              >
                {updating[order.id] ? '⏳' : '▶️ Start'}
              </button>
            )}

            {order.status === 'IN_PROGRESS' && (
              <>
                <button
                  className="btn-complete"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompleteOrder(order.id);
                  }}
                  disabled={updating[order.id]}
                >
                  {updating[order.id] ? '⏳' : '✅ Complete'}
                </button>
                <button
                  className="btn-cancel"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCancelOrder(order.id);
                  }}
                  disabled={updating[order.id]}
                >
                  ❌
                </button>
              </>
            )}

            {order.status === 'COMPLETED' && (
              <div className="completed-badge">✓ Done</div>
            )}

            {order.status === 'CANCELLED' && (
              <div className="cancelled-badge">✕ Cancelled</div>
            )}
          </div>

          {/* Recipe hint for IN_PROGRESS orders */}
          {order.status === 'IN_PROGRESS' && (
            <div className="recipe-hint">
              👆 Click for recipe details
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OrderQueue;