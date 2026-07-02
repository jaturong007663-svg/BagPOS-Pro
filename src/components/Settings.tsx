import React, { useRef } from 'react';
import { Download, Upload, Database, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../AppContext';

export default function Settings() {
  const { bags, transactions, claims, expenses, shippings, chinaStores, restocks } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const data = JSON.parse(result);
        
        if (window.confirm('คุณต้องการนำเข้าข้อมูลนี้หรือไม่? ข้อมูลปัจจุบันทั้งหมดจะถูกเขียนทับ!')) {
          if (data.bags) localStorage.setItem('pos_bags', JSON.stringify(data.bags));
          if (data.transactions) localStorage.setItem('pos_transactions', JSON.stringify(data.transactions));
          if (data.claims) localStorage.setItem('pos_claims', JSON.stringify(data.claims));
          if (data.expenses) localStorage.setItem('pos_expenses', JSON.stringify(data.expenses));
          if (data.shippings) localStorage.setItem('pos_shippings', JSON.stringify(data.shippings));
          if (data.chinaStores) localStorage.setItem('pos_chinaStores', JSON.stringify(data.chinaStores));
          if (data.restocks) localStorage.setItem('pos_restocks', JSON.stringify(data.restocks));
          
          alert('นำเข้าข้อมูลสำเร็จ กรุณารีเฟรชหน้าเว็บเพื่อดูข้อมูลใหม่');
          window.location.reload();
        }
      } catch (error) {
        alert('ไฟล์ไม่ถูกต้อง หรือ ข้อมูลเสียหาย');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    if (window.confirm('คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูล "ทั้งหมด"? การกระทำนี้ไม่สามารถย้อนกลับได้!')) {
      if (window.prompt('พิมพ์คำว่า "CONFIRM" เพื่อยืนยันการลบข้อมูลทั้งหมด') === 'CONFIRM') {
        localStorage.clear();
        alert('ล้างข้อมูลสำเร็จแล้ว');
        window.location.reload();
      }
    }
  };

  return (
    <div className="h-full bg-slate-50 p-6 md:p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-800">ตั้งค่าและสำรองข้อมูล</h1>
          <p className="text-slate-500 mt-2">จัดการการสำรองข้อมูล (Backup) และการกู้คืนข้อมูล (Restore)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Backup Section */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <Download size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">สำรองข้อมูล (Export)</h3>
            <p className="text-slate-500 mb-6 text-sm">
              ดาวน์โหลดข้อมูลทั้งหมดในระบบ เช่น สต๊อกสินค้า ประวัติการขาย และบัญชี ให้อยู่ในรูปแบบไฟล์ .json เพื่อเก็บไว้เป็นข้อมูลสำรอง
            </p>
            <button
              onClick={handleExport}
              className="mt-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition-colors shadow-sm w-full flex items-center justify-center gap-2"
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
              กู้คืนข้อมูลจากไฟล์ .json ที่เคยสำรองไว้ <br/> <span className="text-red-500 font-medium">คำเตือน: ข้อมูลปัจจุบันจะถูกเขียนทับทั้งหมด</span>
            </p>
            <input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors shadow-sm w-full flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              อัปโหลดไฟล์ Backup
            </button>
          </div>

        </div>

        {/* Danger Zone */}
        <div className="mt-12 bg-red-50 p-6 rounded-2xl border border-red-100">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl shrink-0">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-800">พื้นที่อันตราย (Danger Zone)</h3>
              <p className="text-red-600/80 text-sm mt-1 mb-4">
                การล้างข้อมูลจะลบข้อมูลทั้งหมดในระบบ รวมถึงสต๊อกสินค้า ประวัติการขาย และบัญชี ออกจากเบราว์เซอร์นี้อย่างถาวร โปรดทำการสำรองข้อมูลก่อนเสมอ
              </p>
              <button
                onClick={handleClearData}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors text-sm"
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
