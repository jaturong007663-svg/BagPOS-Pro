import fs from 'fs';

const path = 'src/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

if (!content.includes('setCart: React.Dispatch<React.SetStateAction<CartItem[]>>')) {
  content = content.replace(
    'clearCart: () => void;',
    'clearCart: () => void;\n  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;'
  );
  
  content = content.replace(
    'deleteTransaction, setBags, setChinaStores, clearCart',
    'deleteTransaction, setBags, setChinaStores, clearCart, setCart'
  );
  
  fs.writeFileSync(path, content);
}
