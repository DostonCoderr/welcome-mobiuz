import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit, Search } from 'lucide-react';
import { getEmployees, deleteEmployee, createEmployee } from '../api';
import PageHeader from '../components/PageHeader';

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form ma'lumotlari
  const [formData, setFormData] = useState({
    passport: '',
    birth_date: '',
    full_name: '',
    telegram_id: '',
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('O\'chirishni tasdiqlaysizmi?')) {
      await deleteEmployee(id);
      loadEmployees();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createEmployee(formData);
      setIsModalOpen(false);
      setFormData({ passport: '', birth_date: '', full_name: '', telegram_id: '' });
      loadEmployees();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Xatolik');
    }
  };

  const filtered = employees.filter(emp => 
    emp.passport.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-white">Yuklanmoqda...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <PageHeader title="Xodimlar" subtitle={`Jami: ${employees.length} ta`} />
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-bold transition-all"
        >
          <Plus className="w-5 h-5" />
          Yangi xodim
        </button>
      </div>

      {/* Qidiruv */}
      <div className="card p-4 mb-6 flex items-center gap-3">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Passport bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-white outline-none"
        />
      </div>

      {/* Jadval */}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-800">
            <tr>
              <th className="p-4 text-left text-gray-300">Passport</th>
              <th className="p-4 text-left text-gray-300">Tug'ilgan sana</th>
              <th className="p-4 text-left text-gray-300">Telegram ID</th>
              <th className="p-4 text-left text-gray-300">Amallar</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, i) => (
              <motion.tr
                key={emp._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="border-t border-gray-800 hover:bg-gray-800/50"
              >
                <td className="p-4 text-white font-medium">{emp.passport}</td>
                <td className="p-4 text-gray-400">{emp.birth_date}</td>
                <td className="p-4 text-gray-400">{emp.telegram_id || '-'}</td>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <button className="text-blue-400 hover:text-blue-300">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp._id)}
                      className="text-red-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal (Yangi xodim qo'shish) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="card p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold text-white mb-4">Yangi xodim</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                type="text"
                placeholder="Passport (AA1234567)"
                value={formData.passport}
                onChange={(e) => setFormData({ ...formData, passport: e.target.value.toUpperCase() })}
                className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none"
                required
              />
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none"
                required
              />
              <input
                type="text"
                placeholder="To'liq ism (ixtiyoriy)"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-gray-800 text-white p-3 rounded-xl outline-none"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-gray-700 text-white py-2 rounded-xl font-medium"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white py-2 rounded-xl font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}