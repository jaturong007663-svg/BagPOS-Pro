import fs from 'fs';

const path = 'src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

// Change the root div to flex-col on mobile, flex-row on desktop
content = content.replace(
  '<div className="flex h-[100dvh] bg-gray-50 overflow-hidden font-sans text-gray-900">',
  '<div className="flex flex-col lg:flex-row h-[100dvh] bg-gray-50 overflow-hidden font-sans text-gray-900">'
);

// Remove relative and pb-16 from main
content = content.replace(
  '<main className="flex-1 overflow-hidden p-0 flex flex-col relative pb-16 lg:pb-0">',
  '<main className="flex-1 overflow-hidden p-0 flex flex-col relative">'
);

// Change mobile nav to not be fixed
content = content.replace(
  '<nav className="lg:hidden fixed bottom-0 w-full h-16 bg-white border-t border-gray-200 flex justify-around items-center z-40 pb-safe shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)]">',
  '<nav className="lg:hidden w-full h-[60px] bg-white border-t border-gray-200 flex justify-around items-center z-40 shrink-0 pb-safe shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.1)]">'
);

fs.writeFileSync(path, content);
