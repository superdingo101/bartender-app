import { useState, useCallback } from 'react';

export const useCart = () => {
  const [items, setItems] = useState([]);

  const addItem = useCallback((drink, price) => {
    setItems((prev) => {
      const existingItem = prev.find((item) => item.drink.id === drink.id);
      
      if (existingItem) {
        return prev.map((item) =>
          item.drink.id === drink.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...prev, { drink, price, quantity: 1 }];
    });
  }, []);

  const removeItem = useCallback((drinkId) => {
    setItems((prev) => prev.filter((item) => item.drink.id !== drinkId));
  }, []);

  const updateQuantity = useCallback((drinkId, quantity) => {
    if (quantity <= 0) {
      removeItem(drinkId);
      return;
    }
    
    setItems((prev) =>
      prev.map((item) =>
        item.drink.id === drinkId ? { ...item, quantity } : item
      )
    );
  }, [removeItem]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    itemCount,
  };
};

export default useCart;