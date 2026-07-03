import fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Find the start of Mobile Expanded Menu
content = content.replace(
  '<h3 className="text-lg font-bold mb-4 text-gray-800 border-b pb-2">เมนูเพิ่มเติม</h3>',
  '<div className="flex items-center justify-between border-b pb-4 mb-4"><div className="flex items-center"><img src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}`} className="w-10 h-10 rounded-full border border-slate-200" alt="profile" /><div className="ml-3"><p className="text-sm font-bold text-slate-800 truncate">{user.displayName || user.email}</p><p className="text-xs text-slate-500">เข้าสู่ระบบแล้ว</p></div></div><button onClick={logOut} className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors">ออกจากระบบ</button></div>'
);

fs.writeFileSync('src/App.tsx', content);
