import { useState, useEffect } from 'react';
import { 
  Plus, 
  LayoutDashboard, 
  FilePlus, 
  Settings, 
  Eye, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Pencil,
  Trash2,
  X,
  Bold,
  Italic,
  List as ListIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Code
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { collection, getDocs, addDoc, serverTimestamp, orderBy, query, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { UserData } from '../App';

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

export default function Admin({ user }: { user: UserData | null }) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'create' | 'categories'>('dashboard');
  const [categories, setCategories] = useState<any[]>([]);
  const [tutorials, setTutorials] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category_id: '',
    order_index: 0
  });

  // Category Form State
  const [catForm, setCatForm] = useState({
    name: '',
    slug: '',
    description: ''
  });
  const [catLoading, setCatLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const catSnap = await getDocs(collection(db, 'categories'));
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const tutSnap = await getDocs(query(collection(db, 'tutorials'), orderBy('created_at', 'desc')));
      setTutorials(tutSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error("Fetch error:", err);
      // Not throwing in loadData to avoid breaking the whole component
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const targetId = editingId || formData.slug;
    const path = `tutorials/${targetId}`;

    try {
      const payload = {
        ...formData,
        author_id: user?.id || 'system',
        author_name: user?.name || 'Administrator',
        updated_at: serverTimestamp()
      };

      if (!editingId) {
        // @ts-ignore
        payload.created_at = serverTimestamp();
      }

      await setDoc(doc(db, 'tutorials', targetId), payload, { merge: true });

      setStatus({ type: 'success', msg: editingId ? 'Knowledge module recalibrated.' : 'Knowledge successfully digitized.' });
      
      if (!editingId) {
        setFormData({ title: '', slug: '', content: '', excerpt: '', category_id: '', order_index: 0 });
      }
      
      loadData();
      if (editingId) {
        setTimeout(() => {
          setActiveTab('dashboard');
          setEditingId(null);
          setFormData({ title: '', slug: '', content: '', excerpt: '', category_id: '', order_index: 0 });
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setStatus({ type: 'error', msg: err.message || 'The archival process failed.' });
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (tutorial: any) => {
    setEditingId(tutorial.id);
    setFormData({
      title: tutorial.title,
      slug: tutorial.slug,
      content: tutorial.content,
      excerpt: tutorial.excerpt || '',
      category_id: tutorial.category_id,
      order_index: tutorial.order_index || 0
    });
    setActiveTab('create');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to purge this knowledge module from the repository?")) return;
    
    const path = `tutorials/${id}`;
    try {
      await deleteDoc(doc(db, 'tutorials', id));
      loadData();
    } catch (err) {
      console.error("Delete error:", err);
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCatLoading(true);
    try {
      await setDoc(doc(db, 'categories', catForm.slug), catForm);
      setCatForm({ name: '', slug: '', description: '' });
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setCatLoading(false);
    }
  };

  const deleteCategory = async (id: string) => {
    if (!window.confirm("Purge this topic domain? All linked modules will lose their context.")) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      loadData();
    } catch (err) {
       console.error(err);
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('tutorial-content') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = `${before}${prefix}${selected}${suffix}${after}`;
    setFormData({ ...formData, content: newText });

    // Reset focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 10);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Command <span className="text-brand-primary">Nexus</span></h1>
          <p className="text-slate-500 text-sm max-w-xl">Administrator interface for system-wide curriculum management.</p>
        </div>
        
        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === 'dashboard' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <LayoutDashboard size={14} />
            <span>Overview</span>
          </button>
          <button 
            onClick={() => {
              setActiveTab('create');
              setEditingId(null);
              setFormData({ title: '', slug: '', content: '', excerpt: '', category_id: '', order_index: 0 });
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === 'create' && !editingId ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <FilePlus size={14} />
            <span>New Lesson</span>
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all ${activeTab === 'categories' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Settings size={14} />
            <span>Topics</span>
          </button>
          {editingId && (
            <button 
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all bg-indigo-600 text-white shadow-sm"
            >
              <Pencil size={14} />
              <span>Editing</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-12">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: "Total Tutorials", val: tutorials.length, color: "bg-indigo-600" },
              { label: "Total Categories", val: categories.length, color: "bg-emerald-500" },
              { label: "System Status", val: "Operational", color: "bg-blue-500" }
            ].map((stat, i) => (
              <div key={i} className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-40 group">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
                <div className="text-3xl font-black text-slate-900 tracking-tight">{stat.val}</div>
                <div className={`h-1 w-8 ${stat.color} rounded-full group-hover:w-12 transition-all`} />
              </div>
            ))}
          </div>

          {/* Tutorial Management Table */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
             <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Tutorial Archival Index</h3>
                <Settings size={16} className="text-slate-300" />
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Title / Identifier</th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Sequence</th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                      <th className="px-8 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {tutorials.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{t.title}</div>
                          <div className="text-[10px] uppercase text-slate-400 tracking-tight font-mono">{t.slug}</div>
                        </td>
                        <td className="px-8 py-5">
                           <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                             {categories.find(c => c.id === t.category_id)?.name || t.category_id}
                           </span>
                        </td>
                        <td className="px-8 py-5 font-mono text-xs text-slate-500">{t.order_index}</td>
                        <td className="px-8 py-5">
                          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded border border-emerald-100">Live</span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startEdit(t)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            >
                              <Pencil size={14} />
                            </button>
                            <button 
                              onClick={() => handleDelete(t.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        </div>
      ) : activeTab === 'categories' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* List Categories */}
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
               <div className="px-8 py-6 border-b border-slate-50">
                  <h3 className="text-lg font-bold text-slate-900">Active Topics</h3>
               </div>
               <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {categories.map(c => (
                   <div key={c.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between group">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                           <h4 className="font-bold text-slate-900">{c.name}</h4>
                           <button onClick={() => deleteCategory(c.id)} className="p-2 text-slate-300 hover:text-red-600 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                             <Trash2 size={14} />
                           </button>
                        </div>
                        <p className="text-xs text-slate-500 line-clamp-2">{c.description}</p>
                      </div>
                      <div className="mt-4 text-[10px] font-mono text-slate-400 uppercase tracking-widest">{c.slug}</div>
                   </div>
                 ))}
               </div>
            </div>
          </div>

          {/* Add Category */}
          <div className="lg:col-span-4">
             <form onSubmit={handleCategorySubmit} className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-50 pb-2">Initialize Topic Domain</h3>
                
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold uppercase text-slate-400">Display Name</label>
                   <input 
                    type="text" 
                    required
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-100 focus:bg-white focus:border-brand-primary/30 outline-none transition-all text-xs font-bold"
                    value={catForm.name}
                    onChange={(e) => setCatForm({...catForm, name: e.target.value})}
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold uppercase text-slate-400">UID Slug</label>
                   <input 
                    type="text" 
                    required
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-100 focus:bg-white focus:border-brand-primary/30 outline-none transition-all text-xs font-mono"
                    value={catForm.slug}
                    onChange={(e) => setCatForm({...catForm, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                   />
                </div>

                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold uppercase text-slate-400">Brief Definition</label>
                   <textarea 
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-100 focus:bg-white focus:border-brand-primary/30 outline-none transition-all text-xs h-24"
                    value={catForm.description}
                    onChange={(e) => setCatForm({...catForm, description: e.target.value})}
                   />
                </div>

                <button 
                  disabled={catLoading}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                >
                  {catLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  <span>Add Topic Domain</span>
                </button>
             </form>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main Editing Area */}
          <div className="lg:col-span-8 space-y-10">
             <div className="space-y-8 p-10 bg-white rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                {editingId && (
                  <div className="absolute top-0 right-0 p-4">
                    <button 
                      type="button" 
                      onClick={() => {
                        setEditingId(null);
                        setActiveTab('dashboard');
                        setFormData({ title: '', slug: '', content: '', excerpt: '', category_id: '', order_index: 0 });
                      }}
                      className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>
                )}
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Curriculum Title</label>
                   <input 
                    type="text" 
                    required
                    placeholder="e.g. Master React Concurrency"
                    className="w-full px-6 py-4 bg-slate-50 rounded-xl outline-none focus:ring-4 focus:ring-brand-primary/5 focus:bg-white border border-slate-100 focus:border-brand-primary/30 transition-all text-2xl font-bold tracking-tight"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                  />
                </div>

                <div className="space-y-1.5">
                   <div className="flex items-center justify-between ml-1">
                     <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Module Content</label>
                     <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                        <button 
                          type="button"
                          onClick={() => setPreviewMode(false)}
                          className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${!previewMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >Source</button>
                        <button 
                          type="button"
                          onClick={() => setPreviewMode(true)}
                          className={`px-3 py-1 rounded text-[9px] font-bold uppercase tracking-widest transition-all ${previewMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                        >Visual</button>
                     </div>
                   </div>

                   {!previewMode ? (
                     <div className="space-y-2">
                        {/* Editor Toolbar */}
                        <div className="flex items-center flex-wrap gap-1 p-2 bg-slate-50 border border-slate-100 rounded-t-2xl border-b-0">
                           <button type="button" onClick={() => insertMarkdown('**', '**')} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Bold"><Bold size={14} /></button>
                           <button type="button" onClick={() => insertMarkdown('_', '_')} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Italic"><Italic size={14} /></button>
                           <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                           <button type="button" onClick={() => insertMarkdown('# ', '')} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="H1"><Heading1 size={14} /></button>
                           <button type="button" onClick={() => insertMarkdown('## ', '')} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="H2"><Heading2 size={14} /></button>
                           <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                           <button type="button" onClick={() => insertMarkdown('- ', '')} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="List"><ListIcon size={14} /></button>
                           <button type="button" onClick={() => insertMarkdown('```\n', '\n```')} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Code Block"><Code size={14} /></button>
                           <div className="w-[1px] h-4 bg-slate-200 mx-1" />
                           <button type="button" onClick={() => {
                             const url = prompt("Enter image URL:");
                             if (url) insertMarkdown(`![Alt Text](${url})`, '');
                           }} className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg transition-all" title="Insert Image"><ImageIcon size={14} /></button>
                        </div>
                        <textarea 
                          id="tutorial-content"
                          required
                          placeholder="# Start writing code..."
                          className="w-full px-6 py-6 bg-slate-50 rounded-b-2xl outline-none focus:ring-4 focus:ring-brand-primary/5 focus:bg-white border border-slate-100 focus:border-brand-primary/30 transition-all font-mono text-sm min-h-[500px] leading-relaxed"
                          value={formData.content}
                          onChange={(e) => setFormData({...formData, content: e.target.value})}
                        />
                     </div>
                   ) : (
                     <div className="w-full px-8 py-10 bg-white border border-slate-100 rounded-2xl min-h-[500px] shadow-inner font-sans">
                        <div className="markdown-body">
                          <ReactMarkdown>{formData.content}</ReactMarkdown>
                        </div>
                     </div>
                   )}
                </div>
             </div>
          </div>

          {/* Meta & Publish */}
          <div className="lg:col-span-4 space-y-8">
             <div className="sticky top-24 space-y-8">
               <div className="p-8 bg-white rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
                 <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-900 border-b border-slate-50 pb-2">Archival Attributes</h4>
                 
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Path Identifier</label>
                   <input 
                    type="text" 
                    required
                    disabled={!!editingId}
                    placeholder="module-slug"
                    className={`w-full p-2.5 rounded-lg border border-slate-100 outline-none transition-all text-xs font-bold ${editingId ? 'bg-slate-100 text-slate-400' : 'bg-slate-50 focus:bg-white focus:border-brand-primary/30'}`}
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                   />
                   {editingId && <p className="text-[9px] text-slate-400 ml-1 italic">Identifier is immutable once deployed.</p>}
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Domain</label>
                   <select 
                    required
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-100 focus:bg-white focus:border-brand-primary/30 outline-none transition-all text-xs font-bold"
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                   >
                     <option value="">Select Topic</option>
                     {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Abstract Summary</label>
                   <textarea 
                    placeholder="Concise overview..."
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-100 focus:bg-white focus:border-brand-primary/30 outline-none transition-all text-xs h-24 leading-relaxed"
                    value={formData.excerpt}
                    onChange={(e) => setFormData({...formData, excerpt: e.target.value})}
                   />
                 </div>

                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Nexus Sequence</label>
                   <input 
                    type="number" 
                    placeholder="0"
                    className="w-full p-2.5 bg-slate-50 rounded-lg border border-slate-100 focus:bg-white focus:border-brand-primary/30 outline-none transition-all text-xs font-bold"
                    value={formData.order_index}
                    onChange={(e) => setFormData({...formData, order_index: parseInt(e.target.value) || 0})}
                   />
                 </div>
               </div>

               <div className="space-y-4">
                  {status && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 text-xs font-bold ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {status.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      <span>{status.msg}</span>
                    </div>
                  )}
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full btn-primary py-4 flex items-center justify-center gap-3 shadow-lg shadow-brand-primary/10"
                  >
                    {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span className="uppercase tracking-widest text-xs font-bold">
                      {editingId ? 'Recalibrate Module' : 'Deploy Module'}
                    </span>
                  </button>
                  <p className="text-[9px] text-center text-slate-400 uppercase tracking-widest font-bold">Verification cycle required prior to archival.</p>
               </div>
             </div>
          </div>
        </form>
      )}
    </div>
  );
}
