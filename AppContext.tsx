import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { Bag, CartItem, Transaction, Claim, Expense, Shipping, ChinaStore, RestockOrder, MARKETS } from './types';

interface AppContextType {
  bags: Bag[];
  cart: CartItem[];
  transactions: Transaction[];
  claims: Claim[];
  expenses: Expense[];
  shippings: Shipping[];
  chinaStores: ChinaStore[];
  restocks: RestockOrder[];
  currentMarket: string;
  setCurrentMarket: (market: string) => void;
  addBag: (bag: Bag) => void;
  updateBag: (bag: Bag) => void;
  deleteBag: (id: string) => void;
  addToCart: (bag: Bag, variant: { id: string, color: string, stock: number }) => void;
  removeFromCart: (variantId: string) => void;
  updateCartQuantity: (variantId: string, quantity: number) => void;
  checkout: (discount?: number) => Transaction | null;
  addClaim: (claim: Claim) => void;
  saveExpense: (expense: Expense) => void;
  addRestockOrder: (order: RestockOrder) => void;
  updateRestockOrder: (order: RestockOrder) => void;
  deleteRestockOrder: (id: string) => void;
  setBags: React.Dispatch<React.SetStateAction<Bag[]>>;
  setChinaStores: React.Dispatch<React.SetStateAction<ChinaStore[]>>;
  clearCart: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [bags, setBags] = useState<Bag[]>(() => {
    const saved = localStorage.getItem('pos_bags');
    return saved ? JSON.parse(saved) : [];
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('pos_transactions');
    return saved ? JSON.parse(saved) : [];
  });
  const [claims, setClaims] = useState<Claim[]>(() => {
    const saved = localStorage.getItem('pos_claims');
    return saved ? JSON.parse(saved) : [];
  });
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('pos_expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [shippings, setShippings] = useState<Shipping[]>(() => {
    const saved = localStorage.getItem('pos_shippings');
    return saved ? JSON.parse(saved) : [];
  });
  const [chinaStores, setChinaStores] = useState<ChinaStore[]>(() => {
    const saved = localStorage.getItem('pos_chinaStores');
    return saved ? JSON.parse(saved) : [];
  });
  const [restocks, setRestocks] = useState<RestockOrder[]>(() => {
    const saved = localStorage.getItem('pos_restocks');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentMarket, setCurrentMarket] = useState<string>('');

  useEffect(() => {
    const today = new Date().getDay();
    const market = MARKETS.find(m => m.day === today);
    if (market) setCurrentMarket(market.id);
  }, []);

  useEffect(() => localStorage.setItem('pos_bags', JSON.stringify(bags)), [bags]);
  useEffect(() => localStorage.setItem('pos_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('pos_claims', JSON.stringify(claims)), [claims]);
  useEffect(() => localStorage.setItem('pos_expenses', JSON.stringify(expenses)), [expenses]);
  useEffect(() => localStorage.setItem('pos_shippings', JSON.stringify(shippings)), [shippings]);
  useEffect(() => localStorage.setItem('pos_chinaStores', JSON.stringify(chinaStores)), [chinaStores]);
  useEffect(() => localStorage.setItem('pos_restocks', JSON.stringify(restocks)), [restocks]);

  const addBag = (bag: Bag) => setBags([...bags, bag]);
  const updateBag = (updatedBag: Bag) => setBags(bags.map(b => b.id === updatedBag.id ? updatedBag : b));
  const deleteBag = (id: string) => setBags(bags.filter(b => b.id !== id));

  const addToCart = (bag: Bag, variant: { id: string, color: string, stock: number }) => {
    if (variant.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(item => item.variantId === variant.id);
      if (existing) {
        if (existing.qty >= variant.stock) return prev;
        return prev.map(item => item.variantId === variant.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { 
        productId: bag.id, 
        variantId: variant.id, 
        name: bag.name, 
        color: variant.color, 
        price: bag.price, 
        qty: 1,
        image: bag.image
      }];
    });
  };

  const removeFromCart = (variantId: string) => setCart(prev => prev.filter(item => item.variantId !== variantId));

  const updateCartQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.variantId === variantId) {
        const bag = bags.find(b => b.id === item.productId);
        const variant = bag?.variants.find(v => v.id === variantId);
        if (variant && quantity <= variant.stock) {
          return { ...item, qty: quantity };
        }
      }
      return item;
    }));
  };

  const checkout = (discount: number = 0): Transaction | null => {
    if (cart.length === 0 || !currentMarket) return null;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const total = Math.max(0, subtotal - discount);
    
    const updatedBags = bags.map(b => {
      let updatedVariants = b.variants.map(v => {
        const cartItem = cart.find(c => c.variantId === v.id);
        if (cartItem) return { ...v, stock: v.stock - cartItem.qty };
        return v;
      });
      return { ...b, variants: updatedVariants };
    });

    const newTransaction: Transaction = {
      id: 's' + Date.now().toString(),
      date: new Date().toISOString(),
      marketId: currentMarket,
      items: [...cart],
      total,
      discount,
    };

    setBags(updatedBags);
    setTransactions([newTransaction, ...transactions]);
    setCart([]);
    return newTransaction;
  };

  const addClaim = (claim: Claim) => setClaims([claim, ...claims]);

  const saveExpense = (expense: Expense) => {
    const existingIndex = expenses.findIndex(e => e.date === expense.date);
    if (existingIndex >= 0) {
      const newExpArr = [...expenses];
      newExpArr[existingIndex] = expense;
      setExpenses(newExpArr);
    } else {
      setExpenses([...expenses, expense]);
    }
  };

  const addRestockOrder = (order: RestockOrder) => setRestocks([order, ...restocks]);
  const updateRestockOrder = (updatedOrder: RestockOrder) => {
    setRestocks(restocks.map(r => r.id === updatedOrder.id ? updatedOrder : r));
  };
  const deleteRestockOrder = (id: string) => {
    setRestocks(restocks.filter(r => r.id !== id));
  };
  const clearCart = () => setCart([]);

  return (
    <AppContext.Provider value={{
      bags, cart, transactions, claims, expenses, shippings, chinaStores, restocks,
      currentMarket, setCurrentMarket, addBag, updateBag, deleteBag,
      addToCart, removeFromCart, updateCartQuantity, checkout,
      addClaim, saveExpense, addRestockOrder, updateRestockOrder, deleteRestockOrder, setBags, setChinaStores, clearCart
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
