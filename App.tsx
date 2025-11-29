import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext.tsx';
import { StoryProvider } from './contexts/StoryContext.tsx';
import { CommentProvider } from './contexts/CommentContext.tsx';
import UserRoute from './components/UserRoute.tsx';
import AdminRoutes from './components/AdminRoutes.tsx';
import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import HomePage from './pages/HomePage.tsx';
import StoryDetailPage from './pages/StoryDetailPage.tsx';
import ReaderPage from './pages/ReaderPage.tsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.tsx';
import StoryEditPage from './pages/admin/StoryEditPage.tsx';
import ChapterEditPage from './pages/admin/ChapterEditPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import DonatePage from './pages/DonatePage.tsx';
import SearchPage from './pages/SearchPage.tsx';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isReaderPage = location.pathname.includes('/chapter/');

  const mainClasses = [
    'flex-grow',
    'w-full',
    isReaderPage ? '' : 'container mx-auto max-w-7xl px-4 sm:px-6 md:px-6 py-6'
  ].join(' ');
  
  return (
    <div key={location.pathname} className="min-h-screen flex flex-col font-sans text-slate-800 dark:text-slate-200">
      <Header />
      <main className={mainClasses}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />}/>
          <Route path="/story/:storyId" element={<StoryDetailPage />} />
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
              path="/admin/*" // Dùng * để bảo vệ tất cả các route con của admin
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
      <Footer />
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
