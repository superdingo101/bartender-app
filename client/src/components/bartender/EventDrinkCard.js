import React, { useState } from 'react';

const EventDrinkCard = ({ eventDrink, onRemove, onToggleAvailability, onUpdatePrice }) => {
  const [editingPrice, setEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(eventDrink.price.toString());

  const handlePriceSave = () => {
    onUpdatePrice(newPrice);
    setEditingPrice(false);
  };

  const primaryCategory = eventDrink.drink.categories?.find(dc => dc.isPrimary)?.category || eventDrink.drink.categories?.[0]?.category;
  const allCategories = eventDrink.drink.categories?.map(dc => dc.category) || [];

  return (
    <div className={`bg-white rounded-lg shadow hover:shadow-lg transition p-4 ${!eventDrink.available ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="text-3xl">
          {primaryCategory?.icon || '🍹'}
        </div>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition"
          title="Remove from event"
        >
          🗑️
        </button>
      </div>

      <h3 className="text-lg font-bold text-gray-800 mb-2">{eventDrink.drink.name}</h3>
      
      <div className="mb-3 flex flex-wrap gap-1">
        {allCategories.map((cat, idx) => (
          <span 
            key={cat.id}
            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
              idx === 0 ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {cat.icon} {cat.displayName}
          </span>
        ))}
      </div>

      {eventDrink.drink.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{eventDrink.drink.description}</p>
      )}

      <div className="border-t pt-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Price:</span>
          {editingPrice ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                step="0.01"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
              />
              <button onClick={handlePriceSave} className="text-green-600 hover:text-green-700">✓</button>
              <button onClick={() => setEditingPrice(false)} className="text-red-600 hover:text-red-700">✕</button>
            </div>
          ) : (
            <button
              onClick={() => setEditingPrice(true)}
              className="text-lg font-bold text-purple-600 hover:text-purple-700 transition"
            >
              ${eventDrink.price.toFixed(2)} ✏️
            </button>
          )}
        </div>

        <button
          onClick={onToggleAvailability}
          className={`w-full px-4 py-2 rounded font-medium transition ${
            eventDrink.available
              ? 'bg-green-100 text-green-700 hover:bg-green-200'
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          }`}
        >
          {eventDrink.available ? '✓ Available' : '✕ Unavailable'}
        </button>
      </div>
    </div>
  );
};

export default EventDrinkCard;