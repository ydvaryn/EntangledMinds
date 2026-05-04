import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Search, Filter, Book, Clock, ChevronRight, Hash, ArrowRight, BookOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function TutorialList() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';

  const [tutorials, setTutorials] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCategories() {
      const snap = await getDocs(collection(db, 'categories'));
      setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function loadTutorials() {
      setLoading(true);
      try {
        let q = query(collection(db, 'tutorials'), orderBy('order_index', 'asc'));
        
        if (selectedCategory) {
          q = query(collection(db, 'tutorials'), where('category_id', '==', selectedCategory), orderBy('order_index', 'asc'));
        }

        const snap = await getDocs(q);
        let results = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // In-memory search for simplicity (Firestore limited search)
        if (search) {
          results = results.filter(t => 
            t.title.toLowerCase().includes(search.toLowerCase()) || 
            t.excerpt?.toLowerCase().includes(search.toLowerCase())
          );
        }

        setTutorials(results);
      } catch (err) {
        console.error("Firestore fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadTutorials();
  }, [search, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Archive</h3>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Technical Repository</h1>
        </div>
        <div className="relative w-full md:w-80">
          <input 
            type="text" 
            placeholder="Search catalog..." 
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Filters Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 space-y-10">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-100 pb-2">Hierarchy</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setSelectedCategory('')}
                className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedCategory ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                All Chapters
              </button>
              {categories.map(cat => (
                <button 
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat.slug ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <BookOpen size={48} className="text-indigo-600" />
            </div>
            <p className="text-xs text-indigo-600 font-bold mb-2 uppercase tracking-tight">Open Repository</p>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">Access all system design modules and architectural patterns for free.</p>
            <Link to="/tutorials" className="block w-full py-1.5 bg-brand-primary text-white text-center text-[10px] font-bold rounded-lg shadow-sm hover:bg-brand-primary-hover transition-colors uppercase tracking-widest">Explore All</Link>
          </div>
        </aside>

        {/* Results */}
        <div className="flex-grow">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-48 bg-white rounded-2xl border border-slate-100 animate-pulse" />
              ))}
            </div>
          ) : tutorials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tutorials.map((item, idx) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link 
                    to={`/tutorials/${item.slug}`}
                    className="group card-sleek h-full flex flex-col hover:border-brand-primary p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-widest">
                        {categories.find(c => c.id === item.category_id)?.name || item.category_id}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-primary transition-colors">
                      {item.title}
                    </h3>
                    
                    <p className="text-sm text-brand-text-muted mb-6 leading-relaxed line-clamp-2">
                      {item.excerpt || item.content.substring(0, 100) + "..."}
                    </p>
                    
                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock size={12} className="text-slate-400" />
                        <span className="text-[10px] font-medium text-slate-400 tracking-tight">12m modules</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-primary uppercase tracking-widest group-hover:gap-2 transition-all">
                        Study <ArrowRight size={12} />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-3xl border border-dashed border-slate-200">
              <Hash size={40} className="text-slate-100 mb-4" />
              <p className="text-sm font-medium text-slate-400">No tutorials found for your selection.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
