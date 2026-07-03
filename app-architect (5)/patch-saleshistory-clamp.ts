import fs from 'fs';

const path = 'src/components/SalesHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<div className="font-medium text-gray-800 text-sm">{item.name}</div>',
  '<div className="font-medium text-gray-800 text-sm line-clamp-2">{item.name}</div>'
);

content = content.replace(
  '<div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">',
  '<div className="flex flex-row items-center gap-2 sm:gap-3 shrink-0">'
);

fs.writeFileSync(path, content);
