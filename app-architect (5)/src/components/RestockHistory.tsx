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
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 h-full overflow-y-auto pb-24 lg:pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center flex-wrap">
          <Calendar className="mr-2 md:mr-3 text-blue-600 shrink-0" size={28} />
          <span className="truncate">ประวัติการสั่งซื้อ</span>
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

              <div className="border-t border-gray-100 pt-2">
                <div className="hidden lg:grid grid-cols-12 gap-4 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 rounded-lg mb-2">
                  <div className="col-span-5 xl:col-span-4">รายการสินค้า</div>
                  <div className="col-span-3 xl:col-span-3">รายละเอียด (สี/จำนวน)</div>
                  <div className="col-span-2 text-center">ช่องทางที่สั่ง</div>
                  <div className="col-span-1 text-center">ต้นทุน/คู่</div>
                  <div className="col-span-1 text-center">จำนวน(คู่)</div>
                </div>
                <div className="space-y-3">
                  {order.items?.map((item, idx) => {
                    const productRef = bags.find(p => p.name === item.name);
                    const storeId = productRef?.storeId || '';
                    const storeName = storeId || 'ไม่ระบุ';
                    const productUrl = item.productUrl || productRef?.productUrl || '';
                    const displayImage = item.image || productRef?.image || '';
                    
                    return (
                      <div key={idx} className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 lg:border-transparent lg:items-center">
                        <div className="col-span-5 xl:col-span-4 flex items-start gap-3">
                          {displayImage ? (
                            <img src={displayImage} alt={item.name} className="w-16 h-16 lg:w-12 lg:h-12 object-cover rounded-md border border-gray-100 shrink-0" />
                          ) : (
                            <div className="w-16 h-16 lg:w-12 lg:h-12 bg-gray-100 rounded-md flex items-center justify-center border border-gray-100 shrink-0">
                              <Package className="text-gray-400" size={24} />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-800 line-clamp-2">{item.name}</p>
                          </div>
                        </div>
                        
                        <div className="col-span-3 xl:col-span-3 lg:mt-0 bg-gray-50 lg:bg-transparent p-2 lg:p-0 rounded-lg">
                          {item.variants && item.variants.length > 0 ? (
                            <div className="space-y-1">
                              <p className="lg:hidden text-xs text-gray-500 mb-1 font-medium">รายละเอียด:</p>
                              <div className="flex flex-wrap gap-2 lg:block lg:space-y-1">
                                {item.variants.filter((v: any) => v.stock > 0).map((v: any, vIdx: number) => (
                                  <div key={vIdx} className="flex items-center space-x-2 text-xs bg-white lg:bg-transparent p-1 lg:p-0 rounded border lg:border-none border-gray-100">
                                    {v.imageUrl ? (
                                      <img src={v.imageUrl} className="w-6 h-6 object-cover rounded-sm border shrink-0" />
                                    ) : (
                                      <div className="w-6 h-6 bg-gray-100 rounded-sm border flex items-center justify-center shrink-0"><Package size={10} className="text-gray-400"/></div>
                                    )}
                                    <span className="text-gray-600">สี: {v.color || 'ไม่ระบุ'}</span>
                                    <span className="font-semibold text-gray-800">× {v.stock}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm italic">ไม่มีระบุสี</span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center lg:contents mt-1 lg:mt-0 border-t lg:border-0 border-gray-100 pt-2 lg:pt-0">
                          <div className="col-span-2 text-center text-sm">
                            <span className="lg:hidden text-gray-500 text-xs mr-2">สั่งจาก:</span>
                            {productUrl ? (
                              <a href={productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center">
                                {storeName} <span className="hidden lg:inline ml-1">🔗</span>
                              </a>
                            ) : (
                              <span className="text-gray-600">{storeName}</span>
                            )}
                          </div>
                          <div className="col-span-1 text-center text-sm text-gray-600">
                            <span className="lg:hidden text-gray-500 text-xs mr-2">ต้นทุน:</span>
                            ฿{item.cost?.toLocaleString() || 0}
                          </div>
                          <div className="col-span-1 text-center text-sm font-bold text-emerald-600">
                            <span className="lg:hidden text-gray-500 text-xs font-normal mr-2 text-gray-800">จำนวนรวม:</span>
                            <span className="bg-emerald-50 lg:bg-transparent px-2 py-0.5 rounded-full lg:p-0">{item.qty}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
