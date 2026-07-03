import { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { Wallet, Check, Package } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Ledger() {
  const { transactions = [], restocks = [], expenses = [], saveExpense, bags = [] } = useAppContext();
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseForm, setExpenseForm] = useState({ rent: '', utilities: '', wages: '', other: '', note: '' });

  useEffect(() => {
    const currentExpense = expenses.find(e => e.date === expenseDate) || { rent: '', utilities: '', wages: '', other: '', note: '' };
    setExpenseForm({
      rent: currentExpense.rent.toString() || '',
      utilities: currentExpense.utilities.toString() || '',
      wages: currentExpense.wages.toString() || '',
      other: currentExpense.other.toString() || '',
      note: currentExpense.note || ''
    });
  }, [expenseDate, expenses]);

  const currentSales = transactions || [];

  const dailySales = currentSales.filter(s => s.date.startsWith(expenseDate));
  const totalDailySales = dailySales.reduce((sum, s) => sum + s.total, 0);

  const totalDailyCost = dailySales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum, item) => {
      const product = bags.find(p => p.id === item.productId);
      return itemSum + ((product?.cost || 0) * item.qty);
    }, 0);
  }, 0);

  const dailyRestocks = restocks.filter(r => r.date.startsWith(expenseDate));
  const totalDailyRestockCost = dailyRestocks.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  const totalDailyExpense = Number(expenseForm.rent) + Number(expenseForm.utilities) + Number(expenseForm.wages) + Number(expenseForm.other);
  const netProfit = totalDailySales - totalDailyCost - totalDailyExpense;
  const netCashFlow = totalDailySales - totalDailyExpense - totalDailyRestockCost;

  const handleSaveExpense = () => {
    const newExpense = {
      id: 'e-' + expenseDate,
      date: expenseDate,
      rent: Number(expenseForm.rent) || 0,
      utilities: Number(expenseForm.utilities) || 0,
      wages: Number(expenseForm.wages) || 0,
      other: Number(expenseForm.other) || 0,
      note: expenseForm.note
    };
    saveExpense(newExpense);
    toast('บันทึกรายจ่ายเรียบร้อย!');
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto h-full pb-24 lg:pb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
        <Wallet className="mr-3 text-blue-600" size={28} /> บัญชีรายรับ-รายจ่าย (Daily Ledger)
      </h2>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center mb-6">
        <label className="font-bold text-gray-700 mr-4">เลือกวันที่สรุปยอด:</label>
        <input
          type="date"
          value={expenseDate}
          onChange={e => setExpenseDate(e.target.value)}
          className="p-2 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-gray-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm col-span-1">
          <h3 className="font-bold text-blue-800 mb-4 text-lg">สรุปยอดขาย (รายรับ)</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-gray-700">
              <span>ยอดขายรวมทั้งหมด</span>
              <span className="font-bold text-base text-blue-700">฿{totalDailySales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 border-b border-blue-200 pb-3">
              <span>หัก ต้นทุนกระเป๋าที่ขายไป (COGS)</span>
              <span className="font-bold text-red-500">- ฿{totalDailyCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-gray-800">กำไรขั้นต้น (ก่อนหักค่าดำเนินการ)</span>
              <span className="font-bold text-base text-emerald-600">฿{(totalDailySales - totalDailyCost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 border-b border-blue-200 pb-3">
              <span>หัก ค่าใช้จ่ายรายวัน (ค่าที่/ไฟ/แรง)</span>
              <span className="font-bold text-red-500">- ฿{totalDailyExpense.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 font-bold text-gray-900 border-b-2 border-dashed pb-3">
              <span>กำไรสุทธิการดำเนินงาน</span>
              <span className={`text-lg ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>฿{netProfit.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 pt-2">
              <span>ควักจ่ายซื้อของเติมสต๊อกวันนี้</span>
              <span className="font-bold text-orange-600">- ฿{totalDailyRestockCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 font-black text-gray-950 border-t border-slate-300 mt-2 bg-slate-100/50 p-2 rounded-lg">
              <span>กระแสเงินสดหมุนเวียนสุทธิ</span>
              <span className={`text-lg ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                ฿{netCashFlow.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm col-span-1 lg:col-span-2 space-y-6">
          <div>
            <h3 className="font-bold text-red-700 mb-4 text-lg">บันทึกค่าใช้จ่ายประจำวัน (หน้าแผง)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ค่าเช่าที่ / ค่าแผง</label>
                <input type="number" value={expenseForm.rent} className="w-full p-3 border rounded-xl outline-none focus:border-red-400 bg-gray-50" placeholder="0" onChange={e => setExpenseForm({ ...expenseForm, rent: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ค่าไฟ / ค่าน้ำ / ค่าขยะ</label>
                <input type="number" value={expenseForm.utilities} className="w-full p-3 border rounded-xl outline-none focus:border-red-400 bg-gray-50" placeholder="0" onChange={e => setExpenseForm({ ...expenseForm, utilities: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">ค่าจ้างลูกน้อง</label>
                <input type="number" value={expenseForm.wages} className="w-full p-3 border rounded-xl outline-none focus:border-red-400 bg-gray-50" placeholder="0" onChange={e => setExpenseForm({ ...expenseForm, wages: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">จิปาถะ (ค่าน้ำมัน, ค่ากิน)</label>
                <input type="number" value={expenseForm.other} className="w-full p-3 border rounded-xl outline-none focus:border-red-400 bg-gray-50" placeholder="0" onChange={e => setExpenseForm({ ...expenseForm, other: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={handleSaveExpense} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-xl shadow-md transition-colors flex items-center text-sm">
                <Check size={18} className="mr-2" /> บันทึกรายจ่ายรายวัน
              </button>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center text-sm">
              <Package className="mr-2 text-orange-500" size={18} />
              บิลสั่งซื้อของเข้าสต๊อก (เฉพาะวันที่เลือก) ({dailyRestocks.length} บิล)
            </h3>
            {dailyRestocks.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {dailyRestocks.map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 border border-gray-100 rounded-xl flex justify-between items-center">
                    <div className="overflow-hidden mr-4">
                      <p className="font-bold text-gray-800 text-xs">บิลเวลา {new Date(r.date).toLocaleTimeString('th-TH')}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {r.items?.map(i => `${i.name} (${i.qty} คู่)`).join(', ') || `รวม ${r.totalPairs} คู่`}
                      </p>
                      {r.shippingFee > 0 && <p className="text-[10px] text-blue-600">ค่าขนส่งรวมในบิลนี้: ฿{r.shippingFee}</p>}
                    </div>
                    <span className="font-black text-orange-600 text-sm whitespace-nowrap">฿{(r.totalCost || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">ไม่มีรายการสั่งซื้อหรือเติมสต๊อกในวันที่ระบุ</p>
            )}
          </div>
        </div>
      </div>

      <div className={`p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center mt-6 ${netCashFlow >= 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
        <div className="mb-2 md:mb-0 text-center md:text-left">
          <p className="text-sm font-medium opacity-80 mb-1">สรุปกระแสเงินสดประจำวัน {new Date(expenseDate).toLocaleDateString('th-TH')}</p>
          <h3 className="text-2xl font-bold">
            {netCashFlow >= 0 ? '🎉 กระแสเงินสดสุทธิเป็นบวก (Net Cash flow: Positive)' : '📉 กระแสเงินสดสุทธิเป็นลบ (Net Cash flow: Negative)'}
          </h3>
          <p className="text-xs opacity-75 mt-1">* บ่งบอกเงินที่เหลือติดกระเป๋ากลับบ้าน หลังหักค่าใช้จ่ายเติมสต๊อกและค่าแผงทั้งหมดแล้ว</p>
        </div>
        <div className="text-5xl font-black tracking-tight whitespace-nowrap">
          ฿{netCashFlow.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
