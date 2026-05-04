/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { 
  Search, 
  User, 
  Menu, 
  X, 
  BookOpen, 
  Heart, 
  MessageSquare, 
  ShieldCheck, 
  Mail,
  Home as HomeIcon,
  Github,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Pages
import Home from './pages/Home';
import TutorialList from './pages/TutorialList';
import TutorialDetail from './pages/TutorialDetail';
import Profile from './pages/Profile';
import AuthPage from './pages/Auth';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import AccountConfig from './pages/AccountConfig';
import { Privacy, Terms } from './pages/Legal';

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { getFirestore, doc, onSnapshot, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

// Types
export interface UserData {
  id: string; // Changed to string for Firebase UID
  name: string;
  email: string;
  role: string;
  avatar?: string;
  bio?: string;
  created_at?: any;
}

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Sync with Firestore profile
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        
        // Use onSnapshot for real-time profile updates
        const unsubscribeProfile = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            setUser({ id: firebaseUser.uid, ...snapshot.data() } as UserData);
          } else {
            // Initial profile creation if not exists
            const newUser = {
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'Anonymous Researcher',
              role: 'user',
              created_at: serverTimestamp(),
              avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`
            };
            setDoc(userDocRef, newUser).catch(err => {
              handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
            });
            setUser({ id: firebaseUser.uid, ...newUser } as any);
          }
          setLoading(false);
        });

        return () => unsubscribeProfile();
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans bg-brand-bg text-brand-text-main">
        {/* Navbar */}
        <nav className="sticky top-0 z-50 bg-white border-b border-brand-border">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <div className="w-4 h-4 border-2 border-white rounded-full opacity-70"></div>
              </div>
              <span className="text-xl font-extrabold tracking-tight text-brand-text-main">Entangled<span className="text-brand-primary">Minds</span></span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/tutorials" className="nav-link">Tutorials</Link>
              <Link to="/contact" className="nav-link">Contact</Link>
              
              <div className="h-4 w-px bg-slate-200" />
              
              {user ? (
                <div className="flex items-center gap-4">
                  {user.role === 'admin' && (
                    <Link to="/admin" className="p-2 text-slate-400 hover:text-brand-primary transition-colors" title="Admin Panel">
                      <ShieldCheck size={20} />
                    </Link>
                  )}
                  <Link to="/profile" className="flex items-center gap-3">
                    <img 
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`} 
                      alt={user.name} 
                      className="w-8 h-8 rounded-full border-2 border-indigo-100 shadow-sm"
                    />
                  </Link>
                  <button onClick={logout} className="text-sm font-medium text-slate-400 hover:text-red-500">Logout</button>
                </div>
              ) : (
                <Link to="/auth" className="text-sm font-bold text-brand-primary py-2 px-4 hover:bg-slate-50 transition-colors">
                  Sign In
                </Link>
              )}
            </div>

              {/* Mobile Menu Toggle */}
              <button className="md:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="md:hidden bg-brand-cream border-b border-brand-blue/10 px-4 py-8 space-y-6"
              >
                <Link to="/" className="block text-2xl font-black tracking-tight" onClick={() => setIsMenuOpen(false)}>Home</Link>
                <Link to="/tutorials" className="block text-2xl font-black tracking-tight" onClick={() => setIsMenuOpen(false)}>Tutorials</Link>
                <Link to="/contact" className="block text-2xl font-black tracking-tight" onClick={() => setIsMenuOpen(false)}>Contact</Link>
                <hr className="border-slate-100" />
                {user ? (
                  <>
                    <Link to="/profile" className="block text-xl font-bold tracking-tight" onClick={() => setIsMenuOpen(false)}>Profile</Link>
                    <Link to="/account" className="block text-xl font-bold tracking-tight" onClick={() => setIsMenuOpen(false)}>Settings</Link>
                    <button onClick={logout} className="block text-xl font-bold tracking-tight text-red-500">Logout</button>
                  </>
                ) : (
                  <Link to="/auth" className="block text-xl font-bold tracking-tight" onClick={() => setIsMenuOpen(false)}>Sign In</Link>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {/* Main Content */}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/tutorials" element={<TutorialList />} />
            <Route path="/tutorials/:slug" element={<TutorialDetail user={user} />} />
            <Route path="/profile" element={user ? <Profile user={user} /> : <Navigate to="/auth" />} />
            <Route path="/account" element={user ? <AccountConfig user={user} /> : <Navigate to="/auth" />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={(user?.role === 'admin' || user?.email === 'one.aryan7@gmail.com') ? <Admin user={user} /> : <Navigate to="/" />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-brand-border pt-16 pb-8">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
              <div className="col-span-1 md:col-span-2">
                <Link to="/" className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded bg-brand-primary flex items-center justify-center">
                    <div className="w-3 h-3 border border-white rounded-full opacity-70"></div>
                  </div>
                  <span className="text-lg font-bold tracking-tight">Entangled<span className="text-brand-primary">Minds</span></span>
                </Link>
                <p className="text-brand-text-muted text-sm max-w-xs leading-relaxed">
                  Deciphering computing with clarity. The premier platform for modern curriculum.
                </p>
              </div>
              
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Repository</h4>
                <ul className="space-y-3 text-sm text-brand-text-muted">
                  <li><Link to="/tutorials" className="hover:text-brand-primary transition-colors">All Tutorials</Link></li>
                  <li><Link to="/categories/algorithms" className="hover:text-brand-primary transition-colors">Algorithms</Link></li>
                  <li><Link to="/categories/data-structures" className="hover:text-brand-primary transition-colors">Data Structures</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Support</h4>
                <ul className="space-y-3 text-sm text-brand-text-muted">
                  <li><Link to="/privacy" className="hover:text-brand-primary transition-colors">Privacy</Link></li>
                  <li><Link to="/terms" className="hover:text-brand-primary transition-colors">Terms</Link></li>
                  <li><Link to="/contact" className="hover:text-brand-primary transition-colors">Contact</Link></li>
                </ul>
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-8 flex flex-col md:flex-row justify-between items-center text-[10px] font-medium text-slate-400">
              <p>&copy; {new Date().getFullYear()} EntangledMinds Academy.</p>
              <div className="flex gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                <span className="text-emerald-600 uppercase tracking-tighter">System Operational</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
