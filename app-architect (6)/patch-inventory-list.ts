import fs from 'fs';

const path = 'src/components/Inventory.tsx';
let content = fs.readFileSync(path, 'utf8');

const tableStart = '<div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">';
const tableEnd = '          </table>\n        </div>';

const tableStartIdx = content.indexOf(tableStart);
const tableEndIdx = content.indexOf(tableEnd) + tableEnd.length;

if (tableStartIdx !== -1 && tableEndIdx !== -1) {
  console.log("Found table bounds");
}
