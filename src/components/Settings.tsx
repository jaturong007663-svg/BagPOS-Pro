import React, { useRef, useState } from 'react';
import { Download, Upload, Database, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../AppContext';
import { db } from '../lib/firebase';
import { collection, doc, writeBatch } from 'firebase/firestore';

export default function Settings() {
  const { user, bags, transactions, claims, expenses, shippings, chinaStores, restocks } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const handleExport = () => {
    const data = {
      bags,
      transactions,
      claims,
      expenses,
      shippings,
      chinaStores,
      restocks
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `bagpos_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const result = event.target?.result as string;
                const data = JSON.parse(result);
        
        if (data) {
          setIsRestoring(true);
          
          let count = 0;
          let batch = writeBatch(db);
          let opCount = 0;
          
          const commitBatchIfNeeded = async () => {
             if (opCount >= 450) {
                 await batch.commit();
                 batch = writeBatch(db);
                 opCount = 0;
             }
          };

          // Helper to add items to batch
          const addToBatch = async (items: any[], colName: string) => {
            if (Array.isArray(items)) {
              for (const item of items) {
                if (item && item.id) {
                  const ref = doc(db, 'users', user?.uid || 'temp', colName, String(item.id));
                  batch.set(ref, item);
                  count++;
                  opCount++;
                  await commitBatchIfNeeded();
                }
              }
            }
          };

          // Handle potentially nested data like localStorage dumps
          const actualData = data.bags ? data : (data.state ? data.state : data);

          await addToBatch(actualData.bags || [], 'bags');
          await addToBatch(actualData.transactions || [], 'transactions');
          await addToBatch(actualData.claims || [], 'claims');
          await addToBatch(actualData.expenses || [], 'expenses');
          await addToBatch(actualData.shippings || [], 'shippings');
          await addToBatch(actualData.chinaStores || actualData.stores || [], 'stores');
          await addToBatch(actualData.restocks || actualData.restockOrders || [], 'restockOrders');

          if (count > 0) {
            if (opCount > 0) {
               await batch.commit();
            }
            setAlertMsg(`นำเข้าข้อมูลสำเร็จ ${count} รายการ`);
          } else {
            setAlertMsg('ไม่พบข้อมูลที่จะนำเข้าในไฟล์นี้ หรือไฟล์ไม่ถูกต้อง');
          }
        }
      } catch (error: any) {
        setAlertMsg('เกิดข้อผิดพลาดในการนำเข้าข้อมูล: ' + (error?.message || 'ไฟล์เสียหาย'));
        console.error(error);
      } finally {
        setIsRestoring(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = async () => {
    setAlertMsg('เพื่อความปลอดภัย การลบข้อมูลทั้งหมด โปรดดำเนินการลบผ่าน Firebase Console');
  };

  return (
    <div className="h-full bg-slate-50 p-6 md:p-8 overflow-y-auto pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-800">ตั้งค่าและสำรองข้อมูล</h1>
          <p className="text-slate-500 mt-2">จัดการการสำรองข้อมูล (Backup) และการกู้คืนข้อมูล (Restore) ไปยังระบบ Cloud</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Backup Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Download size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">สำรองข้อมูล (Export)</h3>
            <p className="text-slate-500 mb-6 text-sm">
              ดาวน์โหลดข้อมูลทั้งหมดในระบบ Cloud ให้อยู่ในรูปแบบไฟล์ .json เพื่อเก็บไว้เป็นข้อมูลสำรอง
            </p>
            <button
              onClick={handleExport}
              disabled={isRestoring}
              className="mt-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium rounded-xl transition-colors shadow-sm w-full flex items-center justify-center gap-2"
            >
              <Download size={20} />
              ดาวน์โหลดไฟล์ Backup
            </button>
          </div>

          {/* Restore Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
              <Upload size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">นำเข้าข้อมูล (Import)</h3>
            <p className="text-slate-500 mb-6 text-sm">
              อัปโหลดไฟล์ .json ที่เคยสำรองไว้ขึ้นสู่ระบบ Cloud (ข้อมูลจะถูกบันทึก/เขียนทับตาม ID)
            </p>
            <label className={`mt-auto px-6 py-3 ${isRestoring ? 'bg-emerald-300' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'} text-white font-medium rounded-xl transition-colors shadow-sm w-full flex items-center justify-center gap-2`}>
              <Upload size={20} />
              {isRestoring ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์ Backup'}
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImport}
                disabled={isRestoring}
              />
            </label>
          </div>

        </div>

        {/* Alert Modal */}
        {alertMsg && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">แจ้งเตือน</h3>
              <p className="text-gray-600 mb-6">{alertMsg}</p>
              <button onClick={() => setAlertMsg(null)} className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium">ตกลง</button>
            </div>
          </div>
        )}
        
        {/* Danger Zone */}
        <div className="mt-12 bg-red-50 p-6 rounded-2xl border border-red-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800">พื้นที่อันตราย (Danger Zone)</h3>
              <p className="text-red-600/80 text-sm mt-1 mb-4">
                การล้างข้อมูลจะลบข้อมูลทั้งหมดออกจากระบบ โปรดทำการสำรองข้อมูลก่อนเสมอ (สำหรับ Cloud Database จะถูกจำกัดการลบทั้งหมดผ่านปุ่มนี้)
              </p>
              <button
                onClick={handleClearData}
                disabled={isRestoring}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium rounded-lg transition-colors text-sm"
              >
                ล้างข้อมูลทั้งหมดในระบบ
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
