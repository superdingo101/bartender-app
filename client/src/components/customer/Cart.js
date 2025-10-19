import React, { useState, useEffect } from 'react';
import { createOrder } from '../../services/api';
import './Cart.css';

const CUSTOMER_NAME_KEY = 'bartending_app_customer_name';

const Cart = ({ cart, event, onClose, onOrderPlaced, hidePrices }) => {
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load saved customer name on mount
  useEffect(() => {
    const savedName = localStorage.getItem(CUSTOMER_NAME_KEY);
    if (savedName) {
      setCustomerName(savedName);
    }
  }, []);

  const handleCustomerNameChange = (e) => {
    const newName = e.target.value;
    setCustomerName(newName);
    
    if (newName.trim()) {
      localStorage.setItem(CUSTOMER_NAME_KEY, newName.trim());
    }
  };

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (cart.items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      localStorage.setItem(CUSTOMER_NAME_KEY, customerName.trim());

      const orders = [];
      for (const item of cart.items) {
        const orderData = {
          eventId: event.id,
          drinkId: item.drink.id,
          quantity: item.quantity,
          customerName: customerName.trim(),
          notes: notes.trim() || undefined,
        };

        const response = await createOrder(orderData);
        orders.push(response.order);
      }

      cart.clearCart();
      if (onOrderPlaced) {
        onOrderPlaced(orders);
      }
      
      setNotes('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <h2>🛒 Your Cart</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {cart.items.length === 0 ? (
          <div className="empty-cart">
            <p>Your cart is empty</p>
            <p className="empty-cart-hint">Add some drinks to get started!</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {cart.items.map((item) => (
                <div key={item.drink.id} className="cart-item">
                  <div className="cart-item-info">
                    <h4>{item.drink.name}</h4>
                    {!hidePrices && (
                      <p className="cart-item-price">${item.price.toFixed(2)} each</p>
                    )}
                  </div>
                  <div className="cart-item-controls">
                    <button
                      onClick={() => cart.updateQuantity(item.drink.id, item.quantity - 1)}
                      className="qty-button"
                    >
                      -
                    </button>
                    <span className="qty-display">{item.quantity}</span>
                    <button
                      onClick={() => cart.updateQuantity(item.drink.id, item.quantity + 1)}
                      className="qty-button"
                    >
                      +
                    </button>
                    <button
                      onClick={() => cart.removeItem(item.drink.id)}
                      className="remove-button"
                    >
                      🗑️
                    </button>
                  </div>
                  {!hidePrices && (
                    <div className="cart-item-total">
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!hidePrices && (
              <div className="cart-total">
                <span>Total:</span>
                <span className="total-amount">${cart.total.toFixed(2)}</span>
              </div>
            )}

            <div className="cart-form">
              <div className="form-group">
                <label>Your Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={handleCustomerNameChange}
                  placeholder="Enter your name"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Special Instructions (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="E.g., Extra ice, no sugar..."
                  rows={3}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}

              <button
                className="checkout-button"
                onClick={handleCheckout}
                disabled={loading || cart.items.length === 0}
              >
                {loading ? 'Placing Order...' : hidePrices ? 'Place Order' : `Place Order - $${cart.total.toFixed(2)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Cart;