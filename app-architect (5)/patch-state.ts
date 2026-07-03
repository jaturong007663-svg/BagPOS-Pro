import fs from 'fs';

const path = 'src/components/SalesHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);",
  "const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);\n  const [confirmEditTx, setConfirmEditTx] = useState<Transaction | null>(null);"
);

fs.writeFileSync(path, content);
