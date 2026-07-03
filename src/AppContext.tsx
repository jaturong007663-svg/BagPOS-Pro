import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Bag, CartItem, Transaction, Claim, Expense, Shipping, ChinaStore, RestockOrder, MARKETS } from './types';
import { collection, onSnapshot, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './lib/firebase';

import { User, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';

interface AppContextType {
  user: User | null;
  signIn: () => void;
  logOut: () => void;
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
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  deleteTransaction: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [bags, setBags] = useState<Bag[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shippings, setShippings] = useState<Shipping[]>([]);
  const [chinaStores, setChinaStores] = useState<ChinaStore[]>([]);
  const [restocks, setRestocks] = useState<RestockOrder[]>([]);
  const [currentMarket, setCurrentMarket] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
    }
  };

  const logOut = async () => {
    await signOut(auth);
  };


  useEffect(() => {
    if (!user) {
      setBags([]);
      setTransactions([]);
      setClaims([]);
      setExpenses([]);
      setShippings([]);
      setChinaStores([]);
      setRestocks([]);
      return;
    }

    const today = new Date().getDay();
    const market = MARKETS.find(m => m.day === today);
    if (market) setCurrentMarket(market.id);

    const unsubs = [
      onSnapshot(collection(db, 'users', user.uid, 'bags'), 
        (snap) => {
          console.log('Bags updated:', snap.docs.length);
          setBags(snap.docs.map(d => d.data() as Bag));
        },
        (error) => console.error('Error fetching bags:', error)
      ),
      onSnapshot(collection(db, 'users', user.uid, 'transactions'), 
        (snap) => setTransactions(snap.docs.map(d => d.data() as Transaction).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())),
        (error) => console.error('Error fetching transactions:', error)
      ),
      onSnapshot(collection(db, 'users', user.uid, 'claims'), 
        (snap) => setClaims(snap.docs.map(d => d.data() as Claim).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())),
        (error) => console.error('Error fetching claims:', error)
      ),
      onSnapshot(collection(db, 'users', user.uid, 'expenses'), 
        (snap) => setExpenses(snap.docs.map(d => d.data() as Expense)),
        (error) => console.error('Error fetching expenses:', error)
      ),
      onSnapshot(collection(db, 'users', user.uid, 'shippings'), 
        (snap) => setShippings(snap.docs.map(d => d.data() as Shipping)),
        (error) => console.error('Error fetching shippings:', error)
      ),
      onSnapshot(collection(db, 'users', user.uid, 'stores'), 
        (snap) => setChinaStores(snap.docs.map(d => d.data() as ChinaStore)),
        (error) => console.error('Error fetching stores:', error)
      ),
      onSnapshot(collection(db, 'users', user.uid, 'restockOrders'), 
        (snap) => setRestocks(snap.docs.map(d => d.data() as RestockOrder).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())),
        (error) => console.error('Error fetching restockOrders:', error)
      ),
    ];
    return () => unsubs.forEach(unsub => unsub());
  }, [user]);

  const addBag = (bag: Bag) => setDoc(doc(db, 'users', user?.uid || 'temp', 'bags', bag.id), bag);
  const updateBag = (updatedBag: Bag) => setDoc(doc(db, 'users', user?.uid || 'temp', 'bags', updatedBag.id), updatedBag);
  const deleteBag = (id: string) => deleteDoc(doc(db, 'users', user?.uid || 'temp', 'bags', id));

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
    
    const batch = writeBatch(db);

    bags.forEach(b => {
      let needsUpdate = false;
      let updatedVariants = b.variants.map(v => {
        const cartItem = cart.find(c => c.variantId === v.id);
        if (cartItem) {
          needsUpdate = true;
          return { ...v, stock: v.stock - cartItem.qty };
        }
        return v;
      });
      if (needsUpdate) {
        batch.set(doc(db, 'users', user?.uid || 'temp', 'bags', b.id), { ...b, variants: updatedVariants });
      }
    });

    const newTransaction: Transaction = {
      id: 's' + Date.now().toString(),
      date: new Date().toISOString(),
      marketId: currentMarket,
      items: [...cart],
      total,
      discount,
    };

    batch.set(doc(db, 'users', user?.uid || 'temp', 'transactions', newTransaction.id), newTransaction);
    batch.commit().then(() => setCart([]));

    return newTransaction;
  };

  const addClaim = (claim: Claim) => setDoc(doc(db, 'users', user?.uid || 'temp', 'claims', claim.id), claim);

  const saveExpense = (expense: Expense) => {
    // Generate id if not present, but it's typically required
    if (!expense.id) {
      expense.id = 'e' + Date.now().toString();
    }
    setDoc(doc(db, 'users', user?.uid || 'temp', 'expenses', expense.id), expense);
  };

  const addRestockOrder = (order: RestockOrder) => setDoc(doc(db, 'users', user?.uid || 'temp', 'restockOrders', order.id), order);
  const updateRestockOrder = (updatedOrder: RestockOrder) => setDoc(doc(db, 'users', user?.uid || 'temp', 'restockOrders', updatedOrder.id), updatedOrder);
    const deleteRestockOrder = (id: string) => {
    const order = restocks.find(r => r.id === id);
    if (order) {
      // Try to revert stock
      order.items.forEach(item => {
        const bag = bags.find(b => b.name === item.name);
        if (bag && item.variants) {
          const updatedVariants = bag.variants.map(bagVar => {
            const orderVar = item.variants?.find(v => v.color === bagVar.color);
            if (orderVar) {
              // Revert by subtracting the restock amount, ensure we don't go below 0
              return { ...bagVar, stock: Math.max(0, (bagVar.stock || 0) - orderVar.stock) };
            }
            return bagVar;
          });
          updateBag({ ...bag, variants: updatedVariants });
        }
      });
      deleteDoc(doc(db, 'users', user?.uid || 'temp', 'restockOrders', id));
    }
  };
  
    const deleteTransaction = (id: string) => {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
      // Revert stock
      transaction.items.forEach(item => {
        const bag = bags.find(b => b.id === item.productId);
        if (bag) {
          const updatedVariants = bag.variants.map(v => 
            v.id === item.variantId ? { ...v, stock: (v.stock || 0) + item.qty } : v
          );
          updateBag({ ...bag, variants: updatedVariants });
        }
      });
      deleteDoc(doc(db, 'users', user?.uid || 'temp', 'transactions', id));
    }
  };

  const clearCart = () => setCart([]);

  if (loadingAuth) return <div className="flex h-screen items-center justify-center text-gray-500">กำลังตรวจสอบสิทธิ์...</div>;

  return (
    <AppContext.Provider value={{
      user, signIn, logOut,
      bags, cart, transactions, claims, expenses, shippings, chinaStores, restocks,
      currentMarket, setCurrentMarket, addBag, updateBag, deleteBag,
      addToCart, removeFromCart, updateCartQuantity, checkout,
      addClaim, saveExpense, addRestockOrder, updateRestockOrder, deleteRestockOrder, deleteTransaction, setBags, setChinaStores, clearCart, setCart
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

