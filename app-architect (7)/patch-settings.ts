import fs from 'fs';

let content = fs.readFileSync('src/components/Settings.tsx', 'utf-8');

// Add user to useAppContext
content = content.replace(
  'const { bags, transactions, claims, expenses, shippings, chinaStores, restocks } = useAppContext();',
  'const { user, bags, transactions, claims, expenses, shippings, chinaStores, restocks } = useAppContext();'
);

// Update doc path in handleImport
content = content.replace(
  'const ref = doc(db, colName, String(item.id));',
  'const ref = doc(db, \'users\', user?.uid || \'temp\', colName, String(item.id));'
);

fs.writeFileSync('src/components/Settings.tsx', content);
