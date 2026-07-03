import fs from 'fs';

const path = 'src/components/Settings.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `<input 
              type="file" 
              accept=".json" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isRestoring}
              className="mt-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium rounded-xl transition-colors shadow-sm w-full flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              {isRestoring ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์ Backup'}
            </button>`;

const replacement = `<label className={\`mt-auto px-6 py-3 \${isRestoring ? 'bg-emerald-300' : 'bg-emerald-600 hover:bg-emerald-700 cursor-pointer'} text-white font-medium rounded-xl transition-colors shadow-sm w-full flex items-center justify-center gap-2\`}>
              <Upload size={20} />
              {isRestoring ? 'กำลังอัปโหลด...' : 'อัปโหลดไฟล์ Backup'}
              <input 
                type="file" 
                accept=".json" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleImport}
                disabled={isRestoring}
              />
            </label>`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
