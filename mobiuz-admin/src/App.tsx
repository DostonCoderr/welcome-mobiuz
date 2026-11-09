import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';
import { useLang } from './hooks/useLang'; // ⚡ Yangi import
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import DepartmentsPage from './pages/DepartmentsPage';
import PositionsPage from './pages/PositionsPage';
import SectionsPage from './pages/SectionsPage';
import BannersPage from './pages/BannersPage';
import FeedbacksPage from './pages/FeedbacksPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import { getMe } from './api'; // 

function App() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'auth' | 'noauth'>('loading');


  // ⚡ Tilni global holatda ishga tushirish (localStorage dan o'qiydi)
  useLang();

useEffect(() => {
    // Sahifa yuklanganda cookie orqali tekshiramiz
    const checkAuth = async () => {
      try {
        const user = await getMe(); // Cookie avtomatik yuboriladi
        if (user) {
          setAuthStatus('auth');
          // Profil ma'lumotlarini yangilab qo'yamiz
          localStorage.setItem('admin_user', JSON.stringify(user));
        } else {
          setAuthStatus('noauth');
        }
      } catch (error) {
        // Agar 401 bo'lsa, demak cookie yo'q yoki muddati o'tgan
        setAuthStatus('noauth');
        localStorage.removeItem('admin_user');
      }
    };
    checkAuth();
  }, []);


   // ⚡ API javobini kutayotganda yuklanish ekranini ko'rsatamiz
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#07080b] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div>
      </div>
    );
  }



  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
         <Route
            path="/login"
            element={
              authStatus === 'auth' ? <Navigate to="/" replace /> : <LoginPage onLogin={() => setAuthStatus('auth')} />
            }
          />

          <Route
            element={
              authStatus === 'auth' ? <Layout onLogout={() => setAuthStatus('noauth')} /> : <Navigate to="/login" replace />
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route path="/departments" element={<DepartmentsPage />} />
            <Route path="/positions" element={<PositionsPage />} />
            <Route path="/sections" element={<SectionsPage />} />
            <Route path="/banners" element={<BannersPage />} />
            <Route path="/feedbacks" element={<FeedbacksPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;