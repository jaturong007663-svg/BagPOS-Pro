import React, { useState, useEffect } from 'react';
import { ShoppingBag, LayoutGrid, BarChart3, Package, Wallet, AlertTriangle, Calendar, Settings as SettingsIcon, Calculator } from 'lucide-react';
import { AppProvider } from './AppContext';
import Pos from './components/Pos';
import Inventory from './components/Inventory';
import Dashboard from './components/Dashboard';
import Ledger from './components/Ledger';
import RestockHistory from './components/RestockHistory';
import Settings from './components/Settings';
import Reconciliation from './components/Reconciliation';

function AppContent() {
  const [activeTab, setActiveTab] = useState<'pos' | 'inventory' | 'dashboard' | 'ledger' | 'restock-history' | 'reconciliation' | 'settings'>('pos');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      {/* Sidebar Navigation */}
      <nav className="w-16 md:w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-20 shrink-0">
        <div className="h-16 flex items-center justify-center md:justify-start md:px-6 bg-slate-950 border-b border-slate-800">
          <ShoppingBag className="text-blue-500" size={28} />
          <span className="hidden md:block ml-3 font-bold text-lg text-white">BagPOS Pro</span>
        </div>
        
        <div className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
          <NavButton 
            active={activeTab === 'pos'} 
            onClick={() => setActiveTab('pos')} 
            icon={<LayoutGrid className="w-5 h-5" />} 
            label="ขายสินค้า (POS)" 
          />
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<BarChart3 className="w-5 h-5" />} 
            label="ภาพรวม / สถิติ" 
          />
          <NavButton 
            active={activeTab === 'inventory'} 
            onClick={() => setActiveTab('inventory')} 
            icon={<Package className="w-5 h-5" />} 
            label="สต๊อกสินค้า" 
          />
          <NavButton 
            active={activeTab === 'ledger'} 
            onClick={() => setActiveTab('ledger')} 
            icon={<Wallet className="w-5 h-5" />} 
            label="บัญชีรายรับ-รายจ่าย" 
          />
          <NavButton 
            active={activeTab === 'restock-history'} 
            onClick={() => setActiveTab('restock-history')} 
            icon={<Calendar className="w-5 h-5" />} 
            label="ประวัติการสั่งซื้อ" 
          />
          <NavButton 
            active={activeTab === 'reconciliation'} 
            onClick={() => setActiveTab('reconciliation')} 
            icon={<Calculator className="w-5 h-5" />} 
            label="คำนวณต้นทุนสินค้า" 
          />
          <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            icon={<SettingsIcon className="w-5 h-5" />} 
            label="สำรองข้อมูล (ตั้งค่า)" 
          />
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-0 flex flex-col relative">
        {activeTab === 'pos' && <Pos />}
        {activeTab === 'inventory' && <Inventory />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'ledger' && <Ledger />}
        {activeTab === 'restock-history' && <RestockHistory />}
        {activeTab === 'reconciliation' && <Reconciliation />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-center md:justify-start p-3 md:px-4 rounded-xl transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
          : 'hover:bg-slate-800 hover:text-white text-slate-400'
      }`}
    >
      <div className={`${active ? '' : ''}`}>
        {icon}
      </div>
      <span className="hidden md:block ml-3 font-medium">{label}</span>
    </button>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
