import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../AppContext';
import { Bag } from '../types';
import { Plus, Edit2, Trash2, X, Upload, ShoppingBag, Scan, Printer, Check, ImageIcon, ChevronLeft, ChevronRight, Grid, List, PackagePlus, Wallet } from 'lucide-react';

export default function Inventory() {
  const { bags, setBags, addBag, updateBag, deleteBag, chinaStores, shippings, restocks, addRestockOrder, setChinaStores } = useAppContext();
  const inventoryContainerRef = React.useRef<HTMLDivElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  const [editingProduct, setEditingProduct] = useState<Bag | null>(null);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState(() => {
    const saved = localStorage.getItem('pos_inventory_draft_product');
    return saved ? JSON.parse(saved) : { name: '', price: '', cost: '', image: '', images: [] as string[], basePrice: '', shippingFee: '', shippingId: '', storeId: '', productUrl: '', productUrl2: '', category: 'กระเป๋า' };
  });
  const [newVariants, setNewVariants] = useState(() => {
    const saved = localStorage.getItem('pos_inventory_draft_variants');
    return saved ? JSON.parse(saved) : [{ color: '', stock: '', imageUrl: '' }];
  });

  useEffect(() => {
    localStorage.setItem('pos_inventory_draft_product', JSON.stringify(newProduct));
  }, [newProduct]);

  useEffect(() => {
    localStorage.setItem('pos_inventory_draft_variants', JSON.stringify(newVariants));
  }, [newVariants]);

  const [uploadingInventory, setUploadingInventory] = useState(false);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [restockCart, setRestockCart] = useState<any[]>([]);

  const handleFetchProductInfo = async (url: string) => {
    if (!url || !url.startsWith('http')) return;
    setIsFetchingUrl(true);
    try {
      const res = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setNewProduct(prev => ({
          ...prev,
          name: prev.name || data.data.name || '',
          image: prev.image || data.data.image || ''
        }));
        // Note: colors extraction is left empty by the backend, user will need to add manually
      }
    } catch (err) {
      console.error("Failed to fetch product data from URL", err);
    } finally {
      setIsFetchingUrl(false);
    }
  };
  const [globalShippingFee, setGlobalShippingFee] = useState('');

  const [barcodeModal, setBarcodeModal] = useState<any>(null);
  const [printerDevice, setPrinterDevice] = useState<any>(null);
  const [viewingImageProduct, setViewingImageProduct] = useState<Bag | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const computeAllImages = (product: Bag | null) => {
    if (!product) return [];
    const images = new Set<string>();
    if (product.image) images.add(product.image);
    if (product.images) product.images.forEach(i => images.add(i));
    if (product.variants) product.variants.forEach(v => v.imageUrl && images.add(v.imageUrl));
    return Array.from(images);
  };
  const allViewingImages = computeAllImages(viewingImageProduct);

  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'SHOE_POS_EXTENSION_IMPORT') {
        const item = event.data.payload;
        setNewProduct(prev => ({
          ...prev,
          name: item.name,
          basePrice: item.basePrice,
          image: item.image,
          images: item.images || (item.image ? [item.image] : []),
          cost: String(Number(item.basePrice) * 5), 
        }));
        setNewVariants(item.variants.map((v: any) => ({ ...v, stock: String(v.stock) })));
        setIsAdding(true); 
        alert(`🚀 นำเข้าข้อมูล "${item.name}" จาก 1688 สำเร็จ!`);
      }
    };
    window.addEventListener('message', handleExtensionMessage);
    return () => window.removeEventListener('message', handleExtensionMessage);
  }, []);

  const uploadToImgBB = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=8498e331618d211a1744fbf81777cbc8`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      return data.data.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      return null;
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    setUploadingInventory(true);
    const uploadedUrls = [];
    for (const file of files) {
      const url = await uploadToImgBB(file);
      if (url) uploadedUrls.push(url);
    }
    if (uploadedUrls.length > 0) {
      setNewProduct(prev => {
        const currentImgs = prev.images || (prev.image ? [prev.image] : []);
        const merged = [...currentImgs, ...uploadedUrls];
        return { ...prev, image: merged[0], images: merged };
      });
    }
    setUploadingInventory(false);
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0 || !editingProduct) return;
    setUploadingEditImage(true);
    const uploadedUrls = [];
    for (const file of files) {
      const url = await uploadToImgBB(file);
      if (url) uploadedUrls.push(url);
    }
    if (uploadedUrls.length > 0) {
      setEditingProduct(prev => {
        if (!prev) return prev;
        const currentImgs = prev.images || (prev.image ? [prev.image] : []);
        const merged = [...currentImgs, ...uploadedUrls];
        return { ...prev, image: merged[0], images: merged };
      });
    }
    setUploadingEditImage(false);
  };

  const handleEditToRestock = (p: Bag) => {
    setNewProduct({
      name: p.name,
      price: (p.price || 0).toString(),
      cost: (p.cost || '').toString(),
      image: p.image || '',
      images: p.images || [],
      basePrice: '',
      shippingFee: '',
      shippingId: '',
      storeId: p.storeId || '',
      productUrl: p.productUrl || '',
      productUrl2: p.productUrl2 || '',
      category: p.category || 'กระเป๋า'
    });
    setNewVariants(
      (p.variants && p.variants.length > 0)
        ? p.variants.map(v => ({ color: v.color, stock: '', imageUrl: v.imageUrl || '' }))
        : [{ color: '', stock: '', imageUrl: '' }]
    );
    setIsAdding(true);
    if (inventoryContainerRef.current) {
      inventoryContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const saveEditedProduct = () => {
    if (!editingProduct?.name || !editingProduct?.price) {
      return;
    }
    updateBag(editingProduct);
    setEditingProduct(null);
  };

  const handleConfirmRestock = () => {
    if (restockCart.length === 0) return;

    const totalPairs = restockCart.reduce((sum, item) => 
      sum + item.variants.reduce((vSum: number, v: any) => vSum + (Number(v.stock) || 0), 0)
    , 0);

    const extraShippingPerPair = totalPairs > 0 && globalShippingFee 
      ? (Number(globalShippingFee) / totalPairs) 
      : 0;

    const totalRestockCost = restockCart.reduce((sum, item) => {
      const pairs = item.variants?.reduce((vSum: number, v: any) => vSum + (Number(v.stock) || 0), 0) || 0;
      return sum + (Number(item.cost || 0) * pairs);
    }, 0) + (Number(globalShippingFee) || 0);

    const newRestockOrder = {
      id: 'r-' + Date.now(),
      date: new Date().toISOString(),
      totalPairs,
      totalCost: totalRestockCost,
      shippingFee: Number(globalShippingFee) || 0,
      items: restockCart.map(item => ({
        name: item.name,
        qty: item.variants?.reduce((s: number, v: any) => s + (Number(v.stock) || 0), 0) || 0,
        cost: Number(item.cost) || 0,
        image: item.image,
        productUrl: item.productUrl,
        productUrl2: item.productUrl2,
        variants: item.variants.map((v: any) => ({
          color: v.color,
          stock: Number(v.stock) || 0,
          imageUrl: v.imageUrl
        }))
      }))
    };

    const updatedBags = [...bags];

    for (const item of restockCart) {
      const pairs = item.variants?.reduce((vSum: number, v: any) => vSum + (Number(v.stock) || 0), 0) || 0;
      
      const existingProdIndex = updatedBags.findIndex(p => 
        p.name.trim().toLowerCase() === item.name.trim().toLowerCase() &&
        (p.storeId || '') === (item.storeId || '')
      );

      if (existingProdIndex >= 0) {
        const existingProd = updatedBags[existingProdIndex];
        
        const oldQty = existingProd.variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
        const oldCost = Number(existingProd.cost) || 0;
        
        const newQty = pairs;
        const newEffectiveCost = Number(item.cost) > 0 ? Number(item.cost) : oldCost;
        const newCostWithShipping = newEffectiveCost + extraShippingPerPair;
        
        let trueCalculatedCost = oldCost;
        if (oldQty + newQty > 0) {
          trueCalculatedCost = ((oldQty * oldCost) + (newQty * newCostWithShipping)) / (oldQty + newQty);
        } else {
          trueCalculatedCost = newCostWithShipping;
        }

        const updatedVariants = [...existingProd.variants];
        
        item.variants.filter((v: any) => v.color).forEach((nv: any) => {
          const vIndex = updatedVariants.findIndex(v => v.color === nv.color);
          if (vIndex >= 0) {
            updatedVariants[vIndex].stock = (Number(updatedVariants[vIndex].stock) || 0) + Number(nv.stock);
            if (nv.imageUrl && !updatedVariants[vIndex].imageUrl) {
              updatedVariants[vIndex].imageUrl = nv.imageUrl;
            }
          } else {
            updatedVariants.push({
              id: 'v' + Date.now() + Math.random().toString(36).substring(2, 7),
              color: nv.color,
              stock: Number(nv.stock) || 0,
              imageUrl: nv.imageUrl
            });
          }
        });

        updatedBags[existingProdIndex] = { 
          ...existingProd, 
          variants: updatedVariants, 
          price: Number(item.price) || existingProd.price,
          cost: Number(trueCalculatedCost.toFixed(2)),
          storeId: item.storeId || existingProd.storeId,
          image: item.image || existingProd.image,
          images: item.images || (item.image ? [item.image] : []),
          productUrl: item.productUrl || existingProd.productUrl,
          productUrl2: item.productUrl2 || existingProd.productUrl2
        };
      } else {
        const calculatedCost = Number(item.cost || 0) + extraShippingPerPair;
        const newId = 'p' + Date.now() + Math.random().toString(36).substring(2, 7);
        updatedBags.push({
          id: newId,
          name: item.name.trim(),
          price: Number(item.price),
          cost: Number(calculatedCost.toFixed(2)),
          storeId: item.storeId || '', 
          image: item.image,
          images: item.images || (item.image ? [item.image] : []),
          productUrl: item.productUrl,
          productUrl2: item.productUrl2,
          variants: item.variants.filter((v: any) => v.color).map((v: any, i: number) => ({
            id: 'v' + Date.now() + i + Math.random().toString(36).substring(2, 5),
            color: v.color,
            stock: Number(v.stock) || 0,
            imageUrl: v.imageUrl
          }))
        });
      }
    }

    setBags(updatedBags);
    addRestockOrder(newRestockOrder);
    setRestockCart([]);
    setGlobalShippingFee('');
    alert("✅ บันทึกนำเข้าสต๊อกและคำนวณต้นทุนเรียบร้อยแล้ว!");
  };

  const printBarcode = async () => {
    if (!barcodeModal) return;
    let activePrinter = printerDevice;
    if (!activePrinter || !activePrinter.connected) {
      try {
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
          optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb']
        });
        activePrinter = await device.gatt.connect();
        setPrinterDevice(activePrinter);
      } catch (error) {
        alert("❌ กรุณาเชื่อมต่อเครื่องพิมพ์ก่อนพิมพ์บาร์โค้ด");
        return;
      }
    }
    
    try {
      const service = await activePrinter.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const characteristic = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      const ESC = '\x1b';
      const GS = '\x1d';
      const center = ESC + 'a' + '\x01';
      const boldOn = ESC + 'E' + '\x01';
      const boldOff = ESC + 'E' + '\x00';
      
      let label = "";
      label += center + boldOn + barcodeModal.name.substring(0, 22) + "\n" + boldOff;
      label += `Color: ${barcodeModal.color}\n`;
      label += `Price: ${barcodeModal.price} THB\n`;
      
      label += GS + 'h' + String.fromCharCode(80); 
      label += GS + 'w' + String.fromCharCode(2);  
      label += GS + 'H' + String.fromCharCode(2);  
      
      const barcodeData = `{B${barcodeModal.id}`; 
      label += GS + 'k' + String.fromCharCode(73) + String.fromCharCode(barcodeData.length) + barcodeData;
      label += "\n\n\n"; 

      const encoder = new TextEncoder();
      const data = encoder.encode(label);

      const CHUNK_SIZE = 50;
      for (let i = 0; i < data.length; i += CHUNK_SIZE) {
        const chunk = data.slice(i, i + CHUNK_SIZE);
        await characteristic.writeValue(chunk);
      }
    } catch (error) {
      console.error("Print barcode error:", error);
      alert("❌ เกิดข้อผิดพลาดขณะพิมพ์บาร์โค้ด");
    }
  };

  return (
    <div ref={inventoryContainerRef} className="p-6 h-full overflow-y-auto bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">จัดการสต๊อกสินค้า (Inventory)</h2>
        <button 
          onClick={() => {
            if (!isAdding) {
              setNewProduct({ name: '', price: '', cost: '', image: '', images: [], basePrice: '', shippingFee: '', shippingId: '', storeId: '', productUrl: '', productUrl2: '' });
              setNewVariants([{ color: '', stock: '', imageUrl: '' }]);
            }
            setIsAdding(!isAdding);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center hover:bg-blue-700 animate-pulse"
        >
          {isAdding ? <span>ยกเลิก</span> : <span className="flex items-center"><Plus size={20} className="mr-2"/> เพิ่มสินค้าใหม่</span>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
          <div className="flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
              <PackagePlus size={24} />
            </div>
            <div>
              <h3 className="font-bold text-xl text-gray-800">ข้อมูลสินค้าใหม่</h3>
              <p className="text-sm text-gray-500">กรอกรายละเอียดสินค้าเพื่อเตรียมนำเข้าสต๊อก</p>
            </div>
          </div>
          
          <div className="space-y-6">
            {/* Section 1: Basic Information */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center"><Edit2 size={16} className="mr-2 text-blue-500" /> ข้อมูลทั่วไป</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                  <select 
                    value={newProduct.category || 'กระเป๋า'} 
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-shadow"
                  >
                    <option value="กระเป๋า">กระเป๋า</option>
                    <option value="พวงกุญแจตุ๊กตา">พวงกุญแจตุ๊กตา</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    placeholder="เช่น กระเป๋าสะพายข้างแฟชั่น"
                    value={newProduct.name} 
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})} 
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" 
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Links */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
               <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center"><Scan size={16} className="mr-2 text-blue-500" /> แหล่งที่มา (ลิงก์สินค้า)</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                    <span>ลิงก์ที่ 1</span>
                    {isFetchingUrl && <span className="text-xs text-blue-500 animate-pulse">กำลังโหลด...</span>}
                  </label>
                  <input 
                    type="text" 
                    value={newProduct.productUrl || ''} 
                    onChange={e => setNewProduct({...newProduct, productUrl: e.target.value})} 
                    onBlur={e => handleFetchProductInfo(e.target.value)}
                    placeholder="https://"
                    disabled={isFetchingUrl}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 text-sm transition-shadow" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์ที่ 2 (ตัวเลือก)</label>
                  <input 
                    type="text" 
                    value={newProduct.productUrl2 || ''} 
                    onChange={e => setNewProduct({...newProduct, productUrl2: e.target.value})} 
                    placeholder="https://"
                    disabled={isFetchingUrl}
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500 text-sm transition-shadow" 
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Pricing & Cost */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
               <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center"><Wallet size={16} className="mr-2 text-blue-500" /> ราคาและต้นทุน</h4>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (บาท)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">฿</span>
                    <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full p-2.5 pl-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต้นทุน (บาท/คู่)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">฿</span>
                    <input type="number" value={newProduct.cost} onChange={e => setNewProduct({...newProduct, cost: e.target.value})} className="w-full p-2.5 pl-8 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ร้านค้า / ช่องทางที่สั่ง</label>
                  <input 
                    type="text"
                    list="store-options"
                    placeholder="เช่น Taobao, Shopee"
                    value={newProduct.storeId} 
                    onChange={e => setNewProduct({...newProduct, storeId: e.target.value})} 
                    className="w-full p-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium text-sm transition-shadow"
                  />
                  <datalist id="store-options">
                    <option value="Lazada"></option>
                    <option value="Shopee"></option>
                    <option value="Taobao"></option>
                    <option value="1688"></option>
                  </datalist>
                </div>
              </div>
            </div>

            {/* Section 4: Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">รูปภาพสินค้า</label>
              <div className="flex flex-wrap items-center gap-3">
                {(newProduct.images || (newProduct.image ? [newProduct.image] : [])).map((imgUrl, idx) => (
                  <div key={idx} className="relative group">
                    <img src={imgUrl} alt={`Preview ${idx}`} className="w-20 h-20 object-cover rounded-xl border border-gray-200 shadow-sm" />
                    <button 
                      type="button"
                      onClick={() => {
                        const newImages = (newProduct.images || []).filter((_, i) => i !== idx);
                        setNewProduct({...newProduct, images: newImages, image: newImages.length > 0 ? newImages[0] : ''});
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-500 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-gray-300 w-20 h-20 transition-colors">
                  <Upload size={20} className="mb-1" />
                  <span className="text-[10px] font-medium">{uploadingInventory ? 'โหลด...' : 'เพิ่มรูป'}</span>
                  <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" disabled={uploadingInventory} />
                </label>
              </div>
            </div>

            {/* Section 5: Variants */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-800">รุ่นและสี (Variants)</h4>
                <button 
                  onClick={() => setNewVariants([...newVariants, {color: '', stock: '', imageUrl: ''}])}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg flex items-center transition-colors"
                >
                  <Plus size={16} className="mr-1" /> เพิ่มสีอื่น
                </button>
              </div>
              
              <div className="space-y-3">
                {newVariants.map((v, index) => (
                  <div key={index} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                      <label className="cursor-pointer bg-white hover:bg-gray-50 text-gray-400 rounded-lg flex items-center justify-center border border-gray-200 w-12 h-12 shrink-0 transition-colors">
                        {v.imageUrl ? (
                          <img src={v.imageUrl} className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <ImageIcon size={20} />
                        )}
                        <input type="file" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = await uploadToImgBB(file);
                          if (url) {
                            const newArr = [...newVariants]; newArr[index].imageUrl = url; setNewVariants(newArr);
                          }
                        }} className="hidden" />
                      </label>
                      <div className="flex-1 grid grid-cols-2 gap-3 w-full">
                        <input type="text" placeholder="ระบุสี (เช่น ดำ)" value={v.color} onChange={e => {
                          const newArr = [...newVariants]; newArr[index].color = e.target.value; setNewVariants(newArr);
                        }} className="w-full p-2.5 border border-gray-200 rounded-lg min-w-0 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                        <input type="number" placeholder="จำนวน" value={v.stock} onChange={e => {
                          const newArr = [...newVariants]; newArr[index].stock = e.target.value; setNewVariants(newArr);
                        }} className="w-full p-2.5 border border-gray-200 rounded-lg min-w-0 focus:ring-2 focus:ring-blue-500 outline-none text-sm" />
                      </div>
                      {newVariants.length > 1 && (
                        <button 
                          onClick={() => setNewVariants(newVariants.filter((_, i) => i !== index))}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors self-end sm:self-auto"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 ml-[60px] mt-2">
                      {['ดำ', 'ขาว', 'เทา', 'แดง', 'น้ำเงิน', 'เขียว', 'กาแฟ', 'ชมพู', 'น้ำตาล', 'ครีม'].map(c => (
                        <button 
                          key={c}
                          onClick={() => {
                            const newArr = [...newVariants]; newArr[index].color = c; setNewVariants(newArr);
                          }}
                          className="text-[11px] px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-600 rounded-md border border-gray-200 transition-colors shadow-sm"
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Bar */}
            <div className="mt-8 border-t border-gray-200 pt-6 flex justify-end">
              <button 
                onClick={() => {
                  if(!newProduct.name) {
                    // Use a toast or custom error logic, but for now we'll just not proceed
                    // We can add a simple state for error, or simply disable the button instead
                  } else {
                    setRestockCart([...restockCart, { ...newProduct, variants: [...newVariants] }]);
                    setNewProduct({ name: '', price: '', cost: '', image: '', images: [], basePrice: '', shippingFee: '', shippingId: '', storeId: '', productUrl: '', productUrl2: '', category: 'กระเป๋า' });
                    setNewVariants([{ color: '', stock: '', imageUrl: '' }]);
                    setIsAdding(false);
                  }
                }}
                disabled={!newProduct.name}
                className={`px-8 py-3 rounded-xl font-bold flex items-center shadow-lg transition-all ${
                  !newProduct.name 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none' 
                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/30'
                }`}
              >
                <Plus size={20} className="mr-2" />
                {newProduct.name ? `พักไว้ในรายการสั่งซื้อ (${restockCart.length})` : 'กรุณาระบุชื่อสินค้าก่อน'}
              </button>
            </div>
          </div>
        </div>
      )}

      {restockCart.length > 0 && (
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl mb-8 border-4 border-blue-500 animate-in fade-in duration-300">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            <ShoppingBag className="mr-2 text-blue-400" /> 
            รายการเตรียมนำเข้าสต๊อก (บิลสั่งซื้อ)
          </h3>
          
          <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
            {restockCart.map((item, idx) => {
              const totalPairsForItem = item.variants?.reduce((s: number, v: any) => s + (Number(v.stock) || 0), 0) || 0;
              return (
                <div key={idx} className="flex justify-between items-center border-b border-slate-700 pb-2">
                  <div className="overflow-hidden mr-4">
                    <span className="font-semibold">{item.name} ({totalPairsForItem} คู่)</span>
                    <p className="text-xs text-slate-400">
                      {item.variants?.map((v:any) => `${v.color}(${v.stock})`).join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={() => setRestockCart(restockCart.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="bg-slate-800 p-4 rounded-xl mb-6">
            <label className="block text-sm mb-2 text-blue-300 font-medium">ระบุค่าขนส่งรวมของบิลนี้ (บาท) เพื่อเฉลี่ยต้นทุน:</label>
            <input 
              type="number" 
              value={globalShippingFee} 
              onChange={(e) => setGlobalShippingFee(e.target.value)}
              className="w-full p-3 rounded-lg bg-slate-700 border-none text-white text-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="เช่น 1500"
            />
          </div>

          <button 
            onClick={handleConfirmRestock}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-xl font-black shadow-lg flex items-center justify-center"
          >
            <Check size={24} className="mr-2" />
            ยืนยันการเติมสต๊อกทั้งหมด
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 hide-scrollbar">
        {['all', 'กระเป๋า', 'พวงกุญแจตุ๊กตา'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-colors ${filterCategory === cat ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
          >
            {cat === 'all' ? 'ทั้งหมด' : cat}
          </button>
        ))}
      </div>

      <div className="mb-4 flex space-x-2">
        <input 
          type="text" 
          placeholder="🔍 ค้นหาชื่อสินค้าในสต๊อก..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm bg-white"
        />
        <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <button 
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <List size={20} />
          </button>
          <div className="w-px bg-gray-200" />
          <button 
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 flex items-center justify-center transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Grid size={20} />
          </button>
        </div>
      </div>


      {viewMode === 'list' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
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
                      <span className="font-medium text-gray-800 block">
                        {p.name}
                        {p.productUrl && (
                          <a href={p.productUrl} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-500 hover:underline text-xs">
                            (ลิ้งค์ 1)
                          </a>
                        )}
                        {p.productUrl2 && (
                          <a href={p.productUrl2} target="_blank" rel="noopener noreferrer" className="ml-2 text-indigo-500 hover:underline text-xs">
                            (ลิ้งค์ 2)
                          </a>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">
                        ต้นทุน: ฿{p.cost || 0}
                        {p.storeId && ` | ร้าน: ${p.storeId}`}
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
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {bags.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || (p.category || 'กระเป๋า') === filterCategory;
            return matchesSearch && matchesCategory;
          }).map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              <div className="relative aspect-square bg-gray-100 cursor-pointer group" onClick={() => { setViewingImageProduct(p); setCurrentImageIndex(0); }}>
                {p.image ? (
                  <img src={p.image} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity" alt={p.name} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={32} className="text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex space-x-1">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEditToRestock(p); }}
                    className="p-1.5 bg-white/90 rounded-md text-indigo-600 hover:bg-white shadow-sm"
                    title="เพิ่มสต๊อกจากสินค้านี้"
                  >
                    <PackagePlus size={14} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditingProduct(p); }}
                    className="p-1.5 bg-white/90 rounded-md text-blue-600 hover:bg-white shadow-sm"
                    title="แก้ไขข้อมูลสินค้า"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setConfirmDeleteId(p.id);
                    }}
                    className="p-1.5 bg-white/90 rounded-md text-red-600 hover:bg-white shadow-sm"
                    title="ลบสินค้า"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="absolute bottom-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded shadow-sm">
                  ฿{p.price}
                </div>
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <div className="font-semibold text-gray-800 line-clamp-2 mb-1">{p.name}</div>
                <div className="text-xs text-gray-500 mb-3">
                  รวม {p.variants?.reduce((acc, v) => acc + (v.stock || 0), 0) || 0} ชิ้น
                  {p.storeId && ` • ร้าน ${p.storeId}`}
                </div>
                <div className="mt-auto flex space-x-2 overflow-x-auto hide-scrollbar pb-1">
                  {p.variants?.map(v => (
                    <div 
                      key={v.id} 
                      className="flex-shrink-0 flex flex-col items-center cursor-pointer group"
                      onClick={() => {
                        setViewingImageProduct(p);
                        const imgs = computeAllImages(p);
                        const idx = imgs.indexOf(v.imageUrl!);
                        setCurrentImageIndex(idx >= 0 ? idx : 0);
                      }}
                    >
                      {v.imageUrl ? (
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-blue-500 transition-colors">
                          <img src={v.imageUrl} className="w-full h-full object-cover" alt={v.color} />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200 group-hover:border-blue-500 transition-colors">
                          <span className="text-[10px] text-gray-500">{v.color.slice(0, 2)}</span>
                        </div>
                      )}
                      <div className="text-[10px] font-medium text-gray-600 mt-1">{v.stock}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Barcode Modal */}
      {barcodeModal && (
        <div className="fixed inset-0 bg-black/60 z-[90] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 flex flex-col items-center shadow-2xl animate-in zoom-in duration-200">
            <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
              <Printer size={20} className="mr-2 text-indigo-600"/> พิมพ์บาร์โค้ดติดกล่อง
            </h3>
            
            <div className="bg-white p-4 text-center border-2 border-dashed border-gray-300 rounded-xl mb-6 w-full">
              <p className="font-bold text-sm truncate text-gray-800 mb-1">{barcodeModal.name}</p>
              <p className="text-xs text-gray-500 mb-3">สี{barcodeModal.color} | ฿{barcodeModal.price}</p>
              
              <img 
                src={`https://barcode.tec-it.com/barcode.ashx?data=${barcodeModal.id}&code=Code128&dpi=96`} 
                alt="Barcode" 
                className="mx-auto h-20 object-contain mix-blend-multiply"
              />
              <p className="text-[10px] mt-1 text-gray-400">{barcodeModal.id}</p>
            </div>

            <div className="flex space-x-3 w-full">
              <button 
                onClick={() => setBarcodeModal(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
              >
                ปิด
              </button>
              <button 
                onClick={printBarcode}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center shadow-lg transition-transform active:scale-95"
              >
                <Printer size={18} className="mr-2" /> พิมพ์ Bluetooth
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Editing Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 shrink-0">
              <h3 className="font-bold text-gray-800 flex items-center"><Edit2 size={20} className="mr-2 text-blue-600"/> แก้ไขข้อมูลสินค้า</h3>
              <button onClick={() => setEditingProduct(null)} className="text-gray-400 hover:text-gray-600 font-bold p-1">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8 custom-scrollbar">
              {/* Left Column: Basic Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">หมวดหมู่</label>
                    <select 
                      value={editingProduct.category || 'กระเป๋า'} 
                      onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                    >
                      <option value="กระเป๋า">กระเป๋า</option>
                      <option value="พวงกุญแจตุ๊กตา">พวงกุญแจตุ๊กตา</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อสินค้า</label>
                    <input 
                      type="text" 
                      value={editingProduct.name} 
                      onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} 
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์สินค้า 1 (URL)</label>
                    <input 
                      type="text" 
                      value={editingProduct.productUrl || ''} 
                      onChange={e => setEditingProduct({...editingProduct, productUrl: e.target.value})} 
                      placeholder="https://"
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ลิงก์สินค้า 2 (URL)</label>
                    <input 
                      type="text" 
                      value={editingProduct.productUrl2 || ''} 
                      onChange={e => setEditingProduct({...editingProduct, productUrl2: e.target.value})} 
                      placeholder="https://"
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-sm" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคาต้นทุน (฿)</label>
                    <input 
                      type="number" 
                      value={editingProduct.cost || ''} 
                      onChange={e => setEditingProduct({...editingProduct, cost: Number(e.target.value)})} 
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ราคาขาย (฿)</label>
                    <input 
                      type="number" 
                      value={editingProduct.price || ''} 
                      onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} 
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ร้านค้าที่สั่ง</label>
                    <input 
                      type="text"
                      list="edit-store-options"
                      placeholder="Taobao, Shopee..."
                      value={editingProduct.storeId || ''} 
                      onChange={e => setEditingProduct({...editingProduct, storeId: e.target.value})} 
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-sm"
                    />
                    <datalist id="edit-store-options">
                      <option value="Lazada"></option>
                      <option value="Shopee"></option>
                      <option value="Taobao"></option>
                      <option value="1688"></option>
                    </datalist>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">แกลเลอรีรูปภาพ (เพิ่ม/ลบรูปได้)</label>
                  <div className="flex flex-wrap items-center gap-3">
                    {(editingProduct.images || (editingProduct.image ? [editingProduct.image] : [])).map((imgUrl, idx) => (
                      <div key={idx} className="relative group">
                        <img src={imgUrl} alt={`Preview ${idx}`} className="w-16 h-16 object-cover rounded-xl border border-gray-200 shadow-sm" />
                        <button 
                          type="button"
                          onClick={() => {
                            const currentImgs = editingProduct.images || (editingProduct.image ? [editingProduct.image] : []);
                            const newImages = currentImgs.filter((_, i) => i !== idx);
                            setEditingProduct({...editingProduct, images: newImages, image: newImages.length > 0 ? newImages[0] : ''});
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                    <label className="cursor-pointer bg-white text-gray-500 px-4 py-2 rounded-xl flex items-center border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium h-16">
                      <Upload size={16} className="mr-2 text-blue-500" /> {uploadingEditImage ? 'กำลังโหลด...' : 'เพิ่มรูป'}
                      <input type="file" accept="image/*" multiple onChange={handleEditImageUpload} className="hidden" disabled={uploadingEditImage} />
                    </label>
                  </div>
                </div>
            </div>

            {/* Right Column: Variants */}
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col h-full min-h-[300px]">
              <div className="flex justify-between items-center mb-4 shrink-0">
                <label className="block text-sm font-bold text-gray-700">รุ่นและสี (Variants) / เพิ่มสต๊อก</label>
                <button 
                  onClick={() => {
                    const newArr = [...(editingProduct.variants || []), { id: 'v'+Date.now(), color: '', stock: 0, imageUrl: '' }];
                    setEditingProduct({...editingProduct, variants: newArr});
                  }}
                  className="text-blue-600 text-sm font-medium hover:text-blue-700 bg-blue-100/50 hover:bg-blue-100 px-3 py-1.5 rounded-lg flex items-center transition-colors"
                >
                  <Plus size={16} className="mr-1" /> เพิ่มรุ่น/สี
                </button>
              </div>
              <div className="space-y-3 overflow-y-auto flex-1 pr-2 hide-scrollbar">
                {editingProduct.variants?.map((v, index) => (
                  <div key={v.id || index} className="flex space-x-3 items-center bg-white p-3 rounded-xl border border-gray-200 shadow-sm transition-all hover:shadow-md">
                    <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-500 p-1 rounded-lg flex items-center justify-center border border-gray-200 w-12 h-12 shrink-0 transition-colors">
                      {v.imageUrl ? (
                        <img src={v.imageUrl} className="w-full h-full object-cover rounded-md" />
                      ) : (
                        <ImageIcon size={20} />
                      )}
                      <input type="file" accept="image/*" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = await uploadToImgBB(file);
                        if (url) {
                          const newArr = [...(editingProduct.variants || [])];
                          newArr[index].imageUrl = url;
                          setEditingProduct({...editingProduct, variants: newArr});
                        }
                      }} className="hidden" />
                    </label>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input 
                        type="text" 
                        placeholder="ชื่อสี/รุ่น" 
                        value={v.color} 
                        onChange={e => {
                          const newArr = [...(editingProduct.variants || [])];
                          newArr[index].color = e.target.value;
                          setEditingProduct({...editingProduct, variants: newArr});
                        }} 
                        className="w-full p-2.5 border border-gray-200 rounded-lg min-w-0 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                      />
                      <div className="relative">
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">ชิ้น</span>
                        <input 
                          type="number" 
                          placeholder="จำนวน" 
                          value={v.stock} 
                          onChange={e => {
                            const newArr = [...(editingProduct.variants || [])];
                            newArr[index].stock = Number(e.target.value);
                            setEditingProduct({...editingProduct, variants: newArr});
                          }} 
                          className="w-full p-2.5 pr-8 border border-gray-200 rounded-lg min-w-0 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => {
                        const newArr = (editingProduct.variants || []).filter((_, i) => i !== index);
                        setEditingProduct({...editingProduct, variants: newArr});
                      }}
                      className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {(!editingProduct.variants || editingProduct.variants.length === 0) && (
                  <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                    ยังไม่มีรุ่น/สี
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-t flex space-x-3 shrink-0">
            <button 
              onClick={() => setEditingProduct(null)}
              className="flex-1 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-bold transition-colors"
            >
              ยกเลิก
            </button>
            <button 
              onClick={saveEditedProduct}
              disabled={!editingProduct.name || !editingProduct.price}
              className={`flex-1 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center transition-colors ${
                !editingProduct.name || !editingProduct.price 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/30'
              }`}
            >
              <Check className="mr-2" size={18}/> 
              {(!editingProduct.name || !editingProduct.price) ? 'ระบุชื่อและราคาให้ครบ' : 'บันทึกการแก้ไข'}
            </button>
          </div>
          </div>
        </div>
      )}

      {/* Image View Modal */}
      {viewingImageProduct && (
        <div className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4">
          <div className="absolute top-4 right-4 flex space-x-2 z-10">
            <button 
              onClick={() => setViewingImageProduct(null)}
              className="text-white hover:text-gray-300 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={32} />
            </button>
          </div>
          
          <div className="w-full max-w-4xl flex flex-col items-center">
            <div className="relative w-full aspect-square md:aspect-video flex items-center justify-center mb-6">
              {allViewingImages.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => prev === 0 ? allViewingImages.length - 1 : prev - 1);
                  }}
                  className="absolute left-2 md:-left-12 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronLeft size={32} />
                </button>
              )}
              
              <img 
                src={
                  allViewingImages.length > 0 
                    ? allViewingImages[currentImageIndex] 
                    : viewingImageProduct.image
                } 
                alt="Product Full View" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />

              {allViewingImages.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(prev => prev === allViewingImages.length - 1 ? 0 : prev + 1);
                  }}
                  className="absolute right-2 md:-right-12 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                >
                  <ChevronRight size={32} />
                </button>
              )}
            </div>
            
            {allViewingImages.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto py-2 px-4 w-full justify-center hide-scrollbar">
                {allViewingImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === idx ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={imgUrl} className="w-full h-full object-cover" alt={`Thumbnail ${idx}`} />
                  </button>
                ))}
              </div>
            )}
            
            <div className="mt-4 text-center text-white">
              <h3 className="text-xl font-bold">{viewingImageProduct.name}</h3>
              <p className="text-gray-300">฿{viewingImageProduct.price}</p>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 transform transition-all">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <Trash2 className="text-red-600" size={32} />
              </div>
              <h3 className="text-2xl font-black text-gray-800 mb-2">ยืนยันการลบสินค้า</h3>
              <p className="text-gray-500 mb-8 leading-relaxed">
                คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้? ข้อมูลจะถูกลบออกอย่างถาวรและไม่สามารถกู้คืนได้
              </p>
              
              <div className="flex w-full space-x-3">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    deleteBag(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-95"
                >
                  ลบข้อมูล
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
