import React, { useState, useEffect } from 'react';
import { getEventMenu } from '../../services/api';
import DrinkCard from './DrinkCard';
import Cart from './Cart';
import './DrinkMenu.css';

const DrinkMenu = ({ event, cart, onAddToCart, onOrderPlaced, socket }) => {
  const [currentEvent, setCurrentEvent] = useState(event);
  const [drinks, setDrinks] = useState(event.drinks || []);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const refreshEventMenu = async () => {
      try {
        const response = await getEventMenu(event.id);
        if (!isMounted) {
          return;
        }

        setCurrentEvent(response.event);
        setDrinks(response.event.drinks || response.menu || []);
        localStorage.setItem('currentEvent', JSON.stringify(response.event));
      } catch (error) {
        console.error('Failed to refresh event menu:', error);
      }
    };

    if (event?.id) {
      setCurrentEvent(event);
      setDrinks(event.drinks || []);
      refreshEventMenu();
    }

    return () => {
      isMounted = false;
    };
  }, [event]);

  // Check if prices should be hidden
  const hidePrices = currentEvent.hidePrices || false;
  const menuOnly = currentEvent.menuOnly || false;

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

    // Listen for event setting updates
    socket.on('event-status-updated', (updatedEvent) => {
      console.log(`🎉 Event updated: ${updatedEvent.id}`);
      setCurrentEvent((prev) => {
        const mergedEvent = { ...prev, ...updatedEvent };
        localStorage.setItem('currentEvent', JSON.stringify(mergedEvent));
        return mergedEvent;
      });
      if (updatedEvent.menuOnly) {
        setShowCart(false);
      }
    });

    // Listen for full menu updates when bartenders add, remove, or edit event menu drinks.
    socket.on('event-menu-updated', (updatedEvent) => {
      console.log(`🍹 Event menu updated: ${updatedEvent.id}`);
      setCurrentEvent(updatedEvent);
      setDrinks(updatedEvent.drinks || []);
      localStorage.setItem('currentEvent', JSON.stringify(updatedEvent));

      if (updatedEvent.menuOnly) {
        setShowCart(false);
      }
    });

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
      socket.off('event-status-updated');
      socket.off('event-menu-updated');
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
          <h1>{currentEvent.name}</h1>
          <p className="event-location">📍 {currentEvent.location}</p>
          <p className="event-date">
            📅 {new Date(currentEvent.date).toLocaleDateString('en-US', {
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
          {menuOnly && (
            <p className="menu-only-notice">
              📋 Menu only — ordering is disabled for this event
            </p>
          )}
        </div>

        {!menuOnly && (
          <button
            className="cart-button"
            onClick={() => setShowCart(!showCart)}
          >
            🛒 Cart ({cart.itemCount})
            {cart.itemCount > 0 && (
              <span className="cart-badge">{cart.itemCount}</span>
            )}
          </button>
        )}
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

      <div className="drinks-grid">
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
          availableDrinks.map((eventDrink) => (
            <DrinkCard
              key={eventDrink.id}
              eventDrink={eventDrink}
              onAddToCart={onAddToCart}
              hidePrices={hidePrices}
              menuOnly={menuOnly}
            />
          ))
        )}
      </div>

      {!menuOnly && showCart && (
        <Cart
          cart={cart}
          event={currentEvent}
          onClose={() => setShowCart(false)}
          onOrderPlaced={onOrderPlaced}
          hidePrices={hidePrices}
        />
      )}
    </div>
  );
};

export default DrinkMenu;
