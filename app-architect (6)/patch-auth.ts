import fs from 'fs';

let content = fs.readFileSync('src/AppContext.tsx', 'utf-8');

// Add user to AppContextType
content = content.replace(
  'interface AppContextType {',
  'import { User, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from \'firebase/auth\';\nimport { auth } from \'./lib/firebase\';\n\ninterface AppContextType {\n  user: User | null;\n  signIn: () => void;\n  logOut: () => void;'
);

// Add auth state and modify collections
content = content.replace(
  'const [currentMarket, setCurrentMarket] = useState<string>(\'\');',
  'const [currentMarket, setCurrentMarket] = useState<string>(\'\');\n  const [user, setUser] = useState<User | null>(null);\n  const [loadingAuth, setLoadingAuth] = useState(true);\n\n  useEffect(() => {\n    const unsubscribe = onAuthStateChanged(auth, (u) => {\n      setUser(u);\n      setLoadingAuth(false);\n    });\n    return () => unsubscribe();\n  }, []);\n\n  const signIn = async () => {\n    const provider = new GoogleAuthProvider();\n    try {\n      await signInWithPopup(auth, provider);\n    } catch (error) {\n      console.error(error);\n    }\n  };\n\n  const logOut = async () => {\n    await signOut(auth);\n  };\n'
);

content = content.replace(
  'useEffect(() => {\n    const today = new Date().getDay();',
  'useEffect(() => {\n    if (!user) {\n      setBags([]);\n      setTransactions([]);\n      setClaims([]);\n      setExpenses([]);\n      setShippings([]);\n      setChinaStores([]);\n      setRestocks([]);\n      return;\n    }\n\n    const today = new Date().getDay();'
);

content = content.replace(/collection\(db, '([a-zA-Z]+)'\)/g, "collection(db, 'users', user.uid, '$1')");
content = content.replace(/doc\(db, '([a-zA-Z]+)', /g, "doc(db, 'users', user?.uid || 'temp', '$1', ");

content = content.replace(
  'return (\n    <AppContext.Provider value={{',
  'if (loadingAuth) return <div className="flex h-screen items-center justify-center text-gray-500">กำลังตรวจสอบสิทธิ์...</div>;\n\n  return (\n    <AppContext.Provider value={{\n      user, signIn, logOut,'
);

fs.writeFileSync('src/AppContext.tsx', content);
