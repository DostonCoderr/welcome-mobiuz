import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, CheckCircle, Clock, User } from 'lucide-react';
import { api } from '../api';
import PageHeader from '../components/PageHeader';

export default function FeedbacksPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/feedbacks');
      setFeedbacks(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const markAsRead = async (id: string) => {
    await api.patch(`/feedbacks/${id}/read`);
    loadData();
  };

  if (loading) return <div className="text-white">Yuklanmoqda...</div>;

  return (
    <div>
      <PageHeader title="Fikrlar" subtitle={`Jami: ${feedbacks.length} ta`} />
      
      <div className="space-y-4">
        {feedbacks.map((fb, i) => (
          <motion.div
            key={fb._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`card p-5 relative ${!fb.is_read ? 'border-l-4 border-l-red-500' : ''}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">
                    {fb.employee?.passport || 'Noma\'lum xodim'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {new Date(fb.createdAt).toLocaleDateString('uz-UZ')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4"
                    style={{
                      color: star <= fb.rating ? '#fbbf24' : '#4b5563',
                      fill: star <= fb.rating ? '#fbbf24' : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>

            <p className="text-gray-300 text-sm mb-3">{fb.comment}</p>

            <div className="flex items-center justify-between">
              <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">
                {fb.category}
              </span>
              {!fb.is_read ? (
                <button
                  onClick={() => markAsRead(fb._id)}
                  className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300"
                >
                  <CheckCircle className="w-3 h-3" /> O'qilgan
                </button>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" /> O'qilgan
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}