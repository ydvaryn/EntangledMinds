import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Code, Brain, Terminal, Database, BookOpen, ChevronRight, MessageSquare, Heart, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function Home() {
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data));
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-32 pb-32">
      {/* Hero Section */}
      <section className="relative pt-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-600 text-xs font-bold uppercase tracking-wider mb-6">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                New Curriculum Available
              </div>
              <h1 className="text-6xl md:text-8xl font-black leading-[0.95] tracking-tighter mb-8 text-slate-900">
                Computational Mastery. <span className="text-brand-primary">Refined</span>.
              </h1>
              <p className="text-lg text-brand-text-muted mb-10 max-w-lg leading-relaxed">
                Expert-led tutorials on system design, database architecture, and advanced algorithms. Designed for the modern engineer.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-grow max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search tutorials..." 
                    className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-full text-sm focus:ring-2 focus:ring-brand-primary/20 outline-none transition-all shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Link to={`/tutorials?search=${search}`} className="btn-primary flex items-center justify-center gap-2">
                  Explore
                </Link>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="relative hidden lg:block"
            >
              <div className="aspect-square bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl relative overflow-hidden p-12">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent"></div>
                <div className="relative h-full flex flex-col justify-between">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active System</div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="h-2 w-3/4 bg-slate-100 rounded-full" />
                    <div className="h-2 w-1/2 bg-slate-100 rounded-full" />
                    <div className="h-2 w-5/6 bg-slate-100 rounded-full" />
                  </div>

                  <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl">
                    <div className="flex items-center gap-3 text-indigo-400 font-mono text-sm">
                      <Terminal size={16} />
                      <span>system.initialize()</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Hierarchy</h3>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">Structured Knowledge</h2>
          </div>
          <Link to="/tutorials" className="text-sm font-bold text-brand-primary flex items-center hover:gap-2 transition-all">
            Browse All Catalog <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {categories.map((cat) => (
            <motion.div key={cat.id} variants={item}>
              <Link 
                to={`/tutorials?category=${cat.slug}`}
                className="group card-sleek flex flex-col h-full bg-white border border-slate-200 hover:border-brand-primary transition-all p-8"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-10 group-hover:bg-indigo-50 transition-colors">
                  {cat.slug === 'algorithms' ? <Brain size={24} className="text-brand-primary" /> : <Database size={24} className="text-brand-primary" />}
                </div>
                
                <h3 className="text-xl font-bold mb-3 text-slate-900">{cat.name}</h3>
                <p className="text-sm text-brand-text-muted mb-8 leading-relaxed">
                  {cat.description || "Master the core architectural patterns and implementation details of this domain."}
                </p>
                
                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">12 Modules</span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-white transition-all">
                    <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Feature Section */}
      <section className="bg-slate-900 py-32 rounded-[3rem] mx-6">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-12">
          <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tighter">
            Elevate your <span className="text-indigo-400">understanding</span>.
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
            {[
              { title: "Deep-Dive Content", desc: "No surface-level guides. We go deep into the 'why'." },
              { title: "Clean Visuals", desc: "Minimal interface designed for high-focus studying." },
              { title: "Peer Dialogue", desc: "Discuss complex patterns with a verified community." }
            ].map((f, i) => (
              <div key={i} className="space-y-4">
                <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                <h4 className="text-lg font-bold text-white">{f.title}</h4>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-6 text-center pt-20">
        <div className="space-y-8">
          <h2 className="text-5xl font-black tracking-tighter text-slate-900">Join the Collective.</h2>
          <p className="text-lg text-brand-text-muted leading-relaxed max-w-xl mx-auto">
            Ready to decode the complex? Create your account today and start archivinng mastery.
          </p>
          <div className="flex gap-4 justify-center">
            <Link to="/auth" className="btn-primary">Get Started</Link>
            <Link to="/tutorials" className="btn-secondary">View Catalog</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
