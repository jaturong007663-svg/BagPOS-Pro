import fs from 'fs';

const path = 'src/components/SalesHistory.tsx';
let content = fs.readFileSync(path, 'utf8');

// Find the block
const badBlock = `                    ) : (
                                            <button 
                        onClick={() => handleEditTransaction(transaction)}`;

const goodBlock = `                    ) : (
                      <>
                      <button 
                        onClick={() => handleEditTransaction(transaction)}`;

content = content.replace(badBlock, goodBlock);

const endBadBlock = `                        <span className="hidden sm:inline font-medium text-sm">ยกเลิกบิล</span>
                      </button>
                    )}
                  </div>
                </div>`;

const endGoodBlock = `                        <span className="hidden sm:inline font-medium text-sm">ยกเลิกบิล</span>
                      </button>
                      </>
                    )}
                  </div>
                </div>`;

content = content.replace(endBadBlock, endGoodBlock);

fs.writeFileSync(path, content);
