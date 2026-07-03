import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { Wallet, Check, Package, Filter, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import LedgerChart from './LedgerChart';

// Helper for week string
const getWeekString = (d: Date) => {
  const date = new Date(d.getTime());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

export default function Ledger() {
  const { transactions = [], restocks = [], expenses = [], saveExpense, bags = [] } = useAppContext();
  
  // Filter states
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day');
  const [selectedDayStr, setSelectedDayStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedWeekStr, setSelectedWeekStr] = useState(() => getWeekString(new Date()));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customDate, setCustomDate] = useState<string>('');

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({ rent: '', utilities: '', wages: '', other: '', note: '' });

  // Load expense for selected day (only relevant when in 'day' mode, but we keep it updated)
  useEffect(() => {
    const currentExpense = expenses.find(e => e.date === selectedDayStr) || { rent: '', utilities: '', wages: '', other: '', note: '' };
    setExpenseForm({
      rent: currentExpense.rent.toString() || '',
      utilities: currentExpense.utilities.toString() || '',
      wages: currentExpense.wages.toString() || '',
      other: currentExpense.other.toString() || '',
      note: currentExpense.note || ''
    });
  }, [selectedDayStr, expenses]);

  // Filter logic
  const dateFilter = (dateStr: string) => {
    const date = new Date(dateStr);
    if (filterType === 'day') {
      const dayDate = new Date(selectedDayStr);
      return date.getDate() === dayDate.getDate() && date.getMonth() === dayDate.getMonth() && date.getFullYear() === dayDate.getFullYear();
    } else if (filterType === 'week') {
      if (!selectedWeekStr) return true;
      const [year, week] = selectedWeekStr.split('-W').map(Number);
      const getWeekStart = (y: number, w: number) => {
          const simple = new Date(y, 0, 1 + (w - 1) * 7);
          const dow = simple.getDay();
          const ISOweekStart = simple;
          if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
          else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
          return ISOweekStart;
      }
      const start = getWeekStart(year, week);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
    } else if (filterType === 'month') {
      return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
    } else if (filterType === 'year') {
      return date.getFullYear() === selectedYear;
    } else if (filterType === 'custom') {
      if (!customDate) return true;
      const customDateObj = new Date(customDate);
      return date.getDate() === customDateObj.getDate() && date.getMonth() === customDateObj.getMonth() && date.getFullYear() === customDateObj.getFullYear();
    }
    return true;
  };

  const filteredSales = useMemo(() => transactions.filter(s => dateFilter(s.date)), [transactions, filterType, selectedDayStr, selectedWeekStr, selectedMonth, selectedYear, customDate]);
  const filteredRestocks = useMemo(() => restocks.filter(r => dateFilter(r.date)), [restocks, filterType, selectedDayStr, selectedWeekStr, selectedMonth, selectedYear, customDate]);
  const filteredExpenses = useMemo(() => expenses.filter(e => dateFilter(e.date)), [expenses, filterType, selectedDayStr, selectedWeekStr, selectedMonth, selectedYear, customDate]);

  // Calculate totals
  const totalSales = filteredSales.reduce((sum, s) => sum + s.total, 0);
  
  const totalCost = filteredSales.reduce((sum, s) => {
    return sum + s.items.reduce((itemSum: number, item: any) => {
      const product = bags.find(p => p.id === item.productId);
      return itemSum + ((product?.cost || 0) * item.qty);
    }, 0);
  }, 0);

  const totalRestockCost = filteredRestocks.reduce((sum, r) => sum + (r.totalCost || 0), 0);

  const totalExpense = filteredExpenses.reduce((sum, e) => {
    return sum + (Number(e.rent) || 0) + (Number(e.utilities) || 0) + (Number(e.wages) || 0) + (Number(e.other) || 0);
  }, 0);

  const netProfit = totalSales - totalCost - totalExpense;
  const netCashFlow = totalSales - totalExpense - totalRestockCost;

  const handleSaveExpense = () => {
    const newExpense = {
      id: 'e-' + selectedDayStr,
      date: selectedDayStr,
      rent: Number(expenseForm.rent) || 0,
      utilities: Number(expenseForm.utilities) || 0,
      wages: Number(expenseForm.wages) || 0,
      other: Number(expenseForm.other) || 0,
      note: expenseForm.note
    };
    saveExpense(newExpense);
    toast('บันทึกรายจ่ายเรียบร้อย!');
  };

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 overflow-y-auto h-full pb-24 lg:pb-6">
      
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center flex-wrap">
          <Wallet className="mr-3 text-blue-600 shrink-0" size={28} />
          <span className="truncate">บัญชีรายรับ-รายจ่าย</span>
        </h2>

        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm overflow-x-auto shrink-0 w-full md:w-auto">
          <div className="pl-1 text-gray-500">
             <Filter size={18} />
          </div>
          <select 
            value={filterType} 
            onChange={(e) => {
              setFilterType(e.target.value as any);
              if (e.target.value !== 'custom') setCustomDate('');
            }}
            className="p-1.5 border-none bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer min-w-fit"
          >
            <option value="day">รายวัน</option>
            <option value="week">รายสัปดาห์</option>
            <option value="month">รายเดือน</option>
            <option value="year">รายปี</option>
            <option value="custom">เลือกวันที่</option>
          </select>

          {filterType === 'custom' && (
            <input 
              type="date" 
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="p-1.5 border-l border-gray-200 bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer pl-3 min-w-[120px]"
            />
          )}

          {filterType === 'day' && (
            <input 
              type="date" 
              value={selectedDayStr}
              onChange={(e) => setSelectedDayStr(e.target.value)}
              className="p-1.5 border-l border-gray-200 bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer pl-3 min-w-[120px]"
            />
          )}

          {filterType === 'week' && (
            <input 
              type="week" 
              value={selectedWeekStr}
              onChange={(e) => setSelectedWeekStr(e.target.value)}
              className="p-1.5 border-l border-gray-200 bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer pl-3 min-w-[150px]"
            />
          )}

          {filterType === 'month' && (
            <div className="flex items-center border-l border-gray-200 pl-2 ml-1">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="p-1.5 border-none bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer"
              >
                {['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'].map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="p-1.5 border-none bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y + 543}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === 'year' && (
             <select 
             value={selectedYear} 
             onChange={(e) => setSelectedYear(Number(e.target.value))}
             className="p-1.5 border-l border-gray-200 bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer pl-3"
           >
             {years.map(y => (
               <option key={y} value={y}>{y + 543}</option>
             ))}
           </select>
          )}
        </div>
      </div>

      {/* Render Graph Here (at the top) */}
      <LedgerChart 
        transactions={filteredSales} 
        restocks={filteredRestocks} 
        expenses={filteredExpenses} 
        bags={bags} 
        forcePeriod={filterType === 'custom' ? 'day' : filterType}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* สรุปยอดรวม (Summary) */}
        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm col-span-1 h-fit">
          <h3 className="font-bold text-blue-800 mb-4 text-lg">สรุปยอด (รายรับ)</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center text-gray-700">
              <span>ยอดขายรวมทั้งหมด</span>
              <span className="font-bold text-base text-blue-700">฿{totalSales.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 border-b border-blue-200 pb-3">
              <span>หัก ต้นทุนกระเป๋า (COGS)</span>
              <span className="font-bold text-red-500">- ฿{totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="font-bold text-gray-800">กำไรขั้นต้น (ก่อนหักค่าดำเนินการ)</span>
              <span className="font-bold text-base text-emerald-600">฿{(totalSales - totalCost).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600 border-b border-blue-200 pb-3">
              <span>หัก ค่าใช้จ่ายอื่นๆ (ค่าที่/ไฟ/แรง)</span>
              <span className="font-bold text-red-500">- ฿{totalExpense.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 font-bold text-gray-900 border-b-2 border-dashed pb-3">
              <span>กำไรสุทธิการดำเนินงาน</span>
              <span className={`text-lg ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>฿{netProfit.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center text-gray-600 pt-2">
              <span>ควักจ่ายซื้อของเติมสต๊อก</span>
              <span className="font-bold text-orange-600">- ฿{totalRestockCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 font-black text-gray-950 border-t border-slate-300 mt-2 bg-slate-100/50 p-2 rounded-lg">
              <span>กระแสเงินสดหมุนเวียนสุทธิ</span>
              <span className={`text-lg ${netCashFlow >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                ฿{netCashFlow.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ค่าใช้จ่าย และ บิล */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {filterType === 'day' || filterType === 'custom' ? (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
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
          ) : (
             <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 border-dashed flex flex-col justify-center items-center h-48 text-gray-400">
                <Calendar size={48} className="mb-4 opacity-50" />
                <p>กรุณาเลือกรูปแบบ <strong>"รายวัน"</strong> หรือ <strong>"เลือกวันที่"</strong></p>
                <p>เพื่อบันทึกค่าใช้จ่ายประจำวัน</p>
             </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-3 flex items-center text-sm">
              <Package className="mr-2 text-orange-500" size={18} />
              บิลสั่งซื้อของเข้าสต๊อก ({filteredRestocks.length} บิล)
            </h3>
            {filteredRestocks.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {filteredRestocks.map(r => (
                  <div key={r.id} className="p-3 bg-slate-50 border border-gray-100 rounded-xl flex justify-between items-center">
                    <div className="overflow-hidden mr-4">
                      <p className="font-bold text-gray-800 text-xs">วันที่ {new Date(r.date).toLocaleDateString('th-TH')} เวลา {new Date(r.date).toLocaleTimeString('th-TH')}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {r.items?.map((i:any) => `${i.name} (${i.qty} คู่)`).join(', ') || `รวม ${r.totalPairs} คู่`}
                      </p>
                      {r.shippingFee > 0 && <p className="text-[10px] text-blue-600 mt-1">ค่าขนส่ง: ฿{r.shippingFee}</p>}
                    </div>
                    <span className="font-black text-orange-600 text-sm whitespace-nowrap">฿{(r.totalCost || 0).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">ไม่มีรายการสั่งซื้อหรือเติมสต๊อกในช่วงเวลาที่ระบุ</p>
            )}
          </div>

        </div>
      </div>

      {/* Net Cash Flow Alert Box */}
      <div className={`p-6 rounded-2xl shadow-lg flex flex-col md:flex-row justify-between items-center mt-6 ${netCashFlow >= 0 ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}`}>
        <div className="mb-2 md:mb-0 text-center md:text-left">
          <p className="text-sm font-medium opacity-80 mb-1">สรุปกระแสเงินสดโดยรวม (ช่วงเวลาที่เลือก)</p>
          <h3 className="text-2xl font-bold">
            {netCashFlow >= 0 ? '🎉 กระแสเงินสดสุทธิเป็นบวก (Net Cash flow: Positive)' : '📉 กระแสเงินสดสุทธิเป็นลบ (Net Cash flow: Negative)'}
          </h3>
          <p className="text-xs opacity-75 mt-1">* บ่งบอกเงินที่เหลือสุทธิ หลังหักค่าใช้จ่ายเติมสต๊อกและค่าแผงทั้งหมดแล้ว</p>
        </div>
        <div className="text-5xl font-black tracking-tight whitespace-nowrap">
          ฿{netCashFlow.toLocaleString()}
        </div>
      </div>

    </div>
  );
}
