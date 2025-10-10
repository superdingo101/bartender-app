import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { useSocket } from './hooks/useSocket';
import { useCart } from './hooks/useCart';
import EventCodeEntry from './components/customer/EventCodeEntry';
import DrinkMenu from './components/customer/DrinkMenu';
import './App.css';

function App() {
  const [event, setEvent] = useState(null);
  const [notification, setNotification] = useState(null);
  const cart = useCart();
  const { socket } = useSocket(null); // No token for guest access

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
    <AuthProvider>
      <div className="App">
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
      </div>
    </AuthProvider>
  );
}

export default App;