import fs from 'fs';

const path = 'src/components/Settings.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "    if (window.confirm('คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูล \"ทั้งหมด\"? การกระทำนี้จะต้องไปลบในระบบ Cloud (Firestore) ด้วยตนเองเพื่อความปลอดภัย!')) {\n      alert('เพื่อความปลอดภัย การลบข้อมูลทั้งหมด โปรดดำเนินการลบผ่าน Firebase Console');\n    }",
  "    setAlertMsg('เพื่อความปลอดภัย การลบข้อมูลทั้งหมด โปรดดำเนินการลบผ่าน Firebase Console');"
);

fs.writeFileSync(path, content);
