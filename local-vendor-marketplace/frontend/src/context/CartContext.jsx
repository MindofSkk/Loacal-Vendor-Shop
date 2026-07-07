import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem('lvm_cart');
    return stored ? JSON.parse(stored) : [];
  });

  const sync = (nextItems) => {
    setItems(nextItems);
    localStorage.setItem('lvm_cart', JSON.stringify(nextItems));
  };

  const addItem = (product) => {
    const nextItems = [...items];
    const existing = nextItems.find((item) => item._id === product._id);

    if (existing) {
      existing.quantity += 1;
    } else {
      nextItems.push({ ...product, quantity: 1 });
    }

    sync(nextItems);
  };

  const updateQuantity = (id, quantity) => {
    const nextItems = items
      .map((item) => (item._id === id ? { ...item, quantity: Number(quantity) } : item))
      .filter((item) => item.quantity > 0);
    sync(nextItems);
  };

  const removeItem = (id) => sync(items.filter((item) => item._id !== id));
  const clearCart = () => sync([]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value = { items, addItem, updateQuantity, removeItem, clearCart, subtotal };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
