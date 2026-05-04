import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Bookmark, 
  MessageSquare, 
  Share2, 
  ArrowLeft, 
  Clock, 
  User, 
  ChevronRight,
  Send,
  Loader2,
  BookOpen,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserData } from '../App';
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy, limit, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function TutorialDetail({ user }: { user: UserData | null }) {
  const { slug } = useParams();
  const [tutorial, setTutorial] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [comment, setComment] = useState('');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);

  useEffect(() => {
    fetchTutorial();
  }, [slug]);

  useEffect(() => {
    if (tutorial?.id) {
      const q = query(
        collection(db, 'comments'), 
        where('tutorial_id', '==', tutorial.id),
        orderBy('created_at', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snap) => {
        setComments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });

      return () => unsubscribe();
    }
  }, [tutorial?.id]);

  useEffect(() => {
    if (user && tutorial?.id) {
      const checkFavorite = async () => {
        const q = query(
          collection(db, 'favorites'), 
          where('user_id', '==', user.id), 
          where('tutorial_id', '==', tutorial.id)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setIsFavorited(true);
          setFavoriteId(snap.docs[0].id);
        } else {
          setIsFavorited(false);
          setFavoriteId(null);
        }
      };
      checkFavorite();
    }
  }, [user, tutorial?.id]);

  const fetchTutorial = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'tutorials'), where('slug', '==', slug), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error();
      
      const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
      setTutorial(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError(true);
      setLoading(false);
    }
  };

  const handleFavorite = async () => {
    if (!user) return alert('Please sign in to favorite tutorials');
    
    try {
      if (isFavorited && favoriteId) {
        await deleteDoc(doc(db, 'favorites', favoriteId));
        setIsFavorited(false);
        setFavoriteId(null);
      } else {
        const docRef = await addDoc(collection(db, 'favorites'), {
          user_id: user.id,
          tutorial_id: tutorial.id,
          title: tutorial.title,
          slug: tutorial.slug,
          created_at: serverTimestamp()
        });
        setIsFavorited(true);
        setFavoriteId(docRef.id);
      }
    } catch (err) {
      console.error("Favorite toggle error:", err);
    }
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'comments'), {
        content: comment,
        tutorial_id: tutorial.id,
        user_id: user.id,
        user_name: user.name,
        created_at: serverTimestamp()
      });
      setComment('');
    } catch (error) {
      console.error("Comment submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-brand-amber" size={48} />
    </div>
  );

  if (error || !tutorial) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-4xl font-serif font-bold mb-4 italic">The signal is <span className="text-brand-amber">lost</span>.</h1>
      <p className="text-brand-blue/60 mb-8">We couldn't find the tutorial you're looking for.</p>
      <Link to="/tutorials" className="btn-primary">Return to Catalog</Link>
    </div>
  );

  return (
    <article className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-slate-400 mb-8 overflow-hidden">
        <Link to="/tutorials" className="hover:text-brand-primary transition-colors shrink-0">Repository</Link>
        <ChevronRight size={12} className="shrink-0" />
        <Link to={`/tutorials?category=${tutorial.category_slug}`} className="hover:text-brand-primary transition-colors capitalize truncate">{tutorial.category_name}</Link>
        <ChevronRight size={12} className="shrink-0" />
        <span className="text-brand-primary font-medium truncate">{tutorial.title}</span>
      </nav>

      <div className="grid grid-cols-12 gap-12">
        {/* Main Content */}
        <div className="col-span-12 lg:col-span-8 space-y-10">
          <header className="space-y-8">
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tighter leading-none">
              {tutorial.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-between gap-6 pb-8 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-indigo-100 p-0.5">
                  <img 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${tutorial.author_name}`} 
                    alt={tutorial.author_name} 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{tutorial.author_name}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Curriculum Architect</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleFavorite}
                  className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold transition-all shadow-sm ${isFavorited ? 'bg-indigo-50 border-brand-primary text-brand-primary' : 'bg-white border-slate-200 text-slate-600 hover:border-brand-primary'}`}
                >
                  <Bookmark size={16} fill={isFavorited ? "currentColor" : "none"} />
                  {isFavorited ? 'Saved' : 'Save to Library'}
                </button>
                <div className="h-6 w-px bg-slate-100 hidden sm:block" />
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">12m Read</span>
                </div>
              </div>
            </div>
          </header>

          <div className="markdown-body card-sleek p-8 md:p-12 relative overflow-hidden bg-white">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform">
               <Terminal size={140} />
            </div>
            <ReactMarkdown
              components={{
                code({ inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={dracula as any}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-xl overflow-hidden my-6 border border-slate-800"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="px-1.5 py-0.5 bg-slate-100 text-indigo-600 rounded text-xs font-mono" {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {tutorial.content}
            </ReactMarkdown>
          </div>

          <div className="h-px bg-slate-100 w-full" />

          {/* Comments Section */}
          <section className="space-y-10 pt-4">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <MessageSquare className="text-brand-primary" size={24} />
                Collaborative Dialogue
                <span className="ml-2 text-xs font-bold text-slate-300 uppercase tracking-widest">({comments.length})</span>
              </h2>
            </div>

            {user ? (
              <form onSubmit={submitComment} className="flex flex-col gap-4 group">
                <textarea 
                  placeholder="Share an insight or ask a question..." 
                  className="w-full p-6 bg-slate-50 rounded-2xl border border-slate-200 focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/5 outline-none transition-all text-sm leading-relaxed min-h-[120px]"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button 
                  disabled={isSubmitting || !comment.trim()}
                  className="btn-primary self-end flex items-center gap-2"
                >
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  <span>Deploy Post</span>
                </button>
              </form>
            ) : (
              <div className="p-10 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-300">
                <p className="text-sm text-slate-500 mb-6 font-medium">Join the dialogue to engage with peers and curriculum architects.</p>
                <Link to="/auth" className="btn-secondary uppercase text-[11px] tracking-widest px-8">Authenticate</Link>
              </div>
            )}

            <div className="space-y-6">
              <AnimatePresence>
                {comments.map((c: any) => (
                  <motion.div 
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-4"
                  >
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user_name}`} className="w-10 h-10 rounded-full shrink-0 border border-slate-100" />
                    <div className="flex-1 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm transition-all hover:shadow-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-900">{c.user_name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {c.created_at?.toDate ? c.created_at.toDate().toLocaleDateString() : (c.created_at ? new Date(c.created_at).toLocaleDateString() : 'Just now')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="col-span-12 lg:col-span-4 space-y-8">
          <div className="sticky top-24 space-y-8">
            {/* Meta Card */}
            <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
               <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">Subject Mapping</h4>
               <div className="space-y-6">
                 <div>
                   <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">{tutorial.category_name}</div>
                   <p className="text-slate-500 text-xs leading-relaxed">
                     Deciphering the foundational logic and architectural patterns of modern computing.
                   </p>
                 </div>
                 
                 <div className="space-y-3">
                   <div className="flex items-center justify-between text-[11px] font-medium border-b border-slate-100 pb-2">
                     <span className="text-slate-400">Complexity</span>
                     <span className="text-indigo-600 font-bold">L3 Intermediate</span>
                   </div>
                   <div className="flex items-center justify-between text-[11px] font-medium">
                     <span className="text-slate-400">Path Progression</span>
                     <span className="text-slate-900 font-bold">Step 4 of 12</span>
                   </div>
                 </div>

                 <Link to={`/tutorials?category=${tutorial.category_slug}`} className="flex items-center gap-2 text-xs font-bold text-brand-primary hover:gap-3 transition-all">
                   Explore Full Domain <ArrowRight size={14} />
                 </Link>
               </div>
            </div>

            {/* Community Contribution Card */}
            <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-6">Learning Path</h4>
              <div className="p-4 rounded-xl border border-transparent hover:border-indigo-100 hover:bg-indigo-50/30 transition-all cursor-pointer">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 block mb-1">Open Curriculum</span>
                <h5 className="font-bold text-slate-900 group-hover:text-brand-primary transition-colors text-sm mb-2">Memory Allocation Patterns</h5>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">Engage with fellow students on high-concurrency systems design.</p>
                <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={12} /> Community Choice</span>
                </div>
              </div>
              
              <Link to="/tutorials" className="w-full mt-6 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest">
                Return to Catalog <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}
