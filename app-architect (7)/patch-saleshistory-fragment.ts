import fs from 'fs';

const path = 'src/components/SalesHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  ") : (\\n                                            <button ",
  ") : (\\n                      <>\\n                        <button "
);

content = content.replace(
  ") : (\\n                                            <button \\n                        onClick={() => handleEditTransaction(transaction)}",
  ") : (\\n                      <>\\n                      <button \\n                        onClick={() => handleEditTransaction(transaction)}"
);

content = content.replace(
  "                        <span className=\"hidden sm:inline font-medium text-sm\">ยกเลิกบิล</span>\\n                      </button>\\n                    )}",
  "                        <span className=\"hidden sm:inline font-medium text-sm\">ยกเลิกบิล</span>\\n                      </button>\\n                      </>\\n                    )}"
);

fs.writeFileSync(path, content);
