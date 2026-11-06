import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Building2 } from 'lucide-react';
import { getDepartments, deleteDepartment, createDepartment } from '../api';
import PageHeader from '../components/PageHeader';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name_uz: '', name_ru: '', slug: '', icon: 'building' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      setDepartments(await getDepartments());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('O\'chirishni tasdiqlaysizmi?')) {
      await deleteDepartment(id);
      loadData();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createDepartment(formData);
      setIsModalOpen(false);
      setFormData({ name_uz: '', name_ru: '', slug: '', icon: 'building' });
      loadData();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Xatolik');
    }
  };

  if (loading) return <div className="text-white">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Bo'limlar" subtitle={`Jami: ${departments.length} ta`} />
        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-all">
          <Plus className="w-5 h-5" /> Yangi bo'lim
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {departments.map((dep, i) => (
          <motion.div
            key={dep._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card p-5 flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-white font-bold">{dep.name_uz}</h3>
                <p className="text-gray-400 text-sm">{dep.name_ru}</p>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg"><Edit className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(dep._id)} className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"><Trash2 className="w-4 h-4" /></button>
            </div>
          </motion.div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Yangi bo'lim</h2>
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