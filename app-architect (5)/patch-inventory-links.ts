import fs from 'fs';

const path = 'src/components/Inventory.tsx';
let content = fs.readFileSync(path, 'utf8');

const target1 = `<label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์สินค้า 1 (URL)</label>
                    <input 
                      type="text" 
                      value={editingProduct.productUrl || ''} 
                      onChange={e => setEditingProduct({...editingProduct, productUrl: e.target.value})} 
                      placeholder="https://"
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                    />`;

const replacement1 = `<div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">ลิงก์สินค้า 1 (URL)</label>
                      {editingProduct.productUrl && (
                        <a href={editingProduct.productUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 flex items-center bg-blue-50 px-2 py-0.5 rounded-full">
                          เปิดลิงก์ <ExternalLink size={12} className="ml-1" />
                        </a>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={editingProduct.productUrl || ''} 
                      onChange={e => setEditingProduct({...editingProduct, productUrl: e.target.value})} 
                      placeholder="https://"
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                    />`;

content = content.replace(target1, replacement1);

const target2 = `<label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์สินค้า 2 (URL)</label>
                    <input 
                      type="text" 
                      value={editingProduct.productUrl2 || ''} 
                      onChange={e => setEditingProduct({...editingProduct, productUrl2: e.target.value})} 
                      placeholder="https://"
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                    />`;

const replacement2 = `<div className="flex justify-between items-center mb-1">
                      <label className="block text-sm font-medium text-gray-700">ลิงก์สินค้า 2 (URL)</label>
                      {editingProduct.productUrl2 && (
                        <a href={editingProduct.productUrl2} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center bg-indigo-50 px-2 py-0.5 rounded-full">
                          เปิดลิงก์ <ExternalLink size={12} className="ml-1" />
                        </a>
                      )}
                    </div>
                    <input 
                      type="text" 
                      value={editingProduct.productUrl2 || ''} 
                      onChange={e => setEditingProduct({...editingProduct, productUrl2: e.target.value})} 
                      placeholder="https://"
                      className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                    />`;

content = content.replace(target2, replacement2);

fs.writeFileSync(path, content);
