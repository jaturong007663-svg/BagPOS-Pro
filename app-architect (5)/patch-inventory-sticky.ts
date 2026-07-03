import fs from 'fs';

const path = 'src/components/Inventory.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = '<div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">';

const replacement1 = `<div className="sticky top-0 z-10 bg-gray-50 pt-2 pb-2 -mx-4 px-4 lg:-mx-6 lg:px-6 shadow-[0_4px_10px_-4px_rgba(0,0,0,0.05)] border-b border-gray-100 mb-4">
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">`;

content = content.replace(target1, replacement1);

const target2 = `          <button 
            onClick={() => setViewMode('grid')}
            className={\`px-4 py-2 flex items-center justify-center transition-colors \${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}\`}
          >
            <Grid size={20} />
          </button>
        </div>
      </div>`;

const replacement2 = `          <button 
            onClick={() => setViewMode('grid')}
            className={\`px-4 py-2 flex items-center justify-center transition-colors \${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}\`}
          >
            <Grid size={20} />
          </button>
        </div>
      </div>
      </div>`;

content = content.replace(target2, replacement2);

fs.writeFileSync(path, content);
