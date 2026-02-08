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

// Đã xóa component BackgroundDecoration theo yêu cầu

const AppContent: React.FC = () => {
  const location = useLocation();
  // Kiểm tra xem có phải đang ở trang đọc truyện không (để ẩn Header/Footer)
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
    // THAY ĐỔI: Sử dụng biến màu semantic sukem-* thay vì slate-*
    // bg-sukem-bg: Tự động đổi Cream (Sáng) / Espresso (Tối)
    // text-sukem-text: Tự động đổi Nâu (Sáng) / Trắng ngà (Tối)
    <div className="min-h-screen flex flex-col font-sans bg-sukem-bg text-sukem-text transition-colors duration-300 relative selection:bg-sukem-primary/30 selection:text-sukem-primary">
      
      {/* Đã xóa <BackgroundDecoration /> */}

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