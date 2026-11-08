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

function App() {
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('admin_token'));

  // ⚡ Tilni global holatda ishga tushirish (localStorage dan o'qiydi)
  useLang();

  // Boshqa tabda login/logout bo'lsa holatni yangilash
  useEffect(() => {
    const sync = () => setIsAuth(!!localStorage.getItem('admin_token'));
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isAuth ? <Navigate to="/" replace /> : <LoginPage onLogin={() => setIsAuth(true)} />
            }
          />

          <Route
            element={
              isAuth ? <Layout onLogout={() => setIsAuth(false)} /> : <Navigate to="/login" replace />
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