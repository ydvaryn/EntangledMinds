import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, User, Github, LogIn, Loader2, ArrowRight, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  GithubAuthProvider 
} from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        // Note: Name will be synced in App.tsx useEffect via onSnapshot/setDoc
      }
      navigate('/');
    } catch (e: any) {
      setError(e.message || 'Authentication failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (e: any) {
      setError(e.message || 'Google sign-in failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-32 opacity-5 pointer-events-none">
        <Terminal size={400} className="text-slate-900" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-2 mb-8 group">
            <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <div className="w-5 h-5 border-2 border-white rounded-full opacity-70"></div>
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">Entangled<span className="text-brand-primary">Minds</span></span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p className="text-sm text-slate-500">
            {isLogin ? 'Access your technical study modules' : 'Join a collective of high-focus engineering'}
          </p>
        </div>

        <div className="auth-card p-10 space-y-8 bg-white border-slate-200">
          <div className="flex bg-slate-50 border border-slate-100 p-1 rounded-xl">
             <button 
               onClick={() => setIsLogin(true)}
               className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${isLogin ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-indigo-600'}`}
             >
               Sign In
             </button>
             <button 
               onClick={() => setIsLogin(false)}
               className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${!isLogin ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-indigo-600'}`}
             >
               Register
             </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-6">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-1.5"
                >
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identity</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                    <input 
                      type="text" 
                      required
                      placeholder="Alan Turing"
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 focus:bg-white focus:border-brand-primary/30 outline-none transition-all text-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Protocol</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="email" 
                  required
                  placeholder="name@domain.edu"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 focus:bg-white focus:border-brand-primary/30 outline-none transition-all text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Security Key</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 focus:bg-white focus:border-brand-primary/30 outline-none transition-all text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[11px] font-bold text-red-500 bg-red-50 p-3 rounded-lg border border-red-100"
              >
                Failed: {error}
              </motion.p>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />}
              <span className="uppercase tracking-widest text-[11px] font-bold">{isLogin ? 'Initiate Session' : 'Create Identity'}</span>
            </button>
          </form>

          <div className="relative py-2">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
             <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold"><span className="bg-white px-4 text-slate-300">Third Party</span></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100">
              <Github size={16} />
              <span className="text-xs font-bold text-slate-600">GitHub</span>
            </button>
            <button 
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-100"
            >
              <div className="w-4 h-4 bg-red-500 rounded-full" />
              <span className="text-xs font-bold text-slate-600">Google</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
