import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useSocket } from './hooks/useSocket';
import { useCart } from './hooks/useCart';
import EventCodeEntry from './components/customer/EventCodeEntry';
import DrinkMenu from './components/customer/DrinkMenu';
import Login from './components/bartender/Login';
import Dashboard from './components/bartender/Dashboard';
import './App.css';
import EventsPage from './components/bartender/EventsPage';
import DrinksPage from './components/bartender/DrinksPage';
import EventMenuPage from './components/bartender/EventMenuPage';
import AdminPage from './components/admin/AdminPage';
import IngredientsPage from './components/bartender/IngredientsPage';
import ResourcesPage from './components/bartender/ResourcesPage';
import BartenderAdminPage from './components/bartender/BartenderAdminPage';

function CustomerApp() {
  const [event, setEvent] = useState(null);
  const [notification, setNotification] = useState(null);
  const cart = useCart();
  const { socket } = useSocket(null);

  // Check for stored event on mount with expiry check
  useEffect(() => {
    const storedEventData = localStorage.getItem('currentEvent');
    const storedEventExpiry = localStorage.getItem('currentEventExpiry');
    
    if (storedEventData && storedEventExpiry) {
      const expiryTime = parseInt(storedEventExpiry, 10);
      const currentTime = new Date().getTime();
      
      if (currentTime < expiryTime) {
        // Event is still valid
        try {
          const parsedEvent = JSON.parse(storedEventData);
          setEvent(parsedEvent);
          
          if (socket) {
            socket.emit('join-event', parsedEvent.id);
          }
        } catch (error) {
          console.error('Failed to restore event:', error);
          localStorage.removeItem('currentEvent');
          localStorage.removeItem('currentEventExpiry');
        }
      } else {
        // Event has expired - clear it
        localStorage.removeItem('currentEvent');
        localStorage.removeItem('currentEventExpiry');
      }
    }
  }, []);

  const handleEventFound = (foundEvent) => {
    setEvent(foundEvent);
    const expiryTime = new Date().getTime() + (12 * 60 * 60 * 1000); // 12 hours
    localStorage.setItem('currentEvent', JSON.stringify(foundEvent));
    localStorage.setItem('currentEventExpiry', expiryTime.toString());
    
    if (socket) {
      socket.emit('join-event', foundEvent.id);
    }
  };

  const handleAddToCart = (drink, price) => {
    cart.addItem(drink, price);
    showNotification(`Added ${drink.name} to cart!`);
  };

  const handleOrderPlaced = (orders) => {
    showNotification(`🎉 Order placed! ${orders.length} drink(s) ordered.`);
  };

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  // Allow customers to change events
  const handleChangeEvent = () => {
    localStorage.removeItem('currentEvent');
    localStorage.removeItem('currentEventExpiry');
    setEvent(null);
    if (socket && event) {
      socket.emit('leave-event', event.id);
    }
  };
  
  return (
    <>
      {notification && (
        <div className="notification">
          {notification}
        </div>
      )}

      {!event ? (
        <EventCodeEntry onEventFound={handleEventFound} />
      ) : (
        <>
          <button 
            onClick={handleChangeEvent}
            className="change-event-btn"
            style={{
              position: 'fixed',
              top: '20px',
              right: '20px',
              padding: '10px 20px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              zIndex: 1000,
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            🔄 Change Event
          </button>
          <DrinkMenu
            event={event}
            cart={cart}
            onAddToCart={handleAddToCart}
            onOrderPlaced={handleOrderPlaced}
            socket={socket}
          />
        </>
      )}
    </>
  );
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading-page">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/bartender/login" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<CustomerApp />} />
            
            {/* Bartender Routes */}
            <Route path="/bartender/login" element={<Login />} />
			
			{/* Main bartender route - redirects to events */}
            <Route
              path="/bartender"
              element={
                <ProtectedRoute>
                  <Navigate to="/bartender/orders" replace />
                </ProtectedRoute>
              }
            />
            
            {/* Dashboard route - redirects to events */}
            <Route
              path="/bartender/dashboard"
              element={
                <ProtectedRoute>
                  <Navigate to="/bartender/events" replace />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/bartender/events"
              element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bartender/drinks"
              element={
                <ProtectedRoute>
                  <DrinksPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bartender/events/:id/menu"
              element={
                <ProtectedRoute>
                  <EventMenuPage />
                </ProtectedRoute>
              }
            />
			<Route
              path="/bartender/ingredients"
              element={
                <ProtectedRoute>
                  <IngredientsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bartender/resources"
              element={
                <ProtectedRoute>
                  <ResourcesPage />
                </ProtectedRoute>
              }
            />
            
            {/* Old dashboard route for order management */}
            <Route
              path="/bartender/orders"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
			<Route
              path="/bartender/admin"
              element={
                <ProtectedRoute requiredRole="BARTENDER">
                  <BartenderAdminPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;