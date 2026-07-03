import fs from 'fs';

const path = 'src/components/SalesHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  '<div className="flex flex-row items-center gap-2 sm:gap-3 shrink-0">',
  '<div className="flex flex-wrap justify-end items-center gap-2 sm:gap-3 shrink-0 mt-3 md:mt-0">'
);

fs.writeFileSync(path, content);
