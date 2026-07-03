import { useState, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import { ShoppingBag, Plus, Minus, Trash2, Scan, MapPin, ShoppingCart, Check, Bluetooth, Printer } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { MARKETS } from '../types';
import toast from 'react-hot-toast';

export default function Pos() {
  const { bags, cart, addToCart, removeFromCart, updateCartQuantity, checkout, currentMarket, setCurrentMarket } = useAppContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<any>(null);

  // --- Modals ---
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  // --- State ---
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [promptPayID, setPromptPayID] = useState('0993625932');
  const [lastSale, setLastSale] = useState<any>(null);
  const [discount, setDiscount] = useState<number>(0);

  // --- Printer State ---
  const [printerDevice, setPrinterDevice] = useState<any>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const finalTotal = Math.max(0, cartTotal - discount);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    if (scannedCode) {
      let foundProduct = null;
      let foundVariant = null;
      for (const p of bags) {
        const v = p.variants.find((v: any) => v.id === scannedCode);
        if (v) {
          foundProduct = p;
          foundVariant = v;
          break;
        }
      }
      if (foundVariant && foundProduct) {
        addToCart(foundProduct, foundVariant);
        toast(`✅ เพิ่ม ${foundProduct.name} ลงตะกร้าแล้ว`);
      } else {
        toast(`❌ ไม่พบรหัสบาร์โค้ดสินค้าในระบบ: ${scannedCode}`);
      }
      setScannedCode(null);
    }
  }, [scannedCode, bags, cart, addToCart]);

  useEffect(() => {
    let scanner: any;
    if (isScannerOpen) {
      setTimeout(() => {
        scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
        scanner.render(
          (decodedText: string) => {
            setScannedCode(decodedText);
            scanner.clear();
            setIsScannerOpen(false);
          },
          (error: any) => {} 
        );
      }, 200);
    }
    return () => {
      if (scanner) scanner.clear().catch((e: any) => console.log(e));
    };
  }, [isScannerOpen]);

  const handleCheckout = () => {
    if (!currentMarket) {
      toast("กรุณาเลือกตลาด/ช่องทางขายก่อนครับ");
      return;
    }
    const sale = checkout(discount);
    if (sale) {
      setLastSale(sale);
      setDiscount(0);
      setIsReceiptOpen(true);
      setIsMobileCartOpen(false);
      setIsQROpen(false);
    }
  };

  const connectPrinter = async () => {
    try {
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
      });
      const server = await device.gatt.connect();
      setPrinterDevice(server);
      toast("✅ เชื่อมต่อเครื่องพิมพ์บลูทูธสำเร็จ!");
    } catch (error) {
      console.error("Bluetooth error:", error);
      toast("❌ ไม่สามารถเชื่อมต่อกับเครื่องพิมพ์ได้");
    }
  };

  const printReceipt = async (saleData: any) => {
    if (!printerDevice || !printerDevice.connected) {
      toast("เครื่องพิมพ์หลุดการเชื่อมต่อ กรุณาเชื่อมต่อใหม่");
      setPrinterDevice(null);
      return;
    }
    setIsPrinting(true);
    try {
      const service = await printerDevice.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      const ESC = '\x1b';
      const center = ESC + 'a' + '\x01';
      const left = ESC + 'a' + '\x00';
      const boldOn = ESC + 'E' + '\x01';
      const boldOff = ESC + 'E' + '\x00';
      const line = "--------------------------------\n";

      let receipt = "";
      receipt += center + boldOn + "BagPOS Pro\n" + boldOff;
      receipt += "Receipt No: " + saleData.id.slice(-6) + "\n";
      receipt += "Date: " + new Date(saleData.date).toLocaleString('en-US') + "\n";
      receipt += line + left;

      saleData.items.forEach((item: any) => {
        receipt += `${item.name.substring(0, 15)} (${item.color})\n`;
        receipt += `${item.qty} x ${item.price} = ${item.qty * item.price} THB\n`;
      });

      receipt += line;
      if (saleData.discount) {
        receipt += `Subtotal: ${saleData.total + saleData.discount} THB\n`;
        receipt += `Discount: -${saleData.discount} THB\n`;
      }
      
      receipt += center + boldOn;
      receipt += `TOTAL: ${saleData.total} THB\n`;
      receipt += boldOff + line;
      receipt += "Thank you for shopping!\n\n\n";

      const encoder = new TextEncoder();
      const data = encoder.encode(receipt);

      const CHUNK_SIZE = 50;
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await characteristic.writeValue(chunk);
      }
    } catch (error) {
      console.error("Print error:", error);
      toast("❌ เกิดข้อผิดพลาดขณะพิมพ์ใบเสร็จ");
    }
    setIsPrinting(false);
  };

  return (
    <div className="flex h-full bg-gray-50 relative flex-col lg:flex-row">
      <div className="flex-1 p-4 lg:p-6 overflow-y-auto pb-40 lg:pb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 space-y-4 lg:space-y-0">
          <h2 className="text-2xl font-bold text-gray-800">หน้าการขาย (POS)</h2>
          <div className="flex items-center space-x-2 w-full lg:w-auto">
            <button 
              onClick={() => setIsScannerOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-white p-2 lg:px-4 rounded-lg flex items-center shadow-sm font-medium transition-colors flex-1 justify-center lg:flex-none"
            >
              <Scan size={20} className="lg:mr-2" />
              <span className="hidden lg:inline">สแกนบาร์โค้ด</span>
            </button>
            <div className="flex items-center space-x-2 bg-white p-2 rounded-lg shadow-sm border flex-1 lg:flex-none">
              <MapPin size={20} className="text-blue-500" />
              <select 
                value={currentMarket} 
                onChange={(e) => setCurrentMarket(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-gray-700 font-medium cursor-pointer w-full outline-none"
              >
                <option value="">-- เลือกตลาด/ช่องทางขาย --</option>
                {MARKETS.map(market => (
                  <option key={market.id} value={market.id}>{market.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mb-4 space-y-4">
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                filterCategory === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilterCategory('กระเป๋า')}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                filterCategory === 'กระเป๋า'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              กระเป๋า
            </button>
            <button
              onClick={() => setFilterCategory('พวงกุญแจตุ๊กตา')}
              className={`px-4 py-2 rounded-full whitespace-nowrap font-medium transition-colors ${
                filterCategory === 'พวงกุญแจตุ๊กตา'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border hover:bg-gray-50'
              }`}
            >
              พวงกุญแจตุ๊กตา
            </button>
          </div>
          <input 
            type="text" 
            placeholder="🔍 ค้นหาชื่อสินค้า..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {bags.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || (p.category || 'กระเป๋า') === filterCategory;
            return matchesSearch && matchesCategory;
          }).map(product => (
            <div 
              key={product.id} 
              onClick={() => setSelectedProductForVariant(product)}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 overflow-hidden flex flex-col"
            >
              <div className="aspect-square bg-gray-200 relative shrink-0">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ShoppingBag size={40} />
                  </div>
                )}
                <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-sm font-bold text-gray-800">
                  ฿{product.price}
                </div>
              </div>
              <div className="p-3 md:p-4 flex flex-col justify-between flex-1">
                <h3 className="font-bold text-gray-800 text-sm md:text-base line-clamp-2 leading-tight">{product.name}</h3>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs md:text-sm text-gray-500 font-medium">
                    {product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0} ชิ้น
                  </p>
                  {product.storeId && (
                    <span className="text-[10px] md:text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border truncate max-w-[60px] md:max-w-[80px]">
                      {product.storeId}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:flex w-full lg:w-96 bg-white border-l shadow-xl flex-col h-full z-10 relative">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <ShoppingCart size={20} className="mr-2 text-blue-600" />
            ตะกร้าสินค้า
          </h3>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <ShoppingBag size={48} className="mb-2 opacity-50" />
              <p>ยังไม่มีสินค้าในตะกร้า</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.variantId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-gray-800 text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">สี{item.color}</p>
                  <div className="flex items-center gap-2 mt-1 bg-white w-max px-2 py-1 rounded border">
                    <button onClick={() => updateCartQuantity(item.variantId, item.qty - 1)} className="text-gray-500 hover:text-gray-700">
                      <Minus size={14} />
                    </button>
                    <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                    <button onClick={() => updateCartQuantity(item.variantId, item.qty + 1)} className="text-gray-500 hover:text-gray-700">
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
                <div className="text-right ml-2 flex flex-col items-end">
                  <p className="font-bold text-gray-800">฿{item.price * item.qty}</p>
                  <button onClick={() => removeFromCart(item.variantId)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors mt-2">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
            <span>รวม</span>
            <span>฿{cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
            <span>ส่วนลด (บาท)</span>
            <input 
              type="number" 
              min="0"
              value={discount === 0 ? '' : discount} 
              onChange={(e) => setDiscount(Number(e.target.value))}
              placeholder="0"
              className="w-24 p-2 text-right border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors font-semibold"
            />
          </div>
          <div className="flex justify-between items-center mb-4 text-lg">
            <span className="font-bold text-gray-600">ยอดสุทธิ</span>
            <span className="font-bold text-2xl text-gray-900">
              ฿{finalTotal.toLocaleString()}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setIsQROpen(true)}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center transition-colors ${
                cart.length === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 shadow-sm'
              }`}
            >
              สร้าง QR
            </button>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-xl font-bold flex items-center justify-center transition-colors ${
                cart.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg'
              }`}
            >
              <Check size={20} className="mr-1" /> เงินสด
            </button>
          </div>
        </div>
      </div>

      {/* Selected Product Variants Modal */}
      {selectedProductForVariant && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 truncate pr-2">เลือกรุ่น: {selectedProductForVariant.name}</h3>
              <button onClick={() => setSelectedProductForVariant(null)} className="text-gray-500 hover:text-gray-800">ปิด</button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              {selectedProductForVariant.images && selectedProductForVariant.images.length > 1 && (
                <div className="flex overflow-x-auto gap-2 pb-4 mb-4 border-b">
                  {selectedProductForVariant.images.map((img: string, idx: number) => (
                    <img key={idx} src={img} className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm flex-shrink-0" />
                  ))}
                </div>
              )}
              {selectedProductForVariant.variants?.length === 0 ? (
                <p className="text-center text-gray-500 py-4">ไม่มีสินค้าในสต๊อก</p>
              ) : (
                <div className="space-y-2">
                  {selectedProductForVariant.variants?.map((variant: any) => (
                    <div 
                      key={variant.id} 
                      onClick={() => {
                        if (variant.stock > 0) {
                          addToCart(selectedProductForVariant, variant);
                          setSelectedProductForVariant(null);
                        }
                      }}
                      className={`p-3 rounded-lg border flex justify-between items-center cursor-pointer transition-colors ${
                        variant.stock > 0 ? 'hover:bg-blue-50 hover:border-blue-300' : 'bg-gray-100 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div>
                        <span className="font-bold text-gray-800">สี{variant.color}</span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-medium ${variant.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {variant.stock > 0 ? `เหลือ ${variant.stock}` : 'หมด'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Cart Button */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t p-4 flex justify-between items-center z-30 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.1)]">
        <div>
          <p className="text-sm text-gray-500 font-medium">ยอดรวม ({totalItems} ชิ้น)</p>
          <p className="font-bold text-xl text-gray-900">฿{cartTotal.toLocaleString()}</p>
        </div>
        <button 
          onClick={() => setIsMobileCartOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center shadow-lg"
        >
          <ShoppingCart size={20} className="mr-2" /> ดูตะกร้า
        </button>
      </div>

      {/* Mobile Cart Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/60 z-50 flex flex-col justify-end">
          <div className="bg-white w-full h-[80vh] rounded-t-3xl flex flex-col overflow-hidden animate-in slide-in-from-bottom">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg flex items-center"><ShoppingCart size={20} className="mr-2 text-blue-600"/> ตะกร้าสินค้า</h3>
              <button onClick={() => setIsMobileCartOpen(false)} className="text-gray-500 font-bold p-2">ปิด X</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.length === 0 ? (
                <p className="text-center text-gray-400 mt-10">ไม่มีสินค้าในตะกร้า</p>
              ) : (
                cart.map((item) => (
                  <div key={item.variantId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-bold text-sm truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">สี{item.color}</p>
                      <div className="flex items-center gap-2 mt-1 bg-white w-max px-2 py-1 rounded border">
                        <button onClick={() => updateCartQuantity(item.variantId, item.qty - 1)} className="text-gray-500">
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateCartQuantity(item.variantId, item.qty + 1)} className="text-gray-500">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="text-right ml-4 flex flex-col items-end">
                      <p className="font-bold text-gray-800">฿{item.price * item.qty}</p>
                      <button onClick={() => removeFromCart(item.variantId)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors mt-2">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t space-y-3 bg-white">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>รวม</span>
                <span>฿{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>ส่วนลด (บาท)</span>
                <input 
                  type="number" 
                  min="0"
                  value={discount === 0 ? '' : discount} 
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  placeholder="0"
                  className="w-24 p-2 text-right border-2 border-gray-200 rounded-lg outline-none focus:border-blue-500 transition-colors font-semibold"
                />
              </div>
              <div className="flex justify-between items-center text-lg font-bold mb-4 text-gray-900">
                <span>ยอดสุทธิ</span>
                <span>฿{finalTotal.toLocaleString()}</span>
              </div>
              <button 
                onClick={() => { setIsQROpen(true); }}
                disabled={cart.length === 0}
                className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center transition-colors ${
                  cart.length === 0 ? 'bg-gray-100 text-gray-400' : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                สร้าง QR โอนเงิน
              </button>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center ${
                  cart.length === 0 ? 'bg-gray-300 text-gray-500' : 'bg-emerald-600 text-white shadow-lg'
                }`}
              >
                <Check size={24} className="mr-2" /> รับเงินสด ฿{finalTotal.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR PromptPay Modal */}
      {isQROpen && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">สแกนรับเงิน (PromptPay)</h3>
              <button onClick={() => setIsQROpen(false)} className="text-gray-500 hover:text-gray-800 font-bold p-1">ปิด X</button>
            </div>
            <div className="p-6 flex flex-col items-center">
              <p className="text-gray-500 mb-1">ยอดที่ต้องชำระ</p>
              <p className="text-4xl font-bold text-blue-600 mb-6">฿{finalTotal.toLocaleString()}</p>
              
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-gray-100 mb-6 relative">
                {cart.length > 0 ? (
                  <img 
                    src={`https://promptpay.io/${promptPayID.replace(/[^0-9]/g, '')}/${finalTotal}.png`} 
                    alt="PromptPay QR" 
                    className="w-56 h-56 object-contain"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-gray-400 bg-gray-50">ไม่มีสินค้า</div>
                )}
              </div>

              <div className="w-full">
                <label className="text-xs text-gray-500 block mb-2 font-medium">ตั้งค่าเบอร์ PromptPay หรือ เลขบัตร ปชช.</label>
                <input 
                  type="text" 
                  value={promptPayID} 
                  readOnly
                  className="w-full p-3 border-2 border-gray-200 rounded-xl text-center font-bold text-gray-700 bg-gray-50 focus:border-blue-500 outline-none transition-colors cursor-not-allowed"
                  placeholder="เช่น 0993625932"
                />
              </div>
            </div>
            <div className="p-4 bg-gray-50 border-t">
               <button 
                onClick={handleCheckout}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-lg flex justify-center items-center shadow-lg transition-colors"
               >
                 <Check size={24} className="mr-2"/> ลูกค้าโอนแล้ว (บันทึกการขาย)
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 bg-black/80 z-[70] flex flex-col items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
             <div className="p-4 border-b flex justify-between items-center bg-gray-50">
               <h3 className="font-bold text-lg flex items-center"><Scan size={20} className="mr-2 text-blue-600"/> สแกนบาร์โค้ดสินค้า</h3>
               <button onClick={() => setIsScannerOpen(false)} className="text-gray-500 hover:text-gray-800 font-bold p-2">ปิด X</button>
             </div>
             <div className="p-2 bg-black">
               <div id="reader" className="w-full bg-black rounded-lg overflow-hidden border-none text-center"></div>
             </div>
             <div className="p-4 text-center text-sm text-gray-500 bg-white">
               หันกล้องมือถือไปที่บาร์โค้ดหรือ QR Code ของสินค้า
             </div>
           </div>
        </div>
      )}

      {/* Receipt Modal */}
      {isReceiptOpen && lastSale && (
        <div className="fixed inset-0 bg-black/70 z-[80] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center text-emerald-600">
                <Check size={20} className="mr-2"/> ชำระเงินสำเร็จ!
              </h3>
            </div>
            <div className="p-6 flex flex-col items-center bg-emerald-50">
              <p className="text-gray-500 mb-1">ยอดรวมทั้งสิ้น</p>
              <p className="text-4xl font-bold text-emerald-600 mb-4">฿{lastSale.total.toLocaleString()}</p>
              <div className="w-full bg-white p-4 rounded-xl border border-emerald-100 mb-4 text-sm text-gray-600 space-y-2">
                <div className="flex justify-between border-b pb-2"><span className="font-medium">รายการ</span><span>{lastSale.items.reduce((s:any, i:any) => s + i.qty, 0)} ชิ้น</span></div>
                {lastSale.discount > 0 && (
                  <div className="flex justify-between border-b pb-2 text-red-500"><span className="font-medium">ส่วนลด</span><span>-฿{lastSale.discount.toLocaleString()}</span></div>
                )}
                <div className="flex justify-between border-b pb-2"><span className="font-medium">เวลา</span><span>{new Date(lastSale.date).toLocaleTimeString('th-TH')}</span></div>
              </div>

              {!printerDevice ? (
                <button onClick={connectPrinter} className="w-full py-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-bold mb-3 flex justify-center items-center transition-colors">
                  <Bluetooth size={20} className="mr-2" /> เชื่อมต่อปริ้นเตอร์บลูทูธ
                </button>
              ) : (
                <button onClick={() => printReceipt(lastSale)} disabled={isPrinting} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold mb-3 flex justify-center items-center shadow-lg transition-colors">
                  <Printer size={20} className="mr-2" /> {isPrinting ? 'กำลังพิมพ์...' : 'พิมพ์ใบเสร็จ'}
                </button>
              )}
              
              <button onClick={() => setIsReceiptOpen(false)} className="w-full py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-bold flex justify-center items-center transition-colors">
                ปิด / ขายบิลต่อไป
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
