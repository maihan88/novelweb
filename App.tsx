import React, { useMemo } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { StoryProvider } from './contexts/StoryContext';
import { CommentProvider } from './contexts/CommentContext';
import UserRoute from './components/UserRoute';
import AdminRoutes from './components/AdminRoutes';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import StoryDetailPage from './pages/StoryDetailPage';
import ReaderPage from './pages/ReaderPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import StoryEditPage from './pages/admin/StoryEditPage';
import ChapterEditPage from './pages/admin/ChapterEditPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import DonatePage from './pages/DonatePage';
import SearchPage from './pages/SearchPage';

const BackgroundDecoration = React.memo(() => (
  <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none select-none">
    {/* Họa tiết nhiễu hạt (Noise) */}
    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
    
    {/* Đốm sáng */}
    <div className="absolute top-[-10%] left-[-10%] w-[20rem] sm:w-[40rem] h-[20rem] sm:h-[40rem] bg-orange-400/20 dark:bg-orange-600/10 rounded-full blur-[60px] sm:blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob will-change-transform transform-gpu"></div>
    <div className="absolute top-[20%] right-[-10%] w-[18rem] sm:w-[35rem] h-[18rem] sm:h-[35rem] bg-amber-300/20 dark:bg-indigo-600/10 rounded-full blur-[60px] sm:blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000 will-change-transform transform-gpu"></div>
    <div className="absolute bottom-[-10%] left-[20%] w-[22rem] sm:w-[45rem] h-[22rem] sm:h-[45rem] bg-rose-300/20 dark:bg-rose-600/10 rounded-full blur-[60px] sm:blur-[100px] mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-4000 will-change-transform transform-gpu"></div>
  </div>
));

const AppContent: React.FC = () => {
  const location = useLocation();
  const isReaderPage = location.pathname.includes('/chapter/');

  // Tính toán class cho Main Content
  const mainClasses = useMemo(() => {
    // Base classes
    const baseClasses = 'flex-grow w-full relative z-10'; 
    
    if (isReaderPage) {
      return `${baseClasses}`; 
    }

    return `${baseClasses} container mx-auto max-w-7xl px-4 sm:px-6 md:px-6 py-8`;
  }, [isReaderPage]);
  
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-900 transition-colors duration-300 relative selection:bg-orange-500/30">
      
      <BackgroundDecoration />

      {/* CHỈ HIỆN HEADER KHI KHÔNG PHẢI TRANG ĐỌC */}
      {!isReaderPage && <Header />}
      
      <main className={mainClasses}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />}/>
          <Route path="/story/:storyId" element={<StoryDetailPage />} />
          
          {/* Reader Page Route */}
          <Route path="/story/:storyId/chapter/:chapterId" element={<ReaderPage />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/donate" element={<DonatePage />} />
          
          {/* User Routes */}
          <Route 
              path="/profile" 
              element={<UserRoute><ProfilePage /></UserRoute>} 
          />

          {/* Admin Routes */}
          <Route
              path="/admin/*"
              element={<ProtectedRoute><AdminRoutes /></ProtectedRoute>}
          />

          <Route
            path="/admin/story/edit/:storyId"
            element={<ProtectedRoute><StoryEditPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/story/new"
            element={<ProtectedRoute><StoryEditPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/story/:storyId/volume/:volumeId/chapter/new"
            element={<ProtectedRoute><ChapterEditPage /></ProtectedRoute>}
          />
          <Route
            path="/admin/story/:storyId/volume/:volumeId/chapter/edit/:chapterId"
            element={<ProtectedRoute><ChapterEditPage /></ProtectedRoute>}
          />
        </Routes>
      </main>
      
      {/* Ẩn Footer ở trang đọc để tập trung tối đa */}
      {!isReaderPage && <Footer />}
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserPreferencesProvider>
          <StoryProvider>
            <CommentProvider>
              <HashRouter>
                <AppContent />
              </HashRouter>
            </CommentProvider>
          </StoryProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
