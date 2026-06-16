import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { getMyOrders } from '../../services/api';
import OrderQueue from './OrderQueue';
import OrderStats from './OrderStats';
import OrderDetailsModal from './OrderDetailsModal';
import QuickAddOrderModal from './QuickAddOrderModal';
import './Dashboard.css';
import Navigation from './Navigation';

const Dashboard = () => {
  const { user, token, logout } = useAuth();
  const { socket, connected } = useSocket(token);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [notification, setNotification] = useState(null);
  
  // Order Details Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  
  // Quick Add Order Modal state
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token]);

  useEffect(() => {
    if (!socket || !connected) {
      console.log('⚠️ Socket not ready, waiting for connection...');
      return;
    }

    console.log('🔌 Socket connected, setting up listeners');

    socket.emit('join-dashboard');

    socket.on('new-order', (order) => {
      console.log('📦 New order received:', order);
      setOrders((prev) => [order, ...prev]);
      showNotification(`🆕 New order: ${order.drink.name}`);
      playNotificationSound();
    });

    socket.on('order-updated', (updatedOrder) => {
      console.log('📝 Order updated:', updatedOrder);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
    });

    socket.on('order-cancelled', (cancelledOrder) => {
      console.log('❌ Order cancelled:', cancelledOrder);
      setOrders((prev) =>
        prev.map((order) =>
          order.id === cancelledOrder.id ? cancelledOrder : order
        )
      );
      showNotification(`❌ Order cancelled: ${cancelledOrder.drink.name}`);
    });

    return () => {
      console.log('🧹 Cleaning up socket listeners');
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

  const handleOrderClick = (order) => {
    // Only show details for IN_PROGRESS orders
    if (order.status === 'IN_PROGRESS') {
      setSelectedOrder(order);
      setShowOrderDetails(true);
    }
  };

  const isVisibleForFilter = (order, selectedFilter) => {
    if (selectedFilter === 'ALL' || selectedFilter === 'COMPLETED') {
      return selectedFilter === 'ALL' || order.status === 'COMPLETED';
    }

    if (selectedFilter === 'PENDING') {
      return order.status === 'PENDING' && !order.claimedById;
    }

    if (selectedFilter === 'IN_PROGRESS') {
      return order.status === 'IN_PROGRESS' && (!order.claimedById || order.claimedById === user?.id);
    }

    return order.status === selectedFilter;
  };

  const filteredOrders = orders.filter((order) => isVisibleForFilter(order, filter));

  const pendingCount = orders.filter((o) => isVisibleForFilter(o, 'PENDING')).length;
  const inProgressCount = orders.filter((o) => isVisibleForFilter(o, 'IN_PROGRESS')).length;

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
                {connected ? '✅ Live' : '❌ Offline (retrying...)'}
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowQuickAdd(true)}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            ⚡ Quick Add Order
          </button>
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
              onOrderClick={handleOrderClick}
            />
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          allOrders={orders}
          onComplete={() => {
            loadOrders(); // Refresh orders after completion
          }}
          onClose={() => {
            setShowOrderDetails(false);
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Quick Add Order Modal */}
      {showQuickAdd && (
        <QuickAddOrderModal
          onClose={() => setShowQuickAdd(false)}
          onOrderCreated={() => {
            loadOrders(); // Refresh orders after creation
            showNotification('🆕 Order created successfully!');
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;