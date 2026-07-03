import fs from 'fs';

const path = 'src/components/SalesHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `export default function SalesHistory({ onEditBill }: { onEditBill?: () => void }) {
  const { transactions, deleteTransaction } = useAppContext();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    // Sort transactions by date (newest first)
  const { setCart } = useAppContext();`;

const replacement1 = `export default function SalesHistory({ onEditBill }: { onEditBill?: () => void }) {
  const { transactions, deleteTransaction, setCart } = useAppContext();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEditTx, setConfirmEditTx] = useState<Transaction | null>(null);
    // Sort transactions by date (newest first)`;

content = content.replace(target1, replacement1);

// We need to remove the setDiscount and setChannel logic since they don't exist
const target2 = `  const proceedEditTransaction = () => {
    if (!confirmEditTx) return;
    deleteTransaction(confirmEditTx.id);
    setCart(confirmEditTx.items);
    if (confirmEditTx.discount) {
        setDiscount?.(confirmEditTx.discount);
    }
    if (confirmEditTx.channel) {
        setChannel?.(confirmEditTx.channel);
    }
    setConfirmEditTx(null);
    if (onEditBill) {
      onEditBill();
    }
  };`;

const replacement2 = `  const proceedEditTransaction = () => {
    if (!confirmEditTx) return;
    deleteTransaction(confirmEditTx.id);
    setCart(confirmEditTx.items);
    
    // We can't set local discount/channel of POS from here easily without context
    // but reverting items to cart is the most important part
    setConfirmEditTx(null);
    if (onEditBill) {
      onEditBill();
    }
  };`;

content = content.replace(target2, replacement2);

fs.writeFileSync(path, content);
