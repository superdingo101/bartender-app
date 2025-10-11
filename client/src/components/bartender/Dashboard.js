import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { getMyOrders } from '../../services/api';
import OrderQueue from './OrderQueue';
import OrderStats from './OrderStats';
import './Dashboard.css';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const { socket, connected } = useSocket(token);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadOrders();
  }, [token]);

  useEffect(() => {
    if (!socket || !connected) return;

    // Join bartender dashboard
    socket.emit('join-dashboard');

    // Listen for new orders
    socket.on('new-order', (order) => {
      setOrders((prev) => [order, ...prev]);
      showNotification(`🆕 New order: ${order.drink.name}`);
      playNotificationSound();
    });

    // Listen for order updates
    socket.on('order-updated', (updatedOrder) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
    });

    // Listen for order cancellations
    socket.on('order-cancelled', (cancelledOrder) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === cancelledOrder.id ? cancelledOrder : order
        )
      );
      showNotification(`❌ Order cancelled: ${cancelledOrder.drink.name}`);
    });

    return () => {
      socket.emit('leave-dashboard');
      socket.off('new-order');
      socket.off('order-updated');
      socket.off('order-cancelled');
    };
  }, [socket, connected]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await getMyOrders(token);
      setOrders(response.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 5000);
  };

  const playNotificationSound = () => {
    // Simple beep using Web Audio API
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
      console.log('Audio notification failed:', error);
    }
  };

  const filteredOrders = orders.filter((order) =>
    filter === 'ALL' ? true : order.status === filter
  );

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const inProgressCount = orders.filter((o) => o.status === 'IN_PROGRESS').length;

  return (
    <div className="dashboard">
      {notification && (
        <div className="dashboard-notification">
          {notification}
        </div>
      )}

      <div className="dashboard-header">
        <div className="header-left">
          <h1>👨‍🍳 Bartender Dashboard</h1>
          <div className="connection-status">
            <span className={`status-dot ${connected ? 'connected' : 'disconnected'}`} />
            {connected ? 'Live' : 'Offline'}
          </div>
        </div>
        <div className="header-right">
          <span className="user-info">
            {user?.name} ({user?.role})
          </span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <OrderStats orders={orders} />

      <div className="dashboard-content">
        <div className="filters">
          <button
            className={`filter-btn ${filter === 'PENDING' ? 'active' : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            Pending ({pendingCount})
          </button>
          <button
            className={`filter-btn ${filter === 'IN_PROGRESS' ? 'active' : ''}`}
            onClick={() => setFilter('IN_PROGRESS')}
          >
            In Progress ({inProgressCount})
          </button>
          <button
            className={`filter-btn ${filter === 'COMPLETED' ? 'active' : ''}`}
            onClick={() => setFilter('COMPLETED')}
          >
            Completed
          </button>
          <button
            className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All Orders
          </button>
        </div>

        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : (
          <OrderQueue
            orders={filteredOrders}
            token={token}
            onOrderUpdate={loadOrders}
          />
        )}
      </div>
    </div>
  );
};

export default Dashboard;