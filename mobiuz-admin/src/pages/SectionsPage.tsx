import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, FileText, Globe, Lock } from 'lucide-react';
import { getSections, deleteSection, createSection } from '../api';
import PageHeader from '../components/PageHeader';

export default function SectionsPage() {
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title_uz: '', title_ru: '', content_uz: '', content_ru: '',
    icon: 'file', order: 1, is_public: true,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setSections(await getSections()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('O\'chirishni tasdiqlaysizmi?')) { await deleteSection(id); loadData(); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSection(formData);
      setIsModalOpen(false);
      setFormData({ title_uz: '', title_ru: '', content_uz: '', content_ru: '', icon: 'file', order: 1, is_public: true });
      loadData();
    } catch (error: any) { alert(error.response?.data?.error || 'Xatolik'); }
  };

  if (loading) return <div className="text-white">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Maqolalar" subtitle={`Jami: ${sections.length} ta`} />
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-all">
          <Plus className="w-5 h-5" /> Yangi maqola
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sections.map((sec, i) => (
          <motion.div
            key={sec._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-5 relative group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex items-center gap-2">
                {sec.is_public ? (
                  <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full"><Globe className="w-3 h-3" /> Hamma</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full"><Lock className="w-3 h-3" /> Maxfiy</span>
                )}
              </div>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">{sec.title_uz}</h3>
            <p className="text-gray-400 text-sm line-clamp-2">{sec.content_uz}</p>
            
            <button onClick={() => handleDelete(sec._id)} className="absolute bottom-4 right-4 p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold text-white mb-4">Yangi maqola</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Sarlavha (UZ)" value={formData.title_uz} onChange={(e) => setFormData({ ...formData, title_uz: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none" required />
                <input type="text" placeholder="Sarlavha (RU)" value={formData.title_ru} onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none" required />
              </div>
              <textarea placeholder="Matn (UZ)" value={formData.content_uz} onChange={(e) => setFormData({ ...formData, content_uz: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none h-32" required />
              <textarea placeholder="Matn (RU)" value={formData.content_ru} onChange={(e) => setFormData({ ...formData, content_ru: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none h-32" required />
              
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-white cursor-pointer">
                  <input type="checkbox" checked={formData.is_public} onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })} className="w-5 h-5 rounded accent-red-600" />
                  Hamma ko'radimi?
                </label>
                <input type="number" placeholder="Tartib" value={formData.order} onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })} className="w-24 bg-gray-800 text-white p-2 rounded-xl outline-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-700 text-white py-2 rounded-xl font-medium">Bekor qilish</button>
                <button type="submit" className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold">Saqlash</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}