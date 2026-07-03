import fs from 'fs';

const path = 'src/AppContext.tsx';
let content = fs.readFileSync(path, 'utf8');

// Ensure deleteTransaction is in the types
if (!content.includes('deleteTransaction: (id: string) => void;')) {
  console.log("Missing deleteTransaction type");
} else {
  console.log("Type exists");
}

