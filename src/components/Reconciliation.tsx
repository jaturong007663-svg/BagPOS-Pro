import React, { useState, useMemo, useEffect } from 'react';
import { Calculator, Plus, Trash2, TrendingUp, Copy, CheckCircle2, Save, History, Clock, Image as ImageIcon } from 'lucide-react';
import { useAppContext } from '../AppContext';

interface CostItem {
  id: string;
  name: string;
  price: string;
  quantity: string;
  sellingPrice: string;
  bagId?: string; // Add bagId to optionally link to a bag
}

interface SavedCalculation {
  id: string;
  date: string;
  name: string;
  items: CostItem[];
  totalPaid: string;
  method: 'proportional' | 'average';
}

export default function Reconciliation() {
  const { bags } = useAppContext();
  const [items, setItems] = useState<CostItem[]>([{ id: crypto.randomUUID(), name: 'สินค้า 1', price: '', quantity: '1', sellingPrice: '' }]);
  const [totalPaid, setTotalPaid] = useState<string>('');
  const [method, setMethod] = useState<'proportional' | 'average'>('proportional');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [savedCalculations, setSavedCalculations] = useState<SavedCalculation[]>(() => {
    const saved = localStorage.getItem('pos_saved_calculations');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('pos_saved_calculations', JSON.stringify(savedCalculations));
  }, [savedCalculations]);

  const initiateSave = () => {
    setSaveName(`คำนวณต้นทุน ${new Date().toLocaleDateString('th-TH')}`);
    setShowSaveModal(true);
  };

  const handleSave = () => {
    if (saveName.trim()) {
      const newSaved: SavedCalculation = {
        id: crypto.randomUUID(),
        date: new Date().toISOString(),
        name: saveName.trim(),
        items,
        totalPaid,
        method
      };
      setSavedCalculations([newSaved, ...savedCalculations]);
      setShowSaveModal(false);
    }
  };

  const loadSaved = (saved: SavedCalculation) => {
    setItems(saved.items);
    setTotalPaid(saved.totalPaid);
    setMethod(saved.method);
    setShowHistory(false);
  };

  const deleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDeleteId(id);
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), name: `สินค้า ${items.length + 1}`, price: '', quantity: '1', sellingPrice: '' }]);
  };

  const updateItem = (id: string, field: keyof CostItem, value: string) => {
    setItems(prevItems => prevItems.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const updateItemMultiple = (id: string, updates: Partial<CostItem>) => {
    setItems(prevItems => prevItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const copyPrompt = (item: CostItem, actualCost: number) => {
    const prompt = `ช่วยวิเคราะห์การตั้งราคาขายและคำนวณกำไรให้หน่อยครับ \n\nรายละเอียด:\n- ต้นทุนสินค้าต่อชิ้น: ${actualCost.toFixed(2)} บาท\n- ราคาขายที่อยากตั้ง: ${item.sellingPrice || '0'} บาท\n\nช่วยคำนวณให้หน่อยว่า:\n1. จะได้กำไรต่อชิ้นกี่บาท?\n2. คิดเป็นกำไรกี่เปอร์เซ็นต์ของต้นทุน?\n3. หากขายได้ทั้งหมด ${item.quantity || '1'} ชิ้น จะได้กำไรรวมกี่บาท?`;
    navigator.clipboard.writeText(prompt);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalListPrice = items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);
  const totalItemsCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  const actualPaidNum = Number(totalPaid) || 0;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6 h-full overflow-y-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <Calculator className="mr-3 text-blue-600" size={28} /> คำนวณต้นทุนจริง (Cost Calculator)
        </h2>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowHistory(true)}
            className="flex-1 sm:flex-none items-center justify-center flex gap-2 px-4 py-2.5 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium shadow-sm"
          >
            <History size={18} /> ประวัติ ({savedCalculations.length})
          </button>
          <button
            onClick={initiateSave}
            className="flex-1 sm:flex-none items-center justify-center flex gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
          >
            <Save size={18} /> บันทึก
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">รายการสินค้า</h3>
            
            <datalist id="bag-names">
              {bags.map(b => (
                <option key={b.id} value={b.name} />
              ))}
            </datalist>
            
            <div className="space-y-4">
              {items.map((item, index) => {
                const matchedBag = bags.find(b => b.name === item.name);
                return (
                <div key={item.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start bg-gray-50 sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none border sm:border-0 border-gray-100 relative">
                  <div className="w-full sm:flex-1 sm:min-w-[120px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">ชื่อสินค้า (ถ้ามี)</label>
                    <div className="flex items-center gap-2">
                      {matchedBag && matchedBag.image && (
                        <img src={matchedBag.image} alt="" className="w-9 h-9 rounded-lg object-cover border border-gray-200 shrink-0" referrerPolicy="no-referrer" />
                      )}
                      <input
                        type="text"
                        list="bag-names"
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          const matched = bags.find(b => b.name === val);
                          if (matched && !item.price) {
                            updateItemMultiple(item.id, { name: val, price: matched.price.toString() });
                          } else {
                            updateItem(item.id, 'name', val);
                          }
                        }}
                        className="w-full p-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex w-full sm:w-auto gap-3">
                    <div className="flex-1 sm:w-24 shrink-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1">ราคาป้าย</label>
                      <input
                        type="number"
                        value={item.price}
                        onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                        placeholder="0"
                        className="w-full p-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      />
                    </div>
                    <div className="flex-1 sm:w-20 shrink-0">
                      <label className="block text-xs font-medium text-gray-500 mb-1">จำนวน</label>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        min="1"
                        className="w-full p-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                      />
                    </div>
                  </div>
                  <div className="flex w-full sm:w-auto gap-3 items-end">
                    <div className="flex-1 sm:w-24 shrink-0">
                      <label className="block text-xs font-medium text-blue-500 mb-1">ราคาขาย</label>
                      <input
                        type="number"
                        value={item.sellingPrice}
                        onChange={(e) => updateItem(item.id, 'sellingPrice', e.target.value)}
                        placeholder="0"
                        className="w-full p-2 border border-blue-200 bg-blue-50/50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 sm:mt-6 mb-1 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0 absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 bg-white sm:bg-transparent shadow-sm sm:shadow-none"
                      disabled={items.length === 1}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            </div>

            <button 
              onClick={addItem}
              className="mt-4 flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm px-4 py-2 hover:bg-blue-50 rounded-xl transition-colors"
            >
              <Plus size={16} className="mr-1" /> เพิ่มรายการสินค้า
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ยอดจ่ายจริง (รวมส่วนลดแล้ว)</h3>
            <div className="flex gap-4 items-center">
              <input
                type="number"
                value={totalPaid}
                onChange={(e) => setTotalPaid(e.target.value)}
                placeholder="กรอกยอดเงินที่จ่ายจริงทั้งหมด..."
                className="flex-1 p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-lg font-bold text-blue-600"
              />
              <span className="text-gray-500 font-medium">บาท</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">วิธีคำนวณ</h3>
            <div className="space-y-3">
              <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors ${method === 'proportional' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="calc_method" 
                    checked={method === 'proportional'} 
                    onChange={() => setMethod('proportional')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-bold text-gray-800 text-sm">เฉลี่ยตามสัดส่วนราคาป้าย</div>
                    <div className="text-xs text-gray-500 mt-1">ของแพง ต้นทุนแพงกว่า (ยุติธรรมสุด)</div>
                  </div>
                </div>
              </label>

              <label className={`block p-4 rounded-xl border-2 cursor-pointer transition-colors ${method === 'average' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="calc_method" 
                    checked={method === 'average'} 
                    onChange={() => setMethod('average')}
                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-bold text-gray-800 text-sm">เฉลี่ยเท่ากันทุกชิ้น</div>
                    <div className="text-xs text-gray-500 mt-1">หารเท่ากันหมด ไม่สนราคาป้าย</div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 text-slate-100 border-b border-slate-700 pb-2">สรุปต้นทุนจริง</h3>
            
            <div className="space-y-4 mb-6 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>ยอดราคาป้ายรวม:</span>
                <span>฿{totalListPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>จำนวนสินค้าทั้งหมด:</span>
                <span>{totalItemsCount.toLocaleString()} ชิ้น</span>
              </div>
              <div className="flex justify-between text-slate-300 font-medium">
                <span>ยอดจ่ายจริง:</span>
                <span>฿{actualPaidNum.toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">ต้นทุนต่อชิ้น (แยกตามรายการ)</div>
              {items.map(item => {
                const qty = Number(item.quantity) || 0;
                const price = Number(item.price) || 0;
                const sellingPrice = Number(item.sellingPrice) || 0;
                let actualCost = 0;

                if (actualPaidNum > 0 && totalItemsCount > 0) {
                  if (method === 'proportional' && totalListPrice > 0) {
                    actualCost = price * (actualPaidNum / totalListPrice);
                  } else if (method === 'average') {
                    actualCost = actualPaidNum / totalItemsCount;
                  }
                }

                if (qty === 0) return null;

                const profitPerItem = sellingPrice > 0 ? sellingPrice - actualCost : 0;
                const profitMargin = (actualCost > 0 && sellingPrice > 0) ? (profitPerItem / actualCost) * 100 : 0;
                const matchedBag = bags.find(b => b.name === item.name);

                return (
                  <div key={item.id} className="bg-slate-800 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3 items-center truncate pr-2">
                        {matchedBag && matchedBag.image ? (
                          <img src={matchedBag.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center shrink-0">
                            <ImageIcon size={20} className="text-slate-500" />
                          </div>
                        )}
                        <div className="truncate">
                          <div className="text-sm font-bold text-slate-200 truncate">{item.name}</div>
                          <div className="text-xs text-slate-400 mt-1">ป้าย: ฿{price} × {qty} ชิ้น</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-slate-400">ต้นทุนจริง/ชิ้น</div>
                        <div className="font-bold text-emerald-400 text-lg">฿{actualCost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                      </div>
                    </div>

                    {sellingPrice > 0 && (
                      <div className="bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs text-slate-300">ตั้งราคาขาย: <span className="font-bold text-white">฿{sellingPrice}</span></span>
                          <span className="text-xs text-blue-400 font-bold">
                            กำไร {profitMargin.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-400">กำไรสุทธิต่อชิ้น:</span>
                          <span className={`font-bold ${profitPerItem > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {profitPerItem > 0 ? '+' : ''}฿{profitPerItem.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-700 flex justify-end">
                      <button
                        onClick={() => copyPrompt(item, actualCost)}
                        className={`text-xs px-3 py-1.5 rounded-lg flex items-center transition-colors ${copiedId === item.id ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                      >
                        {copiedId === item.id ? (
                          <><CheckCircle2 size={14} className="mr-1.5" /> คัดลอก Prompt แล้ว</>
                        ) : (
                          <><Copy size={14} className="mr-1.5" /> คัดลอก Prompt ปรึกษา AI</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showHistory && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-gray-800 flex items-center">
                <History className="mr-3 text-blue-600" size={28} /> ประวัติการคำนวณ
              </h3>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {savedCalculations.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock size={48} className="mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">ยังไม่มีประวัติการบันทึก</p>
                  <p className="text-sm mt-1">กดปุ่ม "บันทึก" เพื่อบันทึกการคำนวณเก็บไว้ดูภายหลัง</p>
                </div>
              ) : (
                savedCalculations.map(saved => (
                  <div 
                    key={saved.id}
                    onClick={() => loadSaved(saved)}
                    className="p-5 border border-gray-200 rounded-2xl hover:border-blue-300 hover:bg-blue-50/50 transition-all cursor-pointer group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                  >
                    <div>
                      <div className="font-bold text-gray-800 text-lg mb-1 group-hover:text-blue-700 transition-colors">{saved.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-4">
                        <span><Clock size={14} className="inline mr-1" /> {new Date(saved.date).toLocaleString('th-TH')}</span>
                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium">{saved.items.length} รายการ</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                      <div className="text-right flex-1 sm:flex-none">
                        <div className="text-xs text-gray-500">ยอดจ่ายจริง</div>
                        <div className="font-black text-blue-600">฿{(Number(saved.totalPaid)||0).toLocaleString()}</div>
                      </div>
                      <button
                        onClick={(e) => deleteSaved(saved.id, e)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                        title="ลบ"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl border border-gray-100">
            <h3 className="text-2xl font-black text-gray-800 mb-2">บันทึกการคำนวณ</h3>
            <p className="text-sm text-gray-500 mb-6">กรุณาตั้งชื่อเพื่อให้จดจำได้ง่าย</p>
            
            <input
              type="text"
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 mb-6 font-medium text-gray-800"
              placeholder="ชื่อบันทึก..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') setShowSaveModal(false);
              }}
            />
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-colors"
              >
                บันทึก
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="text-red-600" size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-2">ยืนยันการลบประวัติ</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                คุณต้องการลบบันทึกการคำนวณนี้ใช่หรือไม่?
              </p>
              
              <div className="flex w-full space-x-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    setSavedCalculations(savedCalculations.filter(s => s.id !== confirmDeleteId));
                    setConfirmDeleteId(null);
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
                >
                  ลบข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
