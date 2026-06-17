import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../hooks/useSocket';
import { getEvents, getMyOrders } from '../../services/api';
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
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(() => localStorage.getItem('bartenderSelectedEventId') || '');
  const [notification, setNotification] = useState(null);
  
  // Order Details Modal state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  
  // Quick Add Order Modal state
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const selectedEventIdRef = useRef(selectedEventId);
  const latestOrdersRequestRef = useRef(0);

  useEffect(() => {
    if (token) {
      loadEvents();
    }
  }, [token]);

  useEffect(() => {
    selectedEventIdRef.current = selectedEventId;

    if (token && selectedEventId) {
      loadOrders(selectedEventId);
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [token, selectedEventId]);

  useEffect(() => {
    if (!socket || !connected) {
      console.log('⚠️ Socket not ready, waiting for connection...');
      return;
    }

    console.log('🔌 Socket connected, setting up listeners');

    socket.emit('join-dashboard');

    socket.on('new-order', (order) => {
      console.log('📦 New order received:', order);
      if (order.eventId === selectedEventId) {
        setOrders((prev) => [order, ...prev]);
        showNotification(`🆕 New order: ${order.drink.name}`);
        playNotificationSound();
      }
    });

    socket.on('order-updated', (updatedOrder) => {
      console.log('📝 Order updated:', updatedOrder);
      if (updatedOrder.eventId === selectedEventId) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          )
        );
      }
    });

    socket.on('order-cancelled', (cancelledOrder) => {
      console.log('❌ Order cancelled:', cancelledOrder);
      if (cancelledOrder.eventId === selectedEventId) {
        setOrders((prev) =>
          prev.map((order) =>
            order.id === cancelledOrder.id ? cancelledOrder : order
          )
        );
        showNotification(`❌ Order cancelled: ${cancelledOrder.drink.name}`);
      }
    });

    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socket.emit('leave-dashboard');
      socket.off('new-order');
      socket.off('order-updated');
      socket.off('order-cancelled');
    };
  }, [socket, connected, selectedEventId]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const response = await getEvents(token);
      const availableEvents = response.events || [];
      setEvents(availableEvents);

      if (!selectedEventId && availableEvents.length > 0) {
        handleEventChange(availableEvents[0].id);
      } else if (selectedEventId && !availableEvents.some((event) => event.id === selectedEventId)) {
        handleEventChange(availableEvents[0]?.id || '');
      }
    } catch (error) {
      console.error('Failed to load events:', error);
      setLoading(false);
    }
  };

  const loadOrders = async (eventId = selectedEventId) => {
    if (!eventId) {
      setOrders([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const requestId = latestOrdersRequestRef.current + 1;
      latestOrdersRequestRef.current = requestId;
      const response = await getMyOrders(token, eventId);

      if (requestId !== latestOrdersRequestRef.current || selectedEventIdRef.current !== eventId) {
        return;
      }

      setOrders(response.orders);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      if (selectedEventIdRef.current === eventId) {
        setLoading(false);
      }
    }
  };

  const handleEventChange = (eventId) => {
    setSelectedEventId(eventId);
    if (eventId) {
      localStorage.setItem('bartenderSelectedEventId', eventId);
    } else {
      localStorage.removeItem('bartenderSelectedEventId');
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

  const selectedEvent = events.find((event) => event.id === selectedEventId);
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
            disabled={!selectedEventId}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
          >
            ⚡ Quick Add Order
          </button>
        </div>
	  
        <div className="event-switcher">
          <label htmlFor="event-select">Working event</label>
          <select
            id="event-select"
            value={selectedEventId}
            onChange={(event) => handleEventChange(event.target.value)}
          >
            {events.length === 0 && <option value="">No events available</option>}
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name} ({event.status})
              </option>
            ))}
          </select>
          {selectedEvent ? (
            <p>Showing orders for {selectedEvent.name} only.</p>
          ) : (
            <p>Create or select an event to start managing orders.</p>
          )}
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
              onOrderUpdate={() => loadOrders()}
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
          workingEvent={selectedEvent}
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