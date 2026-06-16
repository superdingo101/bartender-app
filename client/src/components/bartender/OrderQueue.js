import React, { useState } from 'react';
import axios from 'axios';
import './OrderQueue.css';

import API_URL from '../../config/api';

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

  const handleClaimOrder = (orderId) => {
    updateOrderStatus(orderId, 'IN_PROGRESS');
  };

  const handleUnclaimOrder = (orderId) => {
    updateOrderStatus(orderId, 'PENDING');
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
    if (onOrderClick && order.status === 'IN_PROGRESS' && order.claimedById) {
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
            order.status === 'IN_PROGRESS' && order.claimedById ? 'clickable' : ''
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

          {order.claimedBy && (order.status === 'COMPLETED' || order.status === 'IN_PROGRESS') && (
            <div className="order-notes">
              <span className="notes-icon">👤</span>
              <span className="notes-text">Bartender: {order.claimedBy.name}</span>
            </div>
          )}

          {order.notes && (
            <div className="order-notes">
              <span className="notes-icon">📝</span>
              <span className="notes-text">{order.notes}</span>
            </div>
          )}

          <div className="order-actions">
            {(order.status === 'PENDING' || (order.status === 'IN_PROGRESS' && !order.claimedById)) && (
              <button
                className="btn-start"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClaimOrder(order.id);
                }}
                disabled={updating[order.id]}
              >
                {updating[order.id] ? '⏳' : '🙋 Claim'}
              </button>
            )}

            {order.status === 'IN_PROGRESS' && order.claimedById && (
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
                  className="btn-start"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnclaimOrder(order.id);
                  }}
                  disabled={updating[order.id]}
                >
                  ↩️ Unclaim this order
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
          {order.status === 'IN_PROGRESS' && order.claimedById && (
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