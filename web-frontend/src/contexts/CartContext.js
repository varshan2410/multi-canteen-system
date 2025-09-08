import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [selectedCanteen, setSelectedCanteen] = useState(null);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    const savedCanteen = localStorage.getItem('selectedCanteen');
    
    if (savedCart) {
      setCartItems(JSON.parse(savedCart));
    }
    
    if (savedCanteen) {
      setSelectedCanteen(JSON.parse(savedCanteen));
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    if (selectedCanteen) {
      localStorage.setItem('selectedCanteen', JSON.stringify(selectedCanteen));
    }
  }, [selectedCanteen]);

  const addToCart = (item, canteen) => {
    // If switching canteens, clear cart
    if (selectedCanteen && selectedCanteen.id !== canteen.id) {
      if (window.confirm('Switching canteens will clear your current cart. Continue?')) {
        setCartItems([{ ...item, quantity: 1 }]);
        setSelectedCanteen(canteen);
      }
      return;
    }

    setSelectedCanteen(canteen);
    
    const existingItem = cartItems.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCartItems(cartItems.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCartItems([...cartItems, { ...item, quantity: 1 }]);
    }
  };

  const removeFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCartItems(cartItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setCartItems([]);
    setSelectedCanteen(null);
    localStorage.removeItem('cart');
    localStorage.removeItem('selectedCanteen');
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    selectedCanteen,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};