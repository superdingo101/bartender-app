import React, { useState } from 'react';
import OrderCard from './OrderCard';
import './OrderQueue.css';

const OrderQueue = ({ orders, token, onOrderUpdate }) => {
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  const handleStatusUpdate = async (orderId) => {
    setUpdatingOrderId(orderId);
    // The OrderCard will handle the actual update
    setTimeout(() => {
      setUpdatingOrderId(null);
      if (onOrderUpdate) onOrderUpdate();
    }, 500);
  };

  if (orders.length === 0) {
    return (
      <div className="empty-queue">
        <div className="empty-icon">📭</div>
        <h3>No orders to display</h3>
        <p>Orders will appear here when customers place them</p>
      </div>
    );
  }

  return (
    <div className="order-queue">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          token={token}
          updating={updatingOrderId === order.id}
          onStatusChange={() => handleStatusUpdate(order.id)}
        />
      ))}
    </div>
  );
};

export default OrderQueue;