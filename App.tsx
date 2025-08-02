

import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { StoryProvider } from './contexts/StoryContext.tsx';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext.tsx';
import { CommentProvider } from './contexts/CommentContext.tsx';

import Header from './components/Header.tsx';
import Footer from './components/Footer.tsx';
import HomePage from './pages/HomePage.tsx';
import StoryDetailPage from './pages/StoryDetailPage.tsx';
import ReaderPage from './pages/ReaderPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import AdminDashboardPage from './pages/admin/AdminDashboardPage.tsx';
import StoryEditPage from './pages/admin/StoryEditPage.tsx';
import ChapterEditPage from './pages/admin/ChapterEditPage.tsx';
import ProfilePage from './pages/ProfilePage.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isReaderPage = location.pathname.includes('/chapter/');
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const mainClasses = [
    'flex-grow',
    'w-full',
    (isReaderPage || isAuthPage) ? '' : 'container mx-auto px-4 sm:px-6 md:px-8 py-8'
  ].join(' ');
  
  const showHeaderFooter = !isAuthPage;

  return (
    <div key={location.pathname} className="min-h-screen flex flex-col font-sans text-slate-800 dark:text-slate-200">
      {showHeaderFooter && <Header />}
      <main className={mainClasses}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/story/:storyId" element={<StoryDetailPage />} />
          <Route path="/story/:storyId/chapter/:chapterId" element={<ReaderPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={<ProtectedRoute><AdminDashboardPage /></ProtectedRoute>}
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
      {showHeaderFooter && <Footer />}
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoryProvider>
          <UserPreferencesProvider>
            <CommentProvider>
              <HashRouter>
                <AppContent />
              </HashRouter>
            </CommentProvider>
          </UserPreferencesProvider>
        </StoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;