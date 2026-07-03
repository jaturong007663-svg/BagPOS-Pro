import fs from 'fs';

const path = 'src/components/SalesHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const { transactions, deleteTransaction, MARKETS } = useAppContext();",
  "const { transactions, deleteTransaction } = useAppContext();"
);

content = content.replace(
  "import { Transaction } from '../types';",
  "import { Transaction, MARKETS } from '../types';"
);

fs.writeFileSync(path, content);
