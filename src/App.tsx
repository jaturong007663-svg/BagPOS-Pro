import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { ShoppingBag, LayoutGrid, BarChart3, Package, Wallet, AlertTriangle, Calendar, Settings as SettingsIcon, Calculator, MoreHorizontal, X, ReceiptText } from 'lucide-react';
import { AppProvider, useAppContext } from './AppContext';
import Pos from './components/Pos';
import Inventory from './components/Inventory';
import Dashboard from './components/Dashboard';
import Ledger from './components/Ledger';
import RestockHistory from './components/RestockHistory';
import SalesHistory from './components/SalesHistory';
import Settings from './components/Settings';
import Reconciliation from './components/Reconciliation';

function AppContent() {
  const { user, signIn, logOut } = useAppContext();
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'dashboard' | 'ledger' | 'restock-history' | 'sales-history' | 'reconciliation' | 'settings'>('pos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8 text-center bg-slate-900">
            <ShoppingBag className="text-blue-500 mx-auto mb-4" size={48} />
            <h1 className="text-2xl font-bold text-white mb-2">BagPOS Pro</h1>
            <p className="text-slate-400 text-sm">ระบบจัดการร้านกระเป๋าและสต๊อกสินค้า</p>
          </div>
          <div className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold text-gray-800 mb-2">เข้าสู่ระบบ</h2>
              <p className="text-gray-500 text-sm">กรุณาเข้าสู่ระบบด้วยบัญชี Google ของคุณเพื่อเข้าใช้งาน และป้องกันข้อมูลสูญหาย</p>
            </div>
            <button 
              onClick={signIn}
              className="w-full flex items-center justify-center bg-white border border-gray-300 rounded-xl px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
            >
              <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              เข้าสู่ระบบด้วย Google
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-[100dvh] bg-gray-50 overflow-hidden font-sans text-gray-900">
      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:flex w-64 bg-slate-900 text-slate-300 flex-col shadow-2xl z-20 shrink-0">
        <div className="h-16 flex items-center justify-start px-6 bg-slate-950 border-b border-slate-800">
          <ShoppingBag className="text-blue-500" size={28} />
          <span className="ml-3 font-bold text-lg text-white">BagPOS Pro</span>
        </div>
        <div className="flex items-center px-6 py-4 border-b border-slate-800">
          <img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-8 h-8 rounded-full border border-slate-700" alt="profile" />
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user.displayName || user.email}</p>
            <button onClick={logOut} className="text-xs text-slate-400 hover:text-white transition-colors">ออกจากระบบ</button>
          </div>
        </div>
        
        <div className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
          <NavButton active={activeTab === 'pos'} onClick={() => setActiveTab('pos')} icon={<LayoutGrid className="w-5 h-5" />} label="ขายสินค้า (POS)" />
          <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<BarChart3 className="w-5 h-5" />} label="ภาพรวม / สถิติ" />
          <NavButton active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} icon={<Package className="w-5 h-5" />} label="สต๊อกสินค้า" />
          <NavButton active={activeTab === 'ledger'} onClick={() => setActiveTab('ledger')} icon={<Wallet className="w-5 h-5" />} label="บัญชีรายรับ-รายจ่าย" />
          <NavButton active={activeTab === 'restock-history'} onClick={() => setActiveTab('restock-history')} icon={<Calendar className="w-5 h-5" />} label="ประวัติสั่งซื้อ" />
          <NavButton active={activeTab === 'sales-history'} onClick={() => setActiveTab('sales-history')} icon={<ReceiptText className="w-5 h-5" />} label="ประวัติขาย" />
          <NavButton active={activeTab === 'reconciliation'} onClick={() => setActiveTab('reconciliation')} icon={<Calculator className="w-5 h-5" />} label="คำนวณต้นทุนสินค้า" />
          <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon className="w-5 h-5" />} label="ตั้งค่า / สำรองข้อมูล" />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-0 flex flex-col relative">
        {activeTab === 'pos' && <Pos />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'ledger' && <Ledger />}
        {activeTab === 'restock-history' && <RestockHistory />}
        {activeTab === 'sales-history' && <SalesHistory onEditBill={() => setActiveTab('pos')} />}
        {activeTab === 'reconciliation' && <Reconciliation />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden w-full h-[60px] bg-white border-t border-gray-200 flex justify-around items-center z-40 shrink-0 pb-safe shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)]">
        <MobileNavButton active={activeTab === 'pos'} onClick={() => {setActiveTab('pos'); setIsMobileMenuOpen(false);}} icon={<LayoutGrid />} label="POS" />
        <MobileNavButton active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setIsMobileMenuOpen(false);}} icon={<BarChart3 />} label="สถิติ" />
        <MobileNavButton active={activeTab === 'inventory'} onClick={() => {setActiveTab('inventory'); setIsMobileMenuOpen(false);}} icon={<Package />} label="สต๊อก" />
        <MobileNavButton active={activeTab === 'ledger'} onClick={() => {setActiveTab('ledger'); setIsMobileMenuOpen(false);}} icon={<Wallet />} label="บัญชี" />
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${isMobileMenuOpen ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          {isMobileMenuOpen ? <X size={20} className="mb-1" /> : <MoreHorizontal size={20} className="mb-1" />}
          <span className="text-[10px] font-medium">เพิ่มเติม</span>
        </button>
      </nav>

      {/* Mobile Expanded Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/50 flex flex-col justify-end" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="bg-white rounded-t-2xl mb-16 p-4 animate-in slide-in-from-bottom-4 duration-200 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b pb-4 mb-4"><div className="flex items-center"><img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-10 h-10 rounded-full border border-slate-200" alt="profile" /><div className="ml-3"><p className="text-sm font-bold text-slate-800 truncate">{user.displayName || user.email}</p><p className="text-xs text-slate-500">เข้าสู่ระบบแล้ว</p></div></div><button onClick={logOut} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">ออกจากระบบ</button></div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <ExpandedMenuButton active={activeTab === 'sales-history'} onClick={() => {setActiveTab('sales-history'); setIsMobileMenuOpen(false);}} icon={<ReceiptText />} label="ประวัติขาย" />
              <ExpandedMenuButton active={activeTab === 'restock-history'} onClick={() => {setActiveTab('restock-history'); setIsMobileMenuOpen(false);}} icon={<Calendar />} label="ประวัติสั่งซื้อ" />
              <ExpandedMenuButton active={activeTab === 'reconciliation'} onClick={() => {setActiveTab('reconciliation'); setIsMobileMenuOpen(false);}} icon={<Calculator />} label="คำนวณต้นทุน" />
              <ExpandedMenuButton active={activeTab === 'settings'} onClick={() => {setActiveTab('settings'); setIsMobileMenuOpen(false);}} icon={<SettingsIcon />} label="ตั้งค่า" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-start p-3 md:px-4 rounded-xl transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
          : 'hover:bg-slate-800 hover:text-white text-slate-400'
      }`}
    >
      <div>{icon}</div>
      <span className="ml-3 font-medium">{label}</span>
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
        active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
      }`}
    >
      <div className={`${active ? 'scale-110' : ''} transition-transform duration-200 mb-1`}>
        {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </button>
  );
}

function ExpandedMenuButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-xl border ${
        active ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-100 text-gray-700'
      }`}
    >
      <div className="mb-2 bg-white p-2 rounded-full shadow-sm">{React.cloneElement(icon as React.ReactElement, { size: 24 })}</div>
      <span className="text-[11px] font-medium text-center">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Toaster position="top-center" />
      <AppContent />
    </AppProvider>
  );
}
