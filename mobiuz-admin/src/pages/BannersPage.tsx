import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { getBanners, deleteBanner, createBanner } from '../api';
import PageHeader from '../components/PageHeader';

export default function BannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title_uz: '', title_ru: '', description_uz: '', description_ru: '',
    link: '/', image: '', order: 1, is_active: true,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setBanners(await getBanners()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('O\'chirishni tasdiqlaysizmi?')) { await deleteBanner(id); loadData(); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBanner(formData);
      setIsModalOpen(false);
      setFormData({ title_uz: '', title_ru: '', description_uz: '', description_ru: '', link: '/', image: '', order: 1, is_active: true });
      loadData();
    } catch (error: any) { alert(error.response?.data?.error || 'Xatolik'); }
  };

  if (loading) return <div className="text-white">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Yangiliklar" subtitle={`Jami: ${banners.length} ta`} />
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-all">
          <Plus className="w-5 h-5" /> Yangi banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {banners.map((banner, i) => (
          <motion.div
            key={banner._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card overflow-hidden group relative"
          >
            {/* Rasm */}
            <div className="h-40 bg-gray-800 flex items-center justify-center relative">
              {banner.image ? (
                <img src={banner.image} alt={banner.title_uz} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-10 h-10 text-gray-600" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <h3 className="text-white font-bold">{banner.title_uz}</h3>
                <p className="text-gray-300 text-xs line-clamp-1">{banner.description_uz}</p>
              </div>
            </div>
            
            <button onClick={() => handleDelete(banner._id)} className="absolute top-3 right-3 p-2 bg-black/50 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
              <Trash2 className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 w-full max-w-2xl my-8">
            <h2 className="text-xl font-bold text-white mb-4">Yangi banner</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Sarlavha (UZ)" value={formData.title_uz} onChange={(e) => setFormData({ ...formData, title_uz: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none" required />
                <input type="text" placeholder="Sarlavha (RU)" value={formData.title_ru} onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="Tavsif (UZ)" value={formData.description_uz} onChange={(e) => setFormData({ ...formData, description_uz: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none" />
                <input type="text" placeholder="Tavsif (RU)" value={formData.description_ru} onChange={(e) => setFormData({ ...formData, description_ru: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none" />
              </div>
              <input type="text" placeholder="Rasm URL (yoki nomi)" value={formData.image} onChange={(e) => setFormData({ ...formData, image: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none" />
              <input type="text" placeholder="Havola (masalan: /news)" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none" />
              
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