import fs from 'fs';

const path = 'src/components/Inventory.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `<Grid size={20} />
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (`;

const replacement = `<Grid size={20} />
          </button>
        </div>
      </div>
      </div>

      {viewMode === 'list' ? (`;

content = content.replace(target, replacement);

fs.writeFileSync(path, content);
