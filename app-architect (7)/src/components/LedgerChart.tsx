import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { th } from 'date-fns/locale';

interface LedgerChartProps {
  transactions: any[];
  restocks: any[];
  expenses: any[];
  bags: any[];
  forcePeriod?: 'day' | 'week' | 'month' | 'year';
}

type Period = 'day' | 'week' | 'month' | 'year';

export default function LedgerChart({ transactions, restocks, expenses, bags, forcePeriod }: LedgerChartProps) {
  const [period, setPeriod] = useState<Period>(forcePeriod || 'day');

  useEffect(() => {
    if (forcePeriod) {
      // Automatically adjust chart detail level based on filter scope
      // If we are viewing a specific month, 'day' period makes sense to see trends.
      // If we view 'year', 'month' period makes sense.
      if (forcePeriod === 'year') setPeriod('month');
      else if (forcePeriod === 'month') setPeriod('day');
      else if (forcePeriod === 'week') setPeriod('day');
      else setPeriod('day');
    }
  }, [forcePeriod]);
  
  const chartData = useMemo(() => {
    const allDates = new Set<string>();
    transactions.forEach(t => allDates.add(t.date.split('T')[0]));
    restocks.forEach(r => allDates.add(r.date.split('T')[0]));
    expenses.forEach(e => allDates.add(e.date));

    if (allDates.size === 0) return [];
    
    const sortedDates = Array.from(allDates).sort();
    
    const aggregated: Record<string, any> = {};
    
    const getGroupKey = (dateStr: string) => {
        const d = new Date(dateStr);
        if (period === 'day') return format(d, 'dd MMM', { locale: th });
        if (period === 'week') {
            const start = startOfWeek(d, { weekStartsOn: 1 });
            return format(start, 'dd MMM', { locale: th }) + '-' + format(endOfWeek(d, { weekStartsOn: 1 }), 'dd MMM', { locale: th });
        }
        if (period === 'month') return format(d, 'MMM yy', { locale: th });
        if (period === 'year') return format(d, 'yyyy', { locale: th });
        return dateStr;
    };
    
    sortedDates.forEach(dateStr => {
        const key = getGroupKey(dateStr);
        if (!aggregated[key]) {
            aggregated[key] = {
                name: key,
                sales: 0,
                cost: 0,
                expense: 0,
                restock: 0,
                outflow: 0,
                netProfit: 0,
                netCashFlow: 0,
                rawDate: new Date(dateStr)
            };
        }
    });
    
    transactions.forEach(t => {
        const dateStr = t.date.split('T')[0];
        const key = getGroupKey(dateStr);
        if (aggregated[key]) {
            aggregated[key].sales += t.total;
            const cogs = t.items.reduce((itemSum: number, item: any) => {
                const product = bags.find((p: any) => p.id === item.productId);
                return itemSum + ((product?.cost || 0) * item.qty);
            }, 0);
            aggregated[key].cost += cogs;
        }
    });
    
    expenses.forEach(e => {
        const key = getGroupKey(e.date);
        if (aggregated[key]) {
            const expTotal = Number(e.rent || 0) + Number(e.utilities || 0) + Number(e.wages || 0) + Number(e.other || 0);
            aggregated[key].expense += expTotal;
        }
    });
    
    restocks.forEach(r => {
        const dateStr = r.date.split('T')[0];
        const key = getGroupKey(dateStr);
        if (aggregated[key]) {
            aggregated[key].restock += (r.totalCost || 0);
        }
    });
    
    return Object.values(aggregated).sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime()).map(item => {
        item.outflow = item.expense + item.restock;
        item.netProfit = item.sales - item.cost - item.expense;
        item.netCashFlow = item.sales - item.expense - item.restock;
        return item;
    });

  }, [period, transactions, restocks, expenses, bags]);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
        <h3 className="font-bold text-gray-800 text-lg">📈 กราฟกระแสเงินสด (Cash Flow Trend)</h3>
        <div className="flex space-x-2 mt-4 sm:mt-0 bg-gray-100 p-1 rounded-lg">
          {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${period === p ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {p === 'day' && 'รายวัน'}
              {p === 'week' && 'สัปดาห์'}
              {p === 'month' && 'เดือน'}
              {p === 'year' && 'ปี'}
            </button>
          ))}
        </div>
      </div>
      
      {chartData.length > 0 ? (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
              <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(val) => `฿${val.toLocaleString()}`} />
              <Tooltip 
                formatter={(value: number, name: string) => [`฿${value.toLocaleString()}`, name]}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar yAxisId="left" dataKey="sales" name="ยอดขาย (รายรับ)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar yAxisId="left" dataKey="outflow" name="รายจ่าย + เติมสต๊อก" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={24} />
              <Line yAxisId="left" type="monotone" dataKey="netCashFlow" name="กระแสเงินสดสุทธิ" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          ไม่มีข้อมูลสำหรับแสดงกราฟในช่วงเวลาที่เลือก
        </div>
      )}
    </div>
  );
}
