import fs from 'fs';

const path = 'src/components/SalesHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmEditTx, setConfirmEditTx] = useState<Transaction | null>(null);
    
  // Sort transactions by date (newest first)
  const { setCart } = useAppContext();
  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());`;

const replacement1 = `  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
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
    return \`\${date.getFullYear()}-W\${weekNumber.toString().padStart(2, '0')}\`;
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
        const dateStr = \`\${y}-\${m}-\${d}\`;
        return dateStr === customDate;
      }
      return true;
  });

  const { setCart } = useAppContext();
  const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  const years = Array.from({length: 5}, (_, i) => new Date().getFullYear() - i);`;

content = content.replace(target1, replacement1);


const target2 = `      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center flex-wrap">
          <ReceiptText className="mr-2 md:mr-3 text-emerald-600 shrink-0" size={28} />
          <span className="truncate">ประวัติการขาย</span>
        </h2>`;

const replacement2 = `      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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
        </div>`;

content = content.replace(target2, replacement2);


const target3 = `        <div className="text-center text-gray-400 bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-200">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
          <p>ยังไม่มีประวัติการขาย</p>
        </div>`;
const replacement3 = `        <div className="text-center text-gray-400 bg-white p-12 rounded-2xl shadow-sm border border-dashed border-gray-200">
          <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
          <p>ยังไม่มีประวัติการขายในระยะเวลานี้</p>
        </div>`;
content = content.replace(target3, replacement3);

fs.writeFileSync(path, content);
