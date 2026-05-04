import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Shield, Save, Loader2, ArrowLeft, Camera } from 'lucide-react';
import { motion } from 'motion/react';
import { UserData } from '../App';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface AccountConfigProps {
  user: UserData;
}

export default function AccountConfig({ user }: AccountConfigProps) {
  const navigate = useNavigate();
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [avatarSeed, setAvatarSeed] = useState(user.name);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`;
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        name,
        bio,
        avatar
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-brand-primary transition-colors mb-6"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </button>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Account Configuration</h1>
        <p className="text-sm text-slate-500 mt-2">Manage your identity and protocol settings within the matrix.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Profile Preview Card */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center space-y-6 sticky top-24">
            <div className="relative inline-block mx-auto">
              <div className="w-24 h-24 rounded-full border-4 border-slate-50 flex items-center justify-center bg-indigo-50 overflow-hidden shadow-sm">
                <img 
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
              <button 
                onClick={() => setAvatarSeed(Math.random().toString(36).substring(7))}
                className="absolute -bottom-1 -right-1 p-2 bg-brand-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                title="Randomize Avatar"
              >
                <Camera size={14} />
              </button>
            </div>
            
            <div className="space-y-1">
              <h2 className="text-xl font-extrabold text-slate-900 truncate">{name}</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{user.role}</p>
            </div>

            <div className="pt-6 border-t border-slate-50">
               <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">Security ID</div>
               <div className="bg-slate-50 px-3 py-1.5 rounded-lg text-[10px] font-mono text-slate-500 truncate">
                 UID: {user.id}
               </div>
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-10 space-y-8">
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Identity Display Name</label>
                 <div className="relative">
                   <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                   <input 
                     type="text" 
                     className="w-full pl-11 pr-4 py-2.5 bg-slate-50 rounded-xl border border-slate-100 focus:bg-white focus:border-brand-primary/30 outline-none transition-all text-sm font-bold"
                     value={name}
                     onChange={(e) => setName(e.target.value)}
                     required
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Cognitive Bio</label>
                 <textarea 
                   className="w-full p-4 bg-slate-50 rounded-xl border border-slate-100 focus:bg-white focus:border-brand-primary/30 outline-none transition-all text-sm leading-relaxed min-h-[120px]"
                   placeholder="Describe your engineering focus..."
                   value={bio}
                   onChange={(e) => setBio(e.target.value)}
                 />
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email Matrix (Read-only)</label>
                 <div className="relative opacity-60">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                   <input 
                     type="email" 
                     className="w-full pl-11 pr-4 py-2.5 bg-slate-100 rounded-xl border border-slate-100 outline-none text-sm cursor-not-allowed"
                     value={user.email}
                     readOnly
                   />
                 </div>
                 <p className="text-[10px] text-slate-400 flex items-center gap-1 ml-1">
                   <Shield size={10} />
                   Primary protocol email is fixed.
                 </p>
               </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
               {success && (
                 <motion.span 
                   initial={{ opacity: 0, x: -10 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="text-emerald-500 text-xs font-bold"
                 >
                   Configuration updated successfully.
                 </motion.span>
               )}
               <button 
                 type="submit" 
                 disabled={loading}
                 className="btn-primary ml-auto flex items-center gap-2 min-w-[140px] justify-center"
               >
                 {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                 <span className="uppercase tracking-widest text-[11px] font-bold">Sync Settings</span>
               </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
