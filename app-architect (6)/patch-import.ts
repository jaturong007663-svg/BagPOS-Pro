import fs from 'fs';

let content = fs.readFileSync('src/components/Settings.tsx', 'utf-8');

const importReplacement = `        const data = JSON.parse(result);
        
        if (data) {
          setIsRestoring(true);
          
          let count = 0;
          let batch = writeBatch(db);
          let opCount = 0;
          
          const commitBatchIfNeeded = async () => {
             if (opCount >= 450) {
                 await batch.commit();
                 batch = writeBatch(db);
                 opCount = 0;
             }
          };

          // Helper to add items to batch
          const addToBatch = async (items: any[], colName: string) => {
            if (Array.isArray(items)) {
              for (const item of items) {
                if (item && item.id) {
                  const ref = doc(db, 'users', user?.uid || 'temp', colName, String(item.id));
                  batch.set(ref, item);
                  count++;
                  opCount++;
                  await commitBatchIfNeeded();
                }
              }
            }
          };

          // Handle potentially nested data like localStorage dumps
          const actualData = data.bags ? data : (data.state ? data.state : data);

          await addToBatch(actualData.bags || [], 'bags');
          await addToBatch(actualData.transactions || [], 'transactions');
          await addToBatch(actualData.claims || [], 'claims');
          await addToBatch(actualData.expenses || [], 'expenses');
          await addToBatch(actualData.shippings || [], 'shippings');
          await addToBatch(actualData.chinaStores || actualData.stores || [], 'stores');
          await addToBatch(actualData.restocks || actualData.restockOrders || [], 'restockOrders');

          if (count > 0) {
            if (opCount > 0) {
               await batch.commit();
            }
            setAlertMsg(\`นำเข้าข้อมูลสำเร็จ \${count} รายการ\`);
          } else {
            setAlertMsg('ไม่พบข้อมูลที่จะนำเข้าในไฟล์นี้ หรือไฟล์ไม่ถูกต้อง');
          }
        }`;

content = content.replace(
  /const data = JSON\.parse\(result\);([\s\S]*?)setAlertMsg\('ไม่พบข้อมูลที่จะนำเข้าในไฟล์นี้'\);\n          }\n        }/,
  importReplacement
);

fs.writeFileSync('src/components/Settings.tsx', content);
