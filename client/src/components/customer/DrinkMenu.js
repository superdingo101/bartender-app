import React, { useState, useEffect } from 'react';
import DrinkCard from './DrinkCard';
import Cart from './Cart';
import './DrinkMenu.css';

const DrinkMenu = ({ event, cart, onAddToCart, socket }) => {
  const [drinks, setDrinks] = useState(event.drinks || []);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showCart, setShowCart] = useState(false);

  const categories = ['ALL', 'COCKTAIL', 'BEER', 'WINE', 'SPIRITS', 'NON_ALCOHOLIC', 'SPECIALTY'];

  const categoryLabels = {
    ALL: 'All Drinks',
    COCKTAIL: 'Cocktails',
    BEER: 'Beer',
    WINE: 'Wine',
    SPIRITS: 'Spirits',
    NON_ALCOHOLIC: 'Non-Alcoholic',
    SPECIALTY: 'Specialty',
  };

  useEffect(() => {
    if (!socket) return;

    // Listen for drink availability updates
    socket.on('drink-availability-updated', ({ drinkId, available }) => {
      setDrinks((prev) =>
        prev.map((ed) =>
          ed.drinkId === drinkId ? { ...ed, available } : ed
        )
      );
    });

    return () => {
      socket.off('drink-availability-updated');
    };
  }, [socket]);

  const filteredDrinks =
    selectedCategory === 'ALL'
      ? drinks
      : drinks.filter((ed) => ed.drink.category === selectedCategory);

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
        {categories.map((category) => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {categoryLabels[category]}
          </button>
        ))}
      </div>

      {availableDrinks.length === 0 ? (
        <div className="no-drinks">
          <p>😔 No drinks available in this category</p>
        </div>
      ) : (
        <div className="drinks-grid">
          {availableDrinks.map((eventDrink) => (
            <DrinkCard
              key={eventDrink.id}
              eventDrink={eventDrink}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}

      {showCart && (
        <Cart
          cart={cart}
          event={event}
          onClose={() => setShowCart(false)}
        />
      )}
    </div>
  );
};

export default DrinkMenu;