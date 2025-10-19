import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const QuickAddOrderModal = ({ onClose, onOrderCreated }) => {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventDrinks, setEventDrinks] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  const [formData, setFormData] = useState({
    drinkId: '',
    customerName: '',
    quantity: 1,
    notes: ''
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  useEffect(() => {
    loadData();
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load all events
      const eventsRes = await axios.get(`${API_URL}/api/events`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allEvents = eventsRes.data.events;
      
      // Filter to active or today's events
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const relevantEvents = allEvents.filter(e => {
        if (e.status === 'ACTIVE') return true;
        
        const eventDate = new Date(e.date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === today.getTime();
      });

      setEvents(relevantEvents);

      // Auto-select event if only one
      if (relevantEvents.length === 1) {
        await selectEvent(relevantEvents[0]);
      } else if (relevantEvents.length > 0) {
        // Select ACTIVE event if exists, otherwise first one
        const activeEvent = relevantEvents.find(e => e.status === 'ACTIVE');
        await selectEvent(activeEvent || relevantEvents[0]);
      }

    } catch (error) {
      console.error('Failed to load data:', error);
      alert('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const selectEvent = async (event) => {
    setSelectedEvent(event);
    
    try {
      // Load event details with drinks
      const eventRes = await axios.get(`${API_URL}/api/events/${event.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const drinks = eventRes.data.event.drinks
        .filter(ed => ed.available)
        .sort((a, b) => a.drink.name.localeCompare(b.drink.name));
      
      setEventDrinks(drinks);

      // Load recent customers from this event's orders
      const ordersRes = await axios.get(`${API_URL}/api/orders?eventId=${event.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const customers = [...new Set(
        ordersRes.data.orders
          .map(o => o.customerName)
          .filter(name => name && name.trim())
      )].slice(0, 10);
      
      setRecentCustomers(customers);

    } catch (error) {
      console.error('Failed to load event details:', error);
    }
  };

  const handleCustomerNameChange = (value) => {
    setFormData({ ...formData, customerName: value });
    setSearchTerm(value);
    setShowCustomerDropdown(value.length > 0);
  };

  const selectCustomer = (name) => {
    setFormData({ ...formData, customerName: name });
    setSearchTerm(name);
    setShowCustomerDropdown(false);
  };

  const filteredCustomers = recentCustomers.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEvent) {
      alert('Please select an event');
      return;
    }

    if (!formData.drinkId) {
      alert('Please select a drink');
      return;
    }

    setCreating(true);
    
    try {
      await axios.post(
        `${API_URL}/api/orders`,
        {
          eventId: selectedEvent.id,
          drinkId: formData.drinkId,
          quantity: parseInt(formData.quantity) || 1,
          customerName: formData.customerName.trim() || 'Walk-in',
          notes: formData.notes.trim() || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (onOrderCreated) {
        onOrderCreated();
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to create order:', error);
      alert('Failed to create order: ' + (error.response?.data?.error || error.message));
    } finally {
      setCreating(false);
    }
  };

  const selectedDrink = eventDrinks.find(ed => ed.drinkId === formData.drinkId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b bg-purple-600 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">⚡ Quick Add Order</h2>
            <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl">
              ×
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading...</div>
        ) : events.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-6xl mb-4">📅</div>
            <p className="text-gray-600 mb-4">No active events today</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {/* Event Selection (only show if multiple events) */}
            {events.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event *
                </label>
                <select
                  value={selectedEvent?.id || ''}
                  onChange={(e) => {
                    const event = events.find(ev => ev.id === e.target.value);
                    selectEvent(event);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  {events.map(event => (
                    <option key={event.id} value={event.id}>
                      {event.name} - {new Date(event.date).toLocaleDateString()}
                      {event.status === 'ACTIVE' && ' (Active)'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedEvent && (
              <>
                {/* Drink Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drink * ({eventDrinks.length} available)
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-lg">
                    {eventDrinks.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        No drinks available at this event
                      </div>
                    ) : (
                      <div className="divide-y">
                        {eventDrinks.map((ed) => (
                          <label
                            key={ed.drinkId}
                            className={`flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 ${
                              formData.drinkId === ed.drinkId ? 'bg-purple-50' : ''
                            }`}
                          >
                            <div className="flex items-center flex-1">
                              <input
                                type="radio"
                                name="drink"
                                value={ed.drinkId}
                                checked={formData.drinkId === ed.drinkId}
                                onChange={(e) => setFormData({ ...formData, drinkId: e.target.value })}
                                className="mr-3"
                              />
                              <span className="font-medium text-gray-800">
                                {ed.drink.name}
                              </span>
                            </div>
                            <span className="text-purple-600 font-bold">
                              ${ed.price.toFixed(2)}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer Name */}
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => handleCustomerNameChange(e.target.value)}
                    onFocus={() => setShowCustomerDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    placeholder="Type name or select from recent..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                  
                  {/* Customer Dropdown */}
                  {showCustomerDropdown && filteredCustomers.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {filteredCustomers.map((name, idx) => (
                        <div
                          key={idx}
                          onClick={() => selectCustomer(name)}
                          className="px-4 py-2 hover:bg-purple-50 cursor-pointer"
                        >
                          {name}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for "Walk-in" customer
                  </p>
                </div>

                {/* Quantity */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                {/* Notes */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Special requests, modifications..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    rows="2"
                  />
                </div>

                {/* Order Summary */}
                {selectedDrink && (
                  <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <h3 className="font-bold text-purple-900 mb-2">Order Summary</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Drink:</span>
                        <span className="font-medium">{selectedDrink.drink.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium">{formData.quantity}x</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price per drink:</span>
                        <span className="font-medium">${selectedDrink.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-purple-900 pt-2 border-t border-purple-200">
                        <span>Total:</span>
                        <span>${(selectedDrink.price * formData.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating || !formData.drinkId || eventDrinks.length === 0}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {creating ? '⏳ Creating...' : '✅ Create Order'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default QuickAddOrderModal;