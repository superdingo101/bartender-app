import React from 'react';
import './DrinkCard.css';

const DrinkCard = ({ eventDrink, onAddToCart }) => {
  const { drink, price, available } = eventDrink;

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
          <div className="drink-placeholder">🍹</div>
        )}
        {!available && <div className="unavailable-overlay">Unavailable</div>}
      </div>

      <div className="drink-info">
        <h3 className="drink-name">{drink.name}</h3>
        {drink.description && (
          <p className="drink-description">{drink.description}</p>
        )}
        <div className="drink-category">{drink.category.replace('_', ' ')}</div>
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