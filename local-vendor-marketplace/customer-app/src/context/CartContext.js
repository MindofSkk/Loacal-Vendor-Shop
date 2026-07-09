import { createContext, useContext, useMemo, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const shopId = items[0]?.shop?._id || items[0]?.shop;

  const addItem = (product) => {
    const nextShopId = product.shop?._id || product.shop;
    if (shopId && nextShopId && shopId !== nextShopId) {
      throw new Error('Cart can contain products from one shop at a time.');
    }

    setItems((current) => {
      const found = current.find((item) => item._id === product._id);
      if (found) {
        return current.map((item) => (item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id, quantity) => {
    if (quantity <= 0) {
      setItems((current) => current.filter((item) => item._id !== id));
      return;
    }
    setItems((current) => current.map((item) => (item._id === id ? { ...item, quantity } : item)));
  };

  const removeItem = (id) => setItems((current) => current.filter((item) => item._id !== id));
  const clearCart = () => setItems([]);

  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
  const value = useMemo(() => ({ items, subtotal, addItem, updateQuantity, removeItem, clearCart }), [items, subtotal]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
