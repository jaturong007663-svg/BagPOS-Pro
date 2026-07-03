import fs from 'fs';

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "{activeTab === 'sales-history' && <SalesHistory />}",
  "{activeTab === 'sales-history' && <SalesHistory onEditBill={() => setActiveTab('pos')} />}"
);

fs.writeFileSync(path, content);
