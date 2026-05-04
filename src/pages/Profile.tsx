import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  User as UserIcon, 
  Settings, 
  Heart, 
  MessageSquare, 
  Calendar, 
  ArrowRight,
  BookOpen,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserData } from '../App';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Profile({ user }: { user: UserData }) {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'comments'>('favorites');

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch Favorites
        const favsQuery = query(
          collection(db, 'favorites'), 
          where('user_id', '==', user.id)
        );
        const favsSnap = await getDocs(favsQuery);
        setFavorites(favsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        // Fetch Comments
        const commentsQuery = query(
          collection(db, 'comments'), 
          where('user_id', '==', user.id),
          orderBy('created_at', 'desc')
        );
        const commentsSnap = await getDocs(commentsQuery);
        setComments(commentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user.id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-primary" size={48} />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-8">
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden text-center p-8 space-y-6 relative group">
              <div className="absolute top-0 inset-x-0 h-2 bg-brand-primary" />
              
              <div className="mx-auto w-24 h-24 rounded-full border-4 border-slate-50 flex items-center justify-center bg-indigo-50 overflow-hidden shadow-sm">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-brand-primary">{user.name[0]}</span>
                )}
              </div>
              
              <div className="space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{user.name}</h2>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{user.role || 'Member'}</p>
              </div>

              <p className="text-sm text-slate-500 leading-relaxed max-w-xs mx-auto">
                {user.bio || "Engineering student. Exploring the foundations of the Knowledge Graph."}
              </p>

              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
                <div className="space-y-1">
                  <div className="text-xl font-bold text-slate-900">{favorites.length}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Library</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-bold text-slate-900">{comments.length}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Posts</div>
                </div>
              </div>
              
              <Link to="/account" className="w-full btn-secondary py-2 text-xs flex items-center justify-center gap-2">
                <Settings size={14} />
                <span>Account Config</span>
              </Link>
           </div>

           <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 flex items-center mb-4">
                <Calendar size={12} className="mr-2" />
                Registration
              </h4>
              <p className="text-xs font-bold text-white">
                {user.created_at ? new Date(user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Joining...'}
              </p>
           </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-8 space-y-10">
           <div className="flex gap-8 border-b border-slate-100">
              <button 
                onClick={() => setActiveTab('favorites')}
                className={`pb-4 text-xs font-bold uppercase tracking-widest relative transition-colors ${activeTab === 'favorites' ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Saved Lessons
              </button>
              <button 
                onClick={() => setActiveTab('comments')}
                className={`pb-4 text-xs font-bold uppercase tracking-widest relative transition-colors ${activeTab === 'comments' ? 'text-indigo-600 after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Dialogue Log
              </button>
           </div>

           <AnimatePresence mode="wait">
              {activeTab === 'favorites' ? (
                <motion.div 
                  key="favorites"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {favorites.length > 0 ? favorites.map((tutorial: any) => (
                    <motion.div key={tutorial.id} layout>
                      <Link 
                        to={`/tutorials/${tutorial.slug}`}
                        className="group card-sleek h-full flex flex-col hover:border-brand-primary p-6"
                      >
                        <div className="h-1 w-8 bg-indigo-100 group-hover:bg-brand-primary transition-colors mb-4" />
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-primary transition-colors mb-4 line-clamp-2">{tutorial.title}</h3>
                        <div className="mt-auto flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <span>Review Module</span>
                          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                      </Link>
                    </motion.div>
                  )) : (
                    <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                       <BookOpen size={40} className="mx-auto text-slate-100 mb-4" />
                       <p className="text-sm text-slate-400">Your library is currently empty.</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="comments"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  {comments.length > 0 ? comments.map((comment: any) => (
                    <div key={comment.id} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
                       <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                         <Link to={`/tutorials/${comment.tutorial_id}`} className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors">
                           On Module: {comment.tutorial_id}
                         </Link>
                         <span className="text-[10px] font-bold text-slate-300">{comment.created_at?.toDate ? comment.created_at.toDate().toLocaleDateString() : new Date(comment.created_at).toLocaleDateString()}</span>
                       </div>
                       <p className="text-sm text-slate-600 leading-relaxed italic">
                         "{comment.content}"
                       </p>
                    </div>
                  )) : (
                    <div className="py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                       <MessageSquare size={40} className="mx-auto text-slate-100 mb-4" />
                       <p className="text-sm text-slate-400">No active dialogues found in your log.</p>
                    </div>
                  )}
                </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
