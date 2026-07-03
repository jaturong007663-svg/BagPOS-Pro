import React, { useState } from 'react';
import { useAppContext } from '../AppContext';
import { Trash2, ShoppingBag, X, Check, MapPin, ReceiptText, Edit2 } from 'lucide-react';
import { Transaction, MARKETS } from '../types';

export default function SalesHistory({ onEditBill }: { onEditBill?: () => void }) {
  const { transactions, deleteTransaction } = useAppContext();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEditTx, setConfirmEditTx] = useState<Transaction | null>(null);
  
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day');
  const [selectedDayStr, setSelectedDayStr] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Custom week formatter since we don't have date-fns imported here
  const getWeekString = (d: Date) => {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    // Thursday in current week decides the year.
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    // January 4 is always in week 1.
    const week1 = new Date(date.getFullYear(), 0, 4);
    // Adjust to Thursday in week 1 and count number of weeks from date to week1.
    const weekNumber = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
  };
  
  const [selectedWeekStr, setSelectedWeekStr] = useState(() => getWeekString(new Date()));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customDate, setCustomDate] = useState<string>('');

  const filteredTransactions = transactions.filter(order => {
      const date = new Date(order.date);
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
            if (dow <= 4)
                ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
            else
                ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
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
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;
        return dateStr === customDate;
      }
      return true;
  });

  const { setCart } = useAppContext();
  const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  const handleEditTransaction = (transaction: Transaction) => {
    setConfirmEditTx(transaction);
  };
  
  const proceedEditTransaction = () => {
    if (!confirmEditTx) return;
    deleteTransaction(confirmEditTx.id);
    setCart(confirmEditTx.items);
    
    // We can't set local discount/channel of POS from here easily without context
    // but reverting items to cart is the most important part
    setConfirmEditTx(null);
    if (onEditBill) {
      onEditBill();
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 h-full overflow-y-auto pb-24 lg:pb-6">
      {/* Confirm Edit Modal */}
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center flex-wrap">
          <ReceiptText className="mr-2 md:mr-3 text-emerald-600 shrink-0" size={28} />
          <span className="truncate">ประวัติการขาย</span>
        </h2>

        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm overflow-x-auto shrink-0 w-full md:w-auto">
          {/* <Filter size={18} className="text-gray-500 ml-2 shrink-0 hidden sm:block" /> */}
          <div className="pl-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
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
              className="p-1.5 border-l border-gray-200 bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer pl-3 min-w-[120px]"
            />
          )}

          {filterType === 'month' && (
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="p-1.5 border-l border-gray-200 bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer pl-3"
            >
              {Array.from({length: 12}, (_, i) => (
                <option key={i} value={i}>
                  {new Date(0, i).toLocaleString('th-TH', { month: 'short' })}
                </option>
              ))}
            </select>
          )}

          {(filterType === 'month' || filterType === 'year') && (
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="p-1.5 border-l border-gray-200 bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer pl-3"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {sortedTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <ReceiptText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-lg">ยังไม่มีประวัติการขายในระยะเวลานี้</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sortedTransactions.map(transaction => (
              <div key={transaction.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                  <div>
                    <div className="font-bold text-gray-800 text-lg">
                      วันที่: {new Date(transaction.date).toLocaleDateString('th-TH', { 
                        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                      <MapPin size={14} className="mr-1" />
                      {MARKETS.find(m => m.id === transaction.marketId)?.name || 'ตลาดอื่นๆ'}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end items-center gap-2 sm:gap-3 shrink-0 mt-3 md:mt-0">
                    <div className="text-right">
                      <div className="text-xs text-gray-500">ยอดรวม (บาท)</div>
                      <div className="font-bold text-emerald-600 text-xl">฿{transaction.total.toLocaleString()}</div>
                    </div>
                    {confirmDeleteId === transaction.id ? (
                      <div className="flex space-x-1 items-center bg-red-50 p-1.5 rounded">
                        <span className="text-xs text-red-600 px-2 font-medium">ลบบิลขายและคืนสต๊อก?</span>
                        <button 
                          onClick={() => {
                            deleteTransaction(transaction.id);
                            setConfirmDeleteId(null);
                          }}
                          className="bg-red-500 text-white p-1.5 rounded shadow-sm hover:bg-red-600 transition-colors"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(null)}
                          className="bg-gray-300 text-gray-700 p-1.5 rounded shadow-sm hover:bg-gray-400 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                      <button 
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
                      >
                        <Trash2 size={18} className="sm:mr-2" />
                        <span className="hidden sm:inline font-medium text-sm">ยกเลิกบิล</span>
                      </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-2">
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 rounded-lg mb-2">
                    <div className="col-span-6 md:col-span-5">รายการสินค้า</div>
                    <div className="col-span-2 text-center">จำนวน</div>
                    <div className="col-span-2 text-right">ราคาต่อหน่วย</div>
                    <div className="col-span-2 md:col-span-3 text-right">รวม</div>
                  </div>
                  <div className="space-y-2">
                    {transaction.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-50 sm:border-transparent sm:items-center">
                        <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-12 h-12 sm:w-10 sm:h-10 object-cover rounded-md border border-gray-100 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 sm:w-10 sm:h-10 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                              <ShoppingBag size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-800 text-sm line-clamp-2">{item.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">สี/รุ่น: {item.color}</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center sm:contents mt-2 sm:mt-0">
                          <div className="col-span-2 text-center text-sm">
                            <span className="sm:hidden text-gray-500 text-xs mr-2">จำนวน:</span>
                            <span className="font-medium bg-gray-100 px-2 py-0.5 rounded-full sm:bg-transparent sm:px-0">{item.qty}</span>
                          </div>
                          <div className="col-span-2 text-right text-sm text-gray-600">
                            <span className="sm:hidden text-gray-500 text-xs mr-2">ราคา:</span>
                            ฿{item.price.toLocaleString()}
                          </div>
                          <div className="col-span-2 md:col-span-3 text-right text-sm font-bold text-gray-800">
                            <span className="sm:hidden text-gray-500 text-xs font-normal mr-2">รวม:</span>
                            <span className="text-emerald-600 sm:text-gray-800">฿{(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
