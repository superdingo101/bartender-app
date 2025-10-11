import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useSocket } from './hooks/useSocket';
import { useCart } from './hooks/useCart';
import EventCodeEntry from './components/customer/EventCodeEntry';
import DrinkMenu from './components/customer/DrinkMenu';
import Login from './components/auth/Login';
import Dashboard from './components/bartender/Dashboard';
import './App.css';

function CustomerApp() {
  const [event, setEvent] = useState(null);
  const [notification, setNotification] = useState(null);
  const cart = useCart();
  const { socket } = useSocket(null);

  const handleEventFound = (foundEvent) => {
    setEvent(foundEvent);
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
        <DrinkMenu
          event={event}
          cart={cart}
          onAddToCart={handleAddToCart}
          onOrderPlaced={handleOrderPlaced}
          socket={socket}
        />
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
            <Route path="/" element={<CustomerApp />} />
            <Route path="/bartender/login" element={<Login />} />
            <Route
              path="/bartender/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
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