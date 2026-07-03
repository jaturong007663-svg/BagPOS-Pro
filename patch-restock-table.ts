import fs from 'fs';

const path = 'src/components/RestockHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

const startIdx = content.indexOf('<div className="overflow-x-auto">');
const endIdx = content.indexOf('</table>\n              </div>') + '</table>\n              </div>'.length;

const divHtml = `<div className="border-t border-gray-100 pt-2">
                <div className="hidden lg:grid grid-cols-12 gap-4 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 rounded-lg mb-2">
                  <div className="col-span-5 xl:col-span-4">รายการสินค้า</div>
                  <div className="col-span-3 xl:col-span-3">รายละเอียด (สี/จำนวน)</div>
                  <div className="col-span-2 text-center">ช่องทางที่สั่ง</div>
                  <div className="col-span-1 text-center">ต้นทุน/คู่</div>
                  <div className="col-span-1 text-center">จำนวน(คู่)</div>
                </div>
                <div className="space-y-3">
                  {order.items?.map((item, idx) => {
                    const productRef = bags.find(p => p.name === item.name);
                    const storeId = productRef?.storeId || '';
                    const storeName = storeId || 'ไม่ระบุ';
                    const productUrl = item.productUrl || productRef?.productUrl || '';
                    const displayImage = item.image || productRef?.image || '';
                    
                    return (
                      <div key={idx} className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 lg:border-transparent lg:items-center">
                        <div className="col-span-5 xl:col-span-4 flex items-start gap-3">
                          {displayImage ? (
                            <img src={displayImage} alt={item.name} className="w-16 h-16 lg:w-12 lg:h-12 object-cover rounded-md border border-gray-100 shrink-0" />
                          ) : (
                            <div className="w-16 h-16 lg:w-12 lg:h-12 bg-gray-100 rounded-md flex items-center justify-center border border-gray-100 shrink-0">
                              <Package className="text-gray-400" size={24} />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-800 line-clamp-2">{item.name}</p>
                          </div>
                        </div>
                        
                        <div className="col-span-3 xl:col-span-3 lg:mt-0 bg-gray-50 lg:bg-transparent p-2 lg:p-0 rounded-lg">
                          {item.variants && item.variants.length > 0 ? (
                            <div className="space-y-1">
                              <p className="lg:hidden text-xs text-gray-500 mb-1 font-medium">รายละเอียด:</p>
                              <div className="flex flex-wrap gap-2 lg:block lg:space-y-1">
                                {item.variants.filter((v: any) => v.stock > 0).map((v: any, vIdx: number) => (
                                  <div key={vIdx} className="flex items-center space-x-2 text-xs bg-white lg:bg-transparent p-1 lg:p-0 rounded border lg:border-none border-gray-100">
                                    {v.imageUrl ? (
                                      <img src={v.imageUrl} className="w-6 h-6 object-cover rounded-sm border shrink-0" />
                                    ) : (
                                      <div className="w-6 h-6 bg-gray-100 rounded-sm border flex items-center justify-center shrink-0"><Package size={10} className="text-gray-400"/></div>
                                    )}
                                    <span className="text-gray-600">สี: {v.color || 'ไม่ระบุ'}</span>
                                    <span className="font-semibold text-gray-800">× {v.stock}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm italic">ไม่มีระบุสี</span>
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center lg:contents mt-1 lg:mt-0 border-t lg:border-0 border-gray-100 pt-2 lg:pt-0">
                          <div className="col-span-2 text-center text-sm">
                            <span className="lg:hidden text-gray-500 text-xs mr-2">สั่งจาก:</span>
                            {productUrl ? (
                              <a href={productUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center">
                                {storeName} <span className="hidden lg:inline ml-1">🔗</span>
                              </a>
                            ) : (
                              <span className="text-gray-600">{storeName}</span>
                            )}
                          </div>
                          <div className="col-span-1 text-center text-sm text-gray-600">
                            <span className="lg:hidden text-gray-500 text-xs mr-2">ต้นทุน:</span>
                            ฿{item.cost?.toLocaleString() || 0}
                          </div>
                          <div className="col-span-1 text-center text-sm font-bold text-emerald-600">
                            <span className="lg:hidden text-gray-500 text-xs font-normal mr-2 text-gray-800">จำนวนรวม:</span>
                            <span className="bg-emerald-50 lg:bg-transparent px-2 py-0.5 rounded-full lg:p-0">{item.qty}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>`;

content = content.substring(0, startIdx) + divHtml + content.substring(endIdx);
fs.writeFileSync(path, content);
