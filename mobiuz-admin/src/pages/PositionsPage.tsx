import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Briefcase } from 'lucide-react';
import { getPositions, deletePosition, createPosition } from '../api';
import PageHeader from '../components/PageHeader';

export default function PositionsPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name_uz: '', name_ru: '', slug: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { setPositions(await getPositions()); } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('O\'chirishni tasdiqlaysizmi?')) { await deletePosition(id); loadData(); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPosition(formData);
      setIsModalOpen(false);
      setFormData({ name_uz: '', name_ru: '', slug: '' });
      loadData();
    } catch (error: any) { alert(error.response?.data?.error || 'Xatolik'); }
  };

  if (loading) return <div className="text-white">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Lavozimlar" subtitle={`Jami: ${positions.length} ta`} />
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-all">
          <Plus className="w-5 h-5" /> Yangi lavozim
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-4 text-left text-gray-300">Lavozim (UZ)</th>
              <th className="p-4 text-left text-gray-300">Lavozim (RU)</th>
              <th className="p-4 text-left text-gray-300">Slug</th>
              <th className="p-4 text-left text-gray-300">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((pos, i) => (
              <motion.tr key={pos._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-t border-gray-800 hover:bg-gray-800/50">
                <td className="p-4 text-white font-medium flex items-center gap-3">
                  <Briefcase className="w-4 h-4 text-red-500" /> {pos.name_uz}
                </td>
                <td className="p-4 text-gray-400">{pos.name_ru}</td>
                <td className="p-4 text-gray-400 font-mono text-sm">{pos.slug}</td>
                <td className="p-4">
                  <button onClick={() => handleDelete(pos._id)} className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Yangi lavozim</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input type="text" placeholder="Nomi (UZ)" value={formData.name_uz} onChange={(e) => setFormData({ ...formData, name_uz: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none" required />
              <input type="text" placeholder="Nomi (RU)" value={formData.name_ru} onChange={(e) => setFormData({ ...formData, name_ru: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none" required />
              <input type="text" placeholder="Slug (english)" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none" required />
              <div className="flex gap-3">
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