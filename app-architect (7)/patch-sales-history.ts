import fs from 'fs';

const path = 'src/components/SalesHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `export default function SalesHistory({ onEditBill }: { onEditBill?: () => void }) {
  const { transactions, deleteTransaction } = useAppContext();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    // Sort transactions by date (newest first)
  const { setCart } = useAppContext();`;

const replacement1 = `export default function SalesHistory({ onEditBill }: { onEditBill?: () => void }) {
  const { transactions, deleteTransaction, setCart, setDiscount, setChannel } = useAppContext();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEditTx, setConfirmEditTx] = useState<Transaction | null>(null);
    // Sort transactions by date (newest first)`;

content = content.replace(target1, replacement1);

const target2 = `  const handleEditTransaction = (transaction: Transaction) => {
    if (window.confirm('คุณต้องการแก้ไขบิลนี้หรือไม่? (สต๊อกจะถูกคืนชั่วคราวและระบบจะพากลับไปหน้า POS)')) {
      // 1. Revert the transaction
      deleteTransaction(transaction.id);
      
      // 2. Set the cart with the items from the transaction
      setCart(transaction.items);
      
      // 3. Navigate back to POS
      if (onEditBill) {
        onEditBill();
      }
    }
  };`;

const replacement2 = `  const handleEditTransaction = (transaction: Transaction) => {
    setConfirmEditTx(transaction);
  };
  
  const proceedEditTransaction = () => {
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

content = content.replace(target2, replacement2);

const target3 = `      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">`;

const replacement3 = `      {/* Confirm Edit Modal */}
      {confirmEditTx && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-800 mb-4">ยืนยันการแก้ไข</h3>
            <p className="text-gray-600 mb-6 text-sm">คุณต้องการแก้ไขบิลนี้หรือไม่?<br/><br/><span className="text-red-500 font-medium">คำเตือน: สต๊อกจะถูกคืนกลับระบบชั่วคราวและระบบจะพาคุณกลับไปหน้า POS</span></p>
            <div className="flex space-x-3">
              <button onClick={() => setConfirmEditTx(null)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium transition-colors hover:bg-gray-200">ยกเลิก</button>
              <button onClick={proceedEditTransaction} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium transition-colors hover:bg-blue-700 shadow-lg">ยืนยันแก้ไข</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">`;

content = content.replace(target3, replacement3);

fs.writeFileSync(path, content);
