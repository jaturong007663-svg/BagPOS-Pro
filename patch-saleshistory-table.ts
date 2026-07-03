import fs from 'fs';

const path = 'src/components/SalesHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

const tableHtml = `<div className="overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-600 border-b border-t border-gray-100">
                      <tr>
                        <th className="p-3 w-12">รูป</th>
                        <th className="p-3">รายการสินค้า</th>
                        <th className="p-3 text-center">จำนวน</th>
                        <th className="p-3 text-right">ราคาต่อหน่วย</th>
                        <th className="p-3 text-right">รวม</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {transaction.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/50">
                          <td className="p-3">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-md border border-gray-100" />
                            ) : (
                              <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                                <ShoppingBag size={16} className="text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="font-medium text-gray-800">{item.name}</div>
                            <div className="text-xs text-gray-500">สี/รุ่น: {item.color}</div>
                          </td>
                          <td className="p-3 text-center font-medium">
                            {item.qty}
                          </td>
                          <td className="p-3 text-right text-gray-600">
                            ฿{item.price.toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-medium text-gray-800">
                            ฿{(item.price * item.qty).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>`;

const divHtml = `<div className="border-t border-gray-100 pt-2">
                  <div className="hidden sm:grid grid-cols-12 gap-4 px-3 py-2 bg-gray-50 text-xs font-medium text-gray-500 rounded-lg mb-2">
                    <div className="col-span-6 md:col-span-5">รายการสินค้า</div>
                    <div className="col-span-2 text-center">จำนวน</div>
                    <div className="col-span-2 text-right">ราคาต่อหน่วย</div>
                    <div className="col-span-2 md:col-span-3 text-right">รวม</div>
                  </div>
                  <div className="space-y-2">
                    {transaction.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors border border-gray-50 sm:border-transparent sm:items-center">
                        <div className="col-span-6 md:col-span-5 flex items-center gap-3">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-12 h-12 sm:w-10 sm:h-10 object-cover rounded-md border border-gray-100 shrink-0" />
                          ) : (
                            <div className="w-12 h-12 sm:w-10 sm:h-10 bg-gray-100 rounded-md flex items-center justify-center shrink-0">
                              <ShoppingBag size={16} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-800 text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">สี/รุ่น: {item.color}</div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center sm:contents mt-2 sm:mt-0">
                          <div className="col-span-2 text-center text-sm">
                            <span className="sm:hidden text-gray-500 text-xs mr-2">จำนวน:</span>
                            <span className="font-medium bg-gray-100 px-2 py-0.5 rounded-full sm:bg-transparent sm:px-0">{item.qty}</span>
                          </div>
                          <div className="col-span-2 text-right text-sm text-gray-600">
                            <span className="sm:hidden text-gray-500 text-xs mr-2">ราคา:</span>
                            ฿{item.price.toLocaleString()}
                          </div>
                          <div className="col-span-2 md:col-span-3 text-right text-sm font-bold text-gray-800">
                            <span className="sm:hidden text-gray-500 text-xs font-normal mr-2">รวม:</span>
                            <span className="text-emerald-600 sm:text-gray-800">฿{(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>`;

content = content.replace(tableHtml, divHtml);
fs.writeFileSync(path, content);
