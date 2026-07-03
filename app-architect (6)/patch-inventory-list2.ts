import fs from 'fs';

const path = 'src/components/Inventory.tsx';
let content = fs.readFileSync(path, 'utf8');

const tableStart = '<div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">';
const tableEnd = '          </table>\n        </div>';

const tableStartIdx = content.indexOf(tableStart);
const tableEndIdx = content.indexOf(tableEnd) + tableEnd.length;

const originalTable = content.substring(tableStartIdx, tableEndIdx);

const stackListHtml = `
        <>
        <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left min-w-[800px] whitespace-nowrap">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 font-semibold text-gray-600">รูป/ชื่อสินค้า</th>
                <th className="p-4 font-semibold text-gray-600">ราคา</th>
                <th className="p-4 font-semibold text-gray-600">สต๊อกรวม</th>
                <th className="p-4 font-semibold text-gray-600">รายละเอียดสี</th>
                <th className="p-4 font-semibold text-gray-600 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bags.filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesCategory = filterCategory === 'all' || (p.category || 'กระเป๋า') === filterCategory;
                return matchesSearch && matchesCategory;
              }).map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-4 flex items-center space-x-3">
                    {p.image ? (
                      <img 
                        src={p.image} 
                        className="w-12 h-12 rounded-md object-cover cursor-pointer hover:opacity-80 transition-opacity border border-gray-200 shadow-sm" 
                        onClick={() => { setViewingImageProduct(p); setCurrentImageIndex(0); }}
                        alt={p.name}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                        <ImageIcon size={20} className="text-gray-400" />
                      </div>
                    )}
                    <div>
                      <span className="font-medium text-gray-800 block whitespace-normal min-w-[150px] max-w-[250px]">
                        {p.name}
                        {p.productUrl && (
                          <a href={p.productUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:underline text-xs inline-block">
                            (ลิ้งค์ 1)
                          </a>
                        )}
                        {p.productUrl2 && (
                          <a href={p.productUrl2} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-500 hover:underline text-xs inline-block">
                            (ลิ้งค์ 2)
                          </a>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        ต้นทุน: ฿{p.cost || 0}
                        {p.storeId && \` | ร้าน: \${p.storeId}\`}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-700">฿{p.price}</td>
                  <td className="p-4">
                    <span className="bg-blue-100 text-blue-800 py-1 px-3 rounded-full text-sm font-medium">
                      {p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {p.variants?.map(v => (
                        <div key={v.id} className="text-xs border border-gray-200 bg-white px-2 py-1 rounded text-gray-600 shadow-sm flex items-center justify-between mb-1 w-max min-w-[120px]">
                          <div className="flex items-center">
                            {v.imageUrl && (
                              <img 
                                src={v.imageUrl} 
                                className="w-6 h-6 rounded-full object-cover mr-2 cursor-pointer hover:opacity-80 border border-gray-200" 
                                onClick={() => { 
                                  setViewingImageProduct(p); 
                                  const imgs = computeAllImages(p);
                                  const idx = imgs.indexOf(v.imageUrl!);
                                  setCurrentImageIndex(idx >= 0 ? idx : 0); 
                                }}
                                alt={v.color}
                              />
                            )}
                            <span>{v.color} ({v.stock})</span>
                          </div>
                          <button 
                            onClick={() => setBarcodeModal({ id: v.id, name: p.name, color: v.color, price: p.price })}
                            className="ml-3 text-indigo-500 hover:text-indigo-700 bg-indigo-50 p-1 rounded transition-colors"
                          >
                            <Scan size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleEditToRestock(p)}
                        className="text-indigo-500 hover:text-indigo-700 p-2 rounded-lg hover:bg-indigo-50 transition-colors inline-flex items-center justify-center"
                        title="เพิ่มสต๊อกจากสินค้านี้"
                      >
                        <PackagePlus size={18} />
                      </button>
                      <button 
                        onClick={() => setEditingProduct(p)}
                        className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center justify-center"
                        title="แก้ไขข้อมูลสินค้า"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors inline-flex items-center justify-center"
                        title="ลบสินค้า"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="lg:hidden space-y-4">
          {bags.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || (p.category || 'กระเป๋า') === filterCategory;
            return matchesSearch && matchesCategory;
          }).map(p => (
            <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
              <div className="flex items-start gap-3">
                {p.image ? (
                  <img 
                    src={p.image} 
                    className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity border border-gray-200 shrink-0" 
                    onClick={() => { setViewingImageProduct(p); setCurrentImageIndex(0); }}
                    alt={p.name}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-200">
                    <ImageIcon size={24} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-sm line-clamp-2">{p.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="font-medium text-emerald-600">฿{p.price.toLocaleString()}</span>
                    <span className="text-gray-400 text-sm">|</span>
                    <span className="text-xs text-gray-500 pt-0.5">
                      ทุน: ฿{p.cost || 0}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {p.productUrl && (
                      <a href={p.productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-xs inline-block bg-blue-50 px-2 py-0.5 rounded-full">
                        ลิ้งค์ 1
                      </a>
                    )}
                    {p.productUrl2 && (
                      <a href={p.productUrl2} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline text-xs inline-block bg-indigo-50 px-2 py-0.5 rounded-full">
                        ลิ้งค์ 2
                      </a>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-2">
                <div className="flex justify-between items-center mb-2 px-1">
                  <span className="text-xs font-semibold text-gray-600">รายละเอียดสี</span>
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    รวม: {p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0} ชิ้น
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {p.variants?.map(v => (
                    <div key={v.id} className="text-xs border border-gray-200 bg-white p-1.5 rounded-md text-gray-600 shadow-sm flex items-center justify-between">
                      <div className="flex items-center overflow-hidden">
                        {v.imageUrl ? (
                          <img 
                            src={v.imageUrl} 
                            className="w-5 h-5 rounded object-cover mr-1.5 shrink-0" 
                            onClick={() => { 
                              setViewingImageProduct(p); 
                              const imgs = computeAllImages(p);
                              const idx = imgs.indexOf(v.imageUrl!);
                              setCurrentImageIndex(idx >= 0 ? idx : 0); 
                            }}
                            alt={v.color}
                          />
                        ) : (
                          <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center mr-1.5 shrink-0"><ImageIcon size={10} className="text-gray-400"/></div>
                        )}
                        <span className="truncate">{v.color} ({v.stock})</span>
                      </div>
                      <button 
                        onClick={() => setBarcodeModal({ id: v.id, name: p.name, color: v.color, price: p.price })}
                        className="text-indigo-500 bg-indigo-50 p-1 rounded shrink-0 ml-1"
                      >
                        <Scan size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-1 border-t border-gray-100">
                <button 
                  onClick={() => handleEditToRestock(p)}
                  className="text-indigo-500 bg-indigo-50 hover:bg-indigo-100 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center transition-colors flex-1 justify-center"
                >
                  <PackagePlus size={14} className="mr-1" /> สั่งเพิ่ม
                </button>
                <button 
                  onClick={() => setEditingProduct(p)}
                  className="text-blue-500 bg-blue-50 hover:bg-blue-100 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center transition-colors flex-1 justify-center"
                >
                  <Edit2 size={14} className="mr-1" /> แก้ไข
                </button>
                <button 
                  onClick={() => setConfirmDeleteId(p.id)}
                  className="text-red-500 bg-red-50 hover:bg-red-100 p-1.5 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        </>
`;

content = content.replace(originalTable, stackListHtml);
fs.writeFileSync(path, content);
