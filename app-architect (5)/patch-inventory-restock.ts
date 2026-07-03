import fs from 'fs';

const path = 'src/components/Inventory.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace the end of handleConfirmRestock
const findStr = `    }

    setBags(updatedBags);
    addRestockOrder(newRestockOrder);`;

const replaceStr = `    }

    // Update in Firebase
    for (const bag of updatedBags) {
      if (bags.find(b => b.id === bag.id)) {
        updateBag(bag);
      } else {
        addBag(bag);
      }
    }

    // Note: setBags is handled by the snapshot listener, but we can do it locally for immediate effect
    // setBags(updatedBags);
    addRestockOrder(newRestockOrder);`;

content = content.replace(findStr, replaceStr);
fs.writeFileSync(path, content);
