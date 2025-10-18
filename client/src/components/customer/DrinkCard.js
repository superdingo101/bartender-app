import React from 'react';
import './DrinkCard.css';

const DrinkCard = ({ eventDrink, onAddToCart }) => {
  const { drink, price, available } = eventDrink;

  // Safely get categories
  const allCategories = drink?.categories?.map(dc => dc.category).filter(Boolean) || [];
  const primaryCategory = drink?.categories?.find(dc => dc.isPrimary)?.category || allCategories[0];
  
  // Fallback icon if no category
  const drinkIcon = primaryCategory?.icon || '🍹';

  const handleAddToCart = () => {
    if (available) {
      onAddToCart(drink, price);
    }
  };

  return (
    <div className={`drink-card ${!available ? 'unavailable' : ''}`}>
      <div className="drink-image">
        {drink.imageUrl ? (
          <img src={drink.imageUrl} alt={drink.name} />
        ) : (
          <div className="drink-placeholder">{drinkIcon}</div>
        )}
        {!available && <div className="unavailable-overlay">Unavailable</div>}
      </div>

      <div className="drink-info">
        <h3 className="drink-name">{drink.name}</h3>
        {drink.description && (
          <p className="drink-description">{drink.description}</p>
        )}
        {primaryCategory && (
          <div className="drink-category">
            {primaryCategory.icon} {primaryCategory.displayName}
          </div>
        )}
        {allCategories.length > 1 && (
          <div className="drink-categories-extra">
            {allCategories.slice(1, 3).map((cat, idx) => (
              <span key={cat.name || idx} className="category-badge">
                {cat.displayName}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="drink-footer">
        <div className="drink-price">${price.toFixed(2)}</div>
        <button
          className="add-button"
          onClick={handleAddToCart}
          disabled={!available}
        >
          {available ? '+ Add' : 'Unavailable'}
        </button>
      </div>
    </div>
  );
};

export default DrinkCard;