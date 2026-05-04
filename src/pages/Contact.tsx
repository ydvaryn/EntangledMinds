import { useState } from 'react';
import { Mail, Send, MapPin, Phone, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'contact_messages'), {
        ...formData,
        status: 'new',
        created_at: serverTimestamp()
      });
      setSent(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error("Contact submission error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-12">
           <div className="space-y-6">
              <h1 className="text-7xl font-serif font-bold italic leading-tight">Sync your <span className="text-brand-amber">Thoughts</span>.</h1>
              <p className="text-xl text-brand-blue/60 leading-relaxed max-w-lg">
                Have questions about a tutorial or suggestions for a new topic? Reach out to the EntangledMinds collective.
              </p>
           </div>

           <div className="space-y-8">
              {[
                { icon: <Mail />, label: "Signals", val: "collective@entangledminds.edu" },
                { icon: <MessageSquare />, label: "Direct Feed", val: "Available via community forums" }
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-6">
                  <div className="w-12 h-12 rounded-2xl bg-brand-blue text-brand-cream flex items-center justify-center shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-brand-blue/40 mb-1">{item.label}</h4>
                    <p className="text-xl font-medium text-brand-blue">{item.val}</p>
                  </div>
                </div>
              ))}
           </div>
        </div>

        <div className="bg-white p-12 md:p-16 rounded-[3rem] shadow-2xl border border-brand-blue/5 relative">
          {sent ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center py-20 space-y-6"
            >
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={40} />
              </div>
              <h3 className="text-3xl font-serif font-bold">Signal Received.</h3>
              <p className="text-brand-blue/60">Your query has been archived and sent to the processing queue.</p>
              <button onClick={() => setSent(false)} className="btn-secondary">Send Another Signal</button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/40 ml-2">Identity</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Your Name"
                    className="w-full px-6 py-4 bg-brand-blue/5 rounded-2xl outline-none focus:bg-white border-transparent focus:ring-2 focus:ring-brand-amber/20 transition-all font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/40 ml-2">Address</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="name@matrix.com"
                    className="w-full px-6 py-4 bg-brand-blue/5 rounded-2xl outline-none focus:bg-white border-transparent focus:ring-2 focus:ring-brand-amber/20 transition-all font-medium"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/40 ml-2">Subject Header</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Query Metadata"
                    className="w-full px-6 py-4 bg-brand-blue/5 rounded-2xl outline-none focus:bg-white border-transparent focus:ring-2 focus:ring-brand-amber/20 transition-all font-medium"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  />
              </div>

              <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-blue/40 ml-2">Transmission Data</label>
                  <textarea 
                    required 
                    placeholder="What's on your mind?"
                    className="w-full px-6 py-4 bg-brand-blue/5 rounded-2xl outline-none focus:bg-white border-transparent focus:ring-2 focus:ring-brand-amber/20 transition-all font-medium h-40 resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full btn-primary py-5 text-lg font-serif flex items-center justify-center space-x-2"
              >
                {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                <span>Send Signal</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
