import React, { useState, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { TrendingUp, Package, DollarSign, Activity, Calendar, Filter } from 'lucide-react';
import { MARKETS } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { format, parseISO, endOfWeek, isWithinInterval } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6666'];

export default function Dashboard() {
  const { bags, transactions, claims, shippings, restocks } = useAppContext();
  
  const [filterType, setFilterType] = useState<'day' | 'week' | 'month' | 'year' | 'custom'>('day');
  const [selectedDayStr, setSelectedDayStr] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [selectedWeekStr, setSelectedWeekStr] = useState(() => format(new Date(), "yyyy-'W'II"));
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customDate, setCustomDate] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.map(t => {
      if (filterCategory === 'all') return t;
      
      const filteredItems = t.items.filter(item => {
        const product = bags.find(b => b.id === item.productId);
        const cat = product?.category || 'กระเป๋า';
        return cat === filterCategory;
      });
      
      if (filteredItems.length === t.items.length) return t;
      
      const originalGross = t.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const filteredGross = filteredItems.reduce((sum, item) => sum + (item.price * item.qty), 0);
      const discountRatio = originalGross > 0 ? filteredGross / originalGross : 0;
      const discountAmount = (t.discount || 0) * discountRatio;
      
      return {
        ...t,
        items: filteredItems,
        total: filteredGross - discountAmount
      };
    }).filter(t => {
      if (t.items.length === 0) return false;
      
      const date = new Date(t.date);
      if (filterType === 'day') {
        const dayDate = parseISO(selectedDayStr);
        return date.getDate() === dayDate.getDate() && date.getMonth() === dayDate.getMonth() && date.getFullYear() === dayDate.getFullYear();
      } else if (filterType === 'week') {
        const weekDate = parseISO(selectedWeekStr);
        const end = endOfWeek(weekDate, { weekStartsOn: 1 }); // ISO week starts on Monday
        // add time to the end of the day
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
  }, [transactions, filterType, selectedDayStr, selectedWeekStr, selectedMonth, selectedYear, customDate, filterCategory, bags]);

  const totalSales = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const totalProfit = filteredTransactions.reduce((sum, t) => {
    const cost = t.items.reduce((itemSum, item) => {
      const product = bags.find(b => b.id === item.productId);
      return itemSum + ((product?.cost || 0) * item.qty);
    }, 0);
    return sum + (t.total - cost);
  }, 0);

  const totalItemsSold = filteredTransactions.reduce((sum, t) => 
    sum + t.items.reduce((itemSum: number, item: any) => itemSum + item.qty, 0)
  , 0);

  const filteredBags = useMemo(() => {
    if (filterCategory === 'all') return bags;
    return bags.filter(bag => (bag.category || 'กระเป๋า') === filterCategory);
  }, [bags, filterCategory]);

  const totalStock = filteredBags.reduce((sum, bag) => 
    sum + (bag.variants?.reduce((vSum: number, v: any) => vSum + (v.stock || 0), 0) || 0)
  , 0);

  // --- Chart Data Preparation ---

  // 1. Sales Trend Data
  const salesTrendData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      let label = '';
      if (filterType === 'day' || filterType === 'custom') {
        label = date.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit' });
      } else if (filterType === 'week') {
        label = date.toLocaleString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' });
      } else if (filterType === 'month') {
        label = `${date.getDate()} ${date.toLocaleString('th-TH', { month: 'short' })}`;
      } else {
        label = date.toLocaleString('th-TH', { month: 'short' });
      }
      
      dataMap[label] = (dataMap[label] || 0) + t.total;
    });

    // If day, sort by hour. Otherwise it's probably sorted by date insertion but let's keep it simple
    let sortedData = Object.keys(dataMap).map(key => ({
      name: key,
      'ยอดขาย': dataMap[key]
    }));
    
    if (filterType === 'day' || filterType === 'custom') {
      sortedData = sortedData.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return sortedData;
  }, [filteredTransactions, filterType]);

  // 2. Best Selling Products
  const bestSellingProducts = useMemo(() => {
    const productSales: Record<string, { id: string, name: string, image: string, qty: number, revenue: number }> = {};
    filteredTransactions.forEach(t => {
      t.items.forEach(item => {
        const product = bags.find(b => b.id === item.productId);
        const name = product ? product.name : 'ไม่ทราบชื่อ';
        const image = product?.image || 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80';
        if (!productSales[item.productId]) {
          productSales[item.productId] = { id: item.productId, name, image, qty: 0, revenue: 0 };
        }
        productSales[item.productId].qty += item.qty;
        productSales[item.productId].revenue += item.price * item.qty;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 10);
  }, [filteredTransactions, bags]);

  // 3. Best Selling Markets/Days
  const marketSales = useMemo(() => {
    const mSales: Record<string, { name: string, value: number }> = {};
    filteredTransactions.forEach(t => {
      const market = MARKETS.find(m => m.id === t.marketId);
      const mName = market ? market.name : 'ไม่ระบุ';
      if (!mSales[mName]) {
        mSales[mName] = { name: mName, value: 0 };
      }
      mSales[mName].value += t.total;
    });
    return Object.values(mSales).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);


  const stats = [
    { label: 'ยอดขายรวม', value: `฿${totalSales.toLocaleString()}`, icon: DollarSign, color: 'bg-blue-500', trend: 'จากช่วงเวลาที่เลือก' },
    { label: 'กำไรรวม', value: `฿${totalProfit.toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-500', trend: 'จากช่วงเวลาที่เลือก' },
    { label: 'จำนวนที่ขายได้', value: `${totalItemsSold} ชิ้น`, icon: Activity, color: 'bg-purple-500', trend: 'จากช่วงเวลาที่เลือก' },
    { label: 'สต๊อกคงเหลือทั้งหมด', value: `${totalStock} ชิ้น`, icon: Package, color: 'bg-orange-500', trend: 'ปัจจุบัน' },
  ];

  const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-4 md:p-6 h-full overflow-y-auto bg-gray-50 pb-24 lg:pb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-gray-800">ภาพรวมสถิติ (Dashboard)</h2>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <Filter size={18} className="text-gray-500 ml-2" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="p-1.5 border-none bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer"
            >
              <option value="all">ทุกหมวดหมู่</option>
              <option value="กระเป๋า">กระเป๋า</option>
              <option value="พวงกุญแจตุ๊กตา">พวงกุญแจ</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm">
            <Calendar size={18} className="text-gray-500 ml-2" />
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
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
          )}

          {(filterType === 'month' || filterType === 'year') && (
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="p-1.5 border-l border-gray-200 bg-transparent outline-none text-sm font-medium text-gray-700 cursor-pointer pl-3"
            >
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-gray-900">{stat.value}</h3>
              <p className="text-xs text-gray-400 mt-2 font-medium bg-gray-50 w-max px-2 py-0.5 rounded-md">{stat.trend}</p>
            </div>
            <div className={`${stat.color} p-4 rounded-xl text-white shadow-lg`}>
              <stat.icon size={32} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Sales Trend Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">แนวโน้มยอดขาย</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesTrendData} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 12}} tickFormatter={(value) => `฿${value.toLocaleString()}`} dx={-10} />
                <Tooltip 
                  formatter={(value: number) => [`฿${value.toLocaleString()}`, 'ยอดขาย']}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="ยอดขาย" stroke="#3b82f6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Selling Markets */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">สัดส่วนยอดขายตามตลาด/วัน</h3>
          <div className="h-80 w-full flex items-center justify-center">
            {marketSales.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketSales}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {marketSales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `฿${value.toLocaleString()}`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400">ไม่มีข้อมูลการขายในช่วงเวลานี้</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Best Selling Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[460px]">
          <h3 className="text-lg font-bold text-gray-800 mb-4">10 อันดับสินค้าขายดี (ตามจำนวนชิ้น)</h3>
          <div className="overflow-y-auto flex-1 pr-2 space-y-4">
            {bestSellingProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-gray-200">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  <div className="absolute top-0 left-0 bg-gray-900/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-br-lg">
                    #{index + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 truncate">{product.name}</h4>
                  <p className="text-xs text-gray-500 mt-1">ยอดขายสุทธิ: <span className="font-semibold text-emerald-600">฿{product.revenue.toLocaleString()}</span></p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-gray-900 bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                    {product.qty} ชิ้น
                  </div>
                </div>
              </div>
            ))}
            {bestSellingProducts.length === 0 && (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                ไม่มีข้อมูลสินค้าขายดี
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-[460px]">
          <h3 className="text-lg font-bold text-gray-800 mb-4">รายการขายล่าสุด (ในรอบที่เลือก)</h3>
          <div className="overflow-y-auto overflow-x-auto flex-1 pr-2">
            <table className="w-full text-left whitespace-nowrap min-w-[400px]">
              <thead className="sticky top-0 bg-white shadow-sm z-10">
                <tr className="text-sm text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium bg-white">ตลาด</th>
                  <th className="pb-3 font-medium bg-white">เวลา</th>
                  <th className="pb-3 font-medium bg-white">ยอดรวม</th>
                  <th className="pb-3 font-medium bg-white">กำไร</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredTransactions.slice(0, 10).map(t => {
                  const tCost = t.items.reduce((itemSum, item) => {
                    const product = bags.find(b => b.id === item.productId);
                    return itemSum + ((product?.cost || 0) * item.qty);
                  }, 0);
                  const tProfit = t.total - tCost;
                  const market = MARKETS.find(m => m.id === t.marketId);
                  const marketName = market ? market.name : 'ไม่ระบุ';
                  return (
                  <tr key={t.id} className="text-sm hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-gray-500">
                      <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">{marketName}</span>
                    </td>
                    <td className="py-3 text-gray-500">{new Date(t.date).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}</td>
                    <td className="py-3 text-gray-900 font-bold">฿{t.total.toLocaleString()}</td>
                    <td className="py-3 text-emerald-600 font-bold">฿{tProfit.toLocaleString()}</td>
                  </tr>
                  );
                })}
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-400">ไม่มีข้อมูลการขาย</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

