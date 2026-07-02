import { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { Calendar, Package, Edit2, Trash2, Check, X, Filter } from 'lucide-react';
import { RestockOrder } from '../types';
import { format, parseISO, endOfWeek, isWithinInterval } from 'date-fns';

export default function RestockHistory() {
  const { restocks, bags, chinaStores, deleteRestockOrder, updateRestockOrder } = useAppContext();
  const [editingOrder, setEditingOrder] = useState<RestockOrder | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day');
  const [selectedDayStr, setSelectedDayStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [selectedWeekStr, setSelectedWeekStr] = useState(() => format(new Date(), "yyyy-'W'II"));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customDate, setCustomDate] = useState<string>('');

  const filteredRestocks = useMemo(() => {
    return restocks.filter(order => {
      const date = new Date(order.date);
      if (filterType === 'day') {
        const dayDate = parseISO(selectedDayStr);
        return date.getDate() === dayDate.getDate() && date.getMonth() === dayDate.getMonth() && date.getFullYear() === dayDate.getFullYear();
      } else if (filterType === 'week') {
        const weekDate = parseISO(selectedWeekStr);
        const end = endOfWeek(weekDate, { weekStartsOn: 1 });
        end.setHours(23, 59, 59, 999);
        return isWithinInterval(date, { start: weekDate, end });
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
  }, [restocks, filterType, selectedDayStr, selectedWeekStr, selectedMonth, selectedYear, customDate]);

  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Calendar className="mr-3 text-blue-600" size={28} /> ประวัติการสั่งซื้อ (Restock History)
        </h2>
        
        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
          <Filter size={18} className="text-gray-500 ml-2" />
          <select 
            value={filterType} 
            onChange={(e) => {
              setFilterType(e.target.value as any);
              if (e.target.value !== 'custom') setCustomDate('');
            }}
            className="p-1.5 border-none bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer"
          >
            <option value="day">รายวัน</option>
            <option value="week">รายสัปดาห์</option>
            <option value="month">รายเดือน</option>
            <option value="year">รายปี</option>
            <option value="custom">เลือกวันที่ (ปฏิทิน)</option>
          </select>

          {filterType === 'custom' && (
            <input 
              type="date" 
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              className="p-1.5 border-l border-gray-200 bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer pl-3"
            />
          )}

          {filterType === 'day' && (
            <input 
              type="date" 
              value={selectedDayStr}
              onChange={(e) => setSelectedDayStr(e.target.value)}
              className="p-1.5 border-l border-gray-200 bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer pl-3"
            />
          )}

          {filterType === 'week' && (
            <input 
              type="week" 
              value={selectedWeekStr}
              onChange={(e) => setSelectedWeekStr(e.target.value)}
              className="p-1.5 border-l border-gray-200 bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer pl-3"
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
                  {new Date(0, i).toLocaleString('th-TH', { month: 'long' })}
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

      <div className="space-y-4">
        {filteredRestocks.length === 0 ? (
           <div className="text-center text-gray-400 bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-200">
             <Package size={48} className="mx-auto mb-4 opacity-50" />
             <p>ยังไม่มีประวัติการสั่งซื้อในระยะเวลานี้</p>
           </div>
        ) : (
          filteredRestocks.slice().reverse().map(order => (
            <div key={order.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 border-b pb-4">
                <div>
                  <p className="font-bold text-gray-800 text-lg">รหัสบิล: {order.id}</p>
                  <p className="text-sm text-gray-500">{new Date(order.date).toLocaleString('th-TH')}</p>
                </div>
                <div className="mt-3 md:mt-0 flex flex-col md:items-end space-y-2">
                  {editingOrder?.id === order.id ? (
                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-600">ยอดรวม:</label>
                        <input 
                          type="number" 
                          value={editingOrder.totalCost || 0}
                          onChange={e => setEditingOrder({...editingOrder, totalCost: Number(e.target.value)})}
                          className="border rounded p-1 w-24 text-right"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-600">ค่าส่ง:</label>
                        <input 
                          type="number" 
                          value={editingOrder.shippingFee || 0}
                          onChange={e => setEditingOrder({...editingOrder, shippingFee: Number(e.target.value)})}
                          className="border rounded p-1 w-24 text-right"
                        />
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <button 
                          onClick={() => {
                            updateRestockOrder(editingOrder);
                            setEditingOrder(null);
                          }}
                          className="bg-green-500 hover:bg-green-600 text-white p-1.5 rounded-lg shadow-sm"
                        >
                          <Check size={16} />
                        </button>
                        <button 
                          onClick={() => setEditingOrder(null)}
                          className="bg-gray-200 hover:bg-gray-300 text-gray-600 p-1.5 rounded-lg shadow-sm"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-left md:text-right">
                        <p className="font-black text-emerald-600 text-xl">฿{(order.totalCost || 0).toLocaleString()}</p>
                        <p className="text-xs text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full inline-block mt-1">
                          ค่าส่งเหมาบิลรวม: ฿{(order.shippingFee || 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setEditingOrder(order)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
                          title="แก้ไขบิล"
                        >
                          <Edit2 size={16} />
                        </button>
                        {confirmDeleteId === order.id ? (
                          <div className="flex space-x-1 items-center bg-red-50 p-1 rounded">
                            <span className="text-xs text-red-600 px-1 font-medium">ลบ?</span>
                            <button 
                              onClick={() => deleteRestockOrder(order.id)}
                              className="bg-red-500 text-white p-1 rounded shadow-sm hover:bg-red-600"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-gray-300 text-gray-700 p-1 rounded shadow-sm hover:bg-gray-400"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmDeleteId(order.id)}
                            className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                            title="ลบบิล"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 border-b">
                    <tr>
                      <th className="p-3">รูปภาพ</th>
                      <th className="p-3">รายการสินค้า</th>
                      <th className="p-3">รายละเอียด (สี/จำนวน)</th>
                      <th className="p-3 text-center">ช่องทางที่สั่ง</th>
                      <th className="p-3 text-center">ต้นทุน/คู่ (บาท)</th>
                      <th className="p-3 text-center">รวมจำนวน (คู่)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {order.items?.map((item, idx) => {
                      const productRef = bags.find(p => p.name === item.name);
                      const storeId = productRef?.storeId || '';
                      const storeName = storeId || 'ไม่ระบุ';
                      const productUrl = item.productUrl || productRef?.productUrl || '';
                      const displayImage = item.image || productRef?.image || '';
                      
                      return (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-3 w-16">
                            {displayImage ? (
                              <img src={displayImage} alt={item.name} className="w-12 h-12 object-cover rounded-md border border-gray-100" />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 flex items-center justify-center rounded-md border border-gray-100">
                                <Package className="text-gray-400" size={20} />
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-gray-800">{item.name}</p>
                          </td>
                          <td className="p-3">
                            {item.variants && item.variants.length > 0 ? (
                              <div className="space-y-1">
                                {item.variants.filter((v: any) => v.stock > 0).map((v: any, vIdx: number) => (
                                  <div key={vIdx} className="flex items-center space-x-2 text-xs">
                                    {v.imageUrl ? (
                                      <img src={v.imageUrl} className="w-6 h-6 object-cover rounded-sm border" />
                                    ) : (
                                      <div className="w-6 h-6 bg-gray-100 rounded-sm border flex items-center justify-center"><Package size={10} className="text-gray-400"/></div>
                                    )}
                                    <span className="text-gray-600">สี: {v.color || 'ไม่ระบุ'}</span>
                                    <span className="font-semibold text-gray-800">× {v.stock}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="p-3 text-center max-w-[120px]">
                            {productUrl ? (
                              <a href={productUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium break-all line-clamp-2" title={productUrl}>
                                {storeName !== 'ไม่ระบุ' ? storeName : 'เปิดลิ้งค์สั่งซื้อ'}
                              </a>
                            ) : (
                              <span className="text-xs text-orange-600 font-medium">{storeName}</span>
                            )}
                          </td>
                          <td className="p-3 text-center text-gray-600">฿{item.cost || 0}</td>
                          <td className="p-3 text-center font-bold text-emerald-600">{item.qty}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 bg-slate-50 p-3 rounded-lg text-sm text-gray-600 flex justify-between items-center border border-slate-100">
                 <span>ยอดรวมสั่งซื้อทั้งหมด: <strong className="text-gray-800 text-base">{order.totalPairs} คู่</strong></span>
                 <span>เฉลี่ยค่าขนส่งเหมาบิล: <strong className="text-blue-600">฿{((order.shippingFee || 0) / (order.totalPairs || 1)).toFixed(2)} / คู่</strong></span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
