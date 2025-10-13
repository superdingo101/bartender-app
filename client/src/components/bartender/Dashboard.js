import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { getMyOrders } from '../../services/api';
import OrderQueue from './OrderQueue';
import OrderStats from './OrderStats';
import './Dashboard.css';
import Navigation from './Navigation';

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
      <Navigation />
      
      {notification && (
        <div className="dashboard-notification">
          {notification}
        </div>
      )}
	  
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
            <div className="connection-status">
              <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="ml-2 text-sm text-gray-600">
                {connected ? 'Live' : 'Offline'}
              </span>
            </div>
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
    </div>
  );
};

export default Dashboard;