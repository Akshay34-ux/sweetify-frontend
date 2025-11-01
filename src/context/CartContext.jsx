// src/context/CartContext.jsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_KEY = "sweetify_cart_v1";

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const s = localStorage.getItem(CART_KEY);
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const addItem = (product, quantity = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p._id === product._id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].quantity = Math.min((copy[idx].quantity || 0) + quantity, 9999);
        return copy;
      }
      return [...prev, { ...product, quantity }];
    });
    setOpen(true); // open cart when item added
  };

  const removeItem = (productId) => {
    setItems((prev) => prev.filter((p) => p._id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setItems((prev) =>
      prev.map((p) => (p._id === productId ? { ...p, quantity: Math.max(1, Number(quantity) || 1) } : p))
    );
  };

  const clearCart = () => setItems([]);

  const totalItems = useMemo(() => items.reduce((s, it) => s + (it.quantity || 0), 0), [items]);

  const subtotal = useMemo(() => items.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0), [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        open,
        setOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}