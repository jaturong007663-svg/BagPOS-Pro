import fs from 'fs';

const path = 'src/components/SalesHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add Edit2 and Undo import if missing
if (!content.includes('Edit2')) {
  content = content.replace(
    "import { Trash2, ShoppingBag, X, Check, MapPin, ReceiptText } from 'lucide-react';",
    "import { Trash2, ShoppingBag, X, Check, MapPin, ReceiptText, Edit2 } from 'lucide-react';"
  );
}

// 2. Add prop
content = content.replace(
  "export default function SalesHistory() {",
  "export default function SalesHistory({ onEditBill }: { onEditBill?: () => void }) {"
);

// 3. Add edit function
const editFuncStr = `  const handleEditTransaction = (transaction: Transaction) => {
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
  
content = content.replace(
  "const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());",
  "const { setCart } = useAppContext();\n  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());\n\n" + editFuncStr
);

// 4. Update the buttons in the transaction header
const buttonsHtml = `                      <button 
                        onClick={() => handleEditTransaction(transaction)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center"
                        title="แก้ไขบิล"
                      >
                        <Edit2 size={18} className="sm:mr-2" />
                        <span className="hidden sm:inline font-medium text-sm">แก้ไขบิล</span>
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(transaction.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center"
                        title="ยกเลิกบิล"
                      >`;

content = content.replace(
  /<button \s*onClick=\{\(\) => setConfirmDeleteId\(transaction\.id\)\}\s*className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center"\s*title="ยกเลิกบิล"\s*>/g,
  buttonsHtml
);

fs.writeFileSync(path, content);
