import React from 'react';

const DrinkCard = ({ drink, onEdit }) => {
  // Get primary category or first category
  const primaryCategory = drink.categories?.find(dc => dc.isPrimary)?.category || drink.categories?.[0]?.category;
  const allCategories = drink.categories?.map(dc => dc.category) || [];

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition p-4">
      <div className="text-4xl mb-3 text-center">
        {primaryCategory?.icon || '🍹'}
      </div>
      
      <h3 className="text-lg font-bold text-gray-800 mb-2">{drink.name}</h3>
      
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

      {drink.description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{drink.description}</p>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
        <span>📊 {drink._count?.events || 0} events</span>
        <span>🛒 {drink._count?.orders || 0} orders</span>
      </div>

      <button
        onClick={onEdit}
        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium transition"
      >
        Edit Drink
      </button>
    </div>
  );
};

export default DrinkCard;