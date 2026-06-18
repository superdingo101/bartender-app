import React, { useState, useEffect } from 'react';
import { getEventMenu } from '../../services/api';
import DrinkCard from './DrinkCard';
import Cart from './Cart';
import './DrinkMenu.css';


const LIQUOR_FILTERS = [
  { name: 'VODKA', displayName: 'Vodka', icon: '🍸', ingredient: 'vodka' },
  { name: 'WHISKEY', displayName: 'Whiskey', icon: '🥃', ingredient: 'whiskey' },
  { name: 'RUM', displayName: 'Rum', icon: '🏴‍☠️', ingredient: 'rum' },
  { name: 'TEQUILA', displayName: 'Tequila', icon: '🌵', ingredient: 'tequila' },
];

const normalizeIngredientText = (value) => (value || '').toString().toLowerCase();

export const drinkHasLiquorType = (drink, liquorType) => {
  const target = normalizeIngredientText(liquorType);

  return (drink?.ingredients || []).some((drinkIngredient) => {
    const ingredient = drinkIngredient?.ingredient || drinkIngredient;
    const searchableText = [
      ingredient?.name,
      ingredient?.type,
      ingredient?.brand,
    ].map(normalizeIngredientText).join(' ');

    return searchableText.includes(target);
  });
};

const eventDrinkHasLiquorType = (eventDrink, liquorType) => drinkHasLiquorType(eventDrink?.drink, liquorType);

export const getAvailableLiquorFilters = (eventDrinks) => LIQUOR_FILTERS.filter((filter) =>
  eventDrinks.some((eventDrink) => eventDrinkHasLiquorType(eventDrink, filter.ingredient))
);

const DrinkMenu = ({ event, cart, onAddToCart, onOrderPlaced, socket }) => {
  const [currentEvent, setCurrentEvent] = useState(event);
  const [drinks, setDrinks] = useState(event.drinks || []);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
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

  // Get unique category and liquor filters from drinks
  const filters = React.useMemo(() => {
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

    getAvailableLiquorFilters(drinks).forEach((filter) => {
      if (!categorySet.has(filter.name)) {
        categorySet.set(filter.name, filter);
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

  // Filter drinks by category or liquor type
  const filteredDrinks = React.useMemo(() => {
    if (selectedFilter === 'ALL') {
      return drinks;
    }

    return drinks.filter((eventDrink) => {
      const drink = eventDrink.drink;
      const liquorFilter = LIQUOR_FILTERS.find((filter) => filter.name === selectedFilter);
      if (liquorFilter) {
        return eventDrinkHasLiquorType(eventDrink, liquorFilter.ingredient);
      }

      if (!drink?.categories || !Array.isArray(drink.categories)) {
        return false;
      }
      return drink.categories.some(dc => dc.category?.name === selectedFilter);
    });
  }, [drinks, selectedFilter]);

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
        {filters.map((filter) => {
          const liquorFilter = LIQUOR_FILTERS.find((item) => item.name === filter.name);
          const count = filter.name === 'ALL'
            ? drinks.length
            : drinks.filter(ed =>
                liquorFilter
                  ? eventDrinkHasLiquorType(ed, liquorFilter.ingredient)
                  : ed.drink?.categories?.some(dc => dc.category?.name === filter.name)
              ).length;

          return (
            <button
              key={filter.name}
              className={`category-btn ${selectedFilter === filter.name ? 'active' : ''}`}
              onClick={() => setSelectedFilter(filter.name)}
            >
              {filter.icon} {filter.displayName} ({count})
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
              {selectedFilter === 'ALL'
                ? 'Check back later for drinks!'
                : `No available drinks in ${filters.find(c => c.name === selectedFilter)?.displayName || 'this category'}`}
            </p>
            {selectedFilter !== 'ALL' && (
              <button
                onClick={() => setSelectedFilter('ALL')}
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
