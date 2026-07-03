import fs from 'fs';

let content = fs.readFileSync('src/AppContext.tsx', 'utf-8');

content = content.replace(
  'return () => unsubs.forEach(unsub => unsub());\n  }, []);',
  'return () => unsubs.forEach(unsub => unsub());\n  }, [user]);'
);

fs.writeFileSync('src/AppContext.tsx', content);
