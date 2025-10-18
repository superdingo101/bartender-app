import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Navigation from './Navigation';
import DrinkCard from './DrinkCard';
import EnhancedDrinkModal from './EnhancedDrinkModal';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const DrinksPage = () => {
  const { token } = useAuth();
  const [drinks, setDrinks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDrink, setEditingDrink] = useState(null);
  const [filter, setFilter] = useState('ALL');

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      const [drinksRes, categoriesRes] = await Promise.all([
        axios.get(`${API_URL}/api/drinks`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }),
        axios.get(`${API_URL}/api/drinks/categories`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
      ]);
      setDrinks(drinksRes.data.drinks);
      setCategories(categoriesRes.data.categories);
    } catch (error) {
      console.error('Failed to load drinks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDrink = () => {
    setEditingDrink(null);
    setShowModal(true);
  };

  const handleEditDrink = (drink) => {
    setEditingDrink(drink);
    setShowModal(true);
  };

  const filteredDrinks = filter === 'ALL'
    ? drinks
    : drinks.filter(d => d.categories?.some(dc => dc.category.name === filter));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-600">Loading drinks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Drinks Menu</h2>
          <button
            onClick={handleCreateDrink}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition"
          >
            ➕ Add Drink
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'ALL'
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            All Drinks
          </button>
          {categories.map(cat => (
            <button
              key={cat.name}
              onClick={() => setFilter(cat.name)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === cat.name
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {cat.icon} {cat.displayName}
            </button>
          ))}
        </div>

        {filteredDrinks.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🍹</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No drinks found</h3>
            <p className="text-gray-500">Add drinks to build your menu</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDrinks.map(drink => (
              <DrinkCard
                key={drink.id}
                drink={drink}
                onEdit={() => handleEditDrink(drink)}
              />
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <EnhancedDrinkModal
          drink={editingDrink}
          onClose={() => setShowModal(false)}
          onSave={() => {
            setShowModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
};

export default DrinksPage;