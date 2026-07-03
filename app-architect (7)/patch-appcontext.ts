import fs from 'fs';

const path = 'src/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add deleteTransaction to AppContextType
content = content.replace(
  'clearCart: () => void;',
  'clearCart: () => void;\n  deleteTransaction: (id: string) => void;'
);

// Update Context definition
content = content.replace(
  'addClaim, saveExpense, addRestockOrder, updateRestockOrder, deleteRestockOrder, setBags, setChinaStores, clearCart',
  'addClaim, saveExpense, addRestockOrder, updateRestockOrder, deleteRestockOrder, deleteTransaction, setBags, setChinaStores, clearCart'
);

// Add deleteTransaction function implementation
const deleteTransactionImpl = `  const deleteTransaction = (id: string) => {
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
      deleteDoc(doc(db, 'transactions', id));
    }
  };`;

content = content.replace(
  'const clearCart = () => setCart([]);',
  `${deleteTransactionImpl}\n\n  const clearCart = () => setCart([]);`
);

// Update deleteRestockOrder to revert stock
const deleteRestockImpl = `  const deleteRestockOrder = (id: string) => {
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
      deleteDoc(doc(db, 'restockOrders', id));
    }
  };`;

content = content.replace(
  "const deleteRestockOrder = (id: string) => deleteDoc(doc(db, 'restockOrders', id));",
  deleteRestockImpl
);

fs.writeFileSync(path, content);
