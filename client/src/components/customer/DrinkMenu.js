import React, { useState, useEffect } from 'react';
import DrinkCard from './DrinkCard';
import Cart from './Cart';
import './DrinkMenu.css';

const DrinkMenu = ({ event, cart, onAddToCart, socket }) => {
  const [drinks, setDrinks] = useState(event.drinks || []);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showCart, setShowCart] = useState(false);

  // Check if prices should be hidden
  const hidePrices = event.hidePrices || false;

  // Get unique categories from drinks
  const categories = React.useMemo(() => {
    const categorySet = new Map();
    categorySet.set('ALL', { name: 'ALL', displayName: 'All Drinks', icon: '🍹' });
    
    drinks.forEach(eventDrink => {
      const drink = eventDrink.drink;
      if (drink?.categories && Array.isArray(drink.categories)) {
        drink.categories.forEach(dc => {
          const cat = dc.category;
          if (cat && !categorySet.has(cat.name)) {
            categorySet.set(cat.name, {
              name: cat.name,
              displayName: cat.displayName,
              icon: cat.icon
            });
          }
        });
      }
    });
    
    return Array.from(categorySet.values());
  }, [drinks]);

  // Initialize Socket.IO connection for this event
  useEffect(() => {
    if (!socket) {
      console.log('⚠️ Socket not available yet');
      return;
    }

    if (!event || !event.id) {
      console.log('⚠️ Event not available yet');
      return;
    }

    console.log(`🎉 Joining event: ${event.id}`);
    socket.emit('join-event', event.id);

    // Listen for drink availability updates
    socket.on('drink-availability-updated', ({ drinkId, available }) => {
      console.log(`🍹 Drink availability updated: ${drinkId} = ${available}`);
      setDrinks((prev) =>
        prev.map((ed) =>
          ed.drinkId === drinkId ? { ...ed, available } : ed
        )
      );
    });

    return () => {
      console.log(`👋 Leaving event: ${event.id}`);
      socket.emit('leave-event', event.id);
      socket.off('drink-availability-updated');
    };
  }, [socket, event]);

  // Filter drinks by category
  const filteredDrinks = React.useMemo(() => {
    if (selectedCategory === 'ALL') {
      return drinks;
    }
    
    return drinks.filter((eventDrink) => {
      const drink = eventDrink.drink;
      if (!drink?.categories || !Array.isArray(drink.categories)) {
        return false;
      }
      return drink.categories.some(dc => dc.category?.name === selectedCategory);
    });
  }, [drinks, selectedCategory]);

  const availableDrinks = filteredDrinks.filter((ed) => ed.available);

  return (
    <div className="drink-menu">
      <div className="menu-header">
        <div className="event-info">
          <h1>{event.name}</h1>
          <p className="event-location">📍 {event.location}</p>
          <p className="event-date">
            📅 {new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {hidePrices && (
            <p className="complimentary-notice">
              🎁 All drinks complimentary
            </p>
          )}
        </div>
        
        <button 
          className="cart-button"
          onClick={() => setShowCart(!showCart)}
        >
          🛒 Cart ({cart.itemCount})
          {cart.itemCount > 0 && (
            <span className="cart-badge">{cart.itemCount}</span>
          )}
        </button>
      </div>

      <div className="category-filter">
        {categories.map((category) => {
          const count = category.name === 'ALL' 
            ? drinks.length 
            : drinks.filter(ed => 
                ed.drink?.categories?.some(dc => dc.category?.name === category.name)
              ).length;
          
          return (
            <button
              key={category.name}
              className={`category-btn ${selectedCategory === category.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.icon} {category.displayName} ({count})
            </button>
          );
        })}
      </div>

      {availableDrinks.length === 0 ? (
        <div className="no-drinks">
          <div className="no-drinks-icon">😔</div>
          <h3>No drinks available</h3>
          <p>
            {selectedCategory === 'ALL' 
              ? 'Check back later for drinks!'
              : `No available drinks in ${categories.find(c => c.name === selectedCategory)?.displayName || 'this category'}`}
          </p>
          {selectedCategory !== 'ALL' && (
            <button
              onClick={() => setSelectedCategory('ALL')}
              className="clear-filter-btn"
            >
              Show All Drinks
            </button>
          )}
        </div>
      ) : (
        <div className="drinks-grid">
          {availableDrinks.map((eventDrink) => (
            <DrinkCard
              key={eventDrink.id}
              eventDrink={eventDrink}
              onAddToCart={onAddToCart}
              hidePrices={hidePrices}
            />
          ))}
        </div>
      )}

      {showCart && (
        <Cart
          cart={cart}
          event={event}
          onClose={() => setShowCart(false)}
          hidePrices={hidePrices}
        />
      )}
    </div>
  );
};

export default DrinkMenu;