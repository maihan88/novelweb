import React, { useMemo } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { UserPreferencesProvider } from './contexts/UserPreferencesContext';
import { StoryProvider } from './contexts/StoryContext';
import { CommentProvider } from './contexts/CommentContext';
import { ToastProvider } from './contexts/ToastContext';

// Components
import UserRoute from './components/UserRoute';
import AdminRoutes from './components/AdminRoutes';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import StoryDetailPage from './pages/StoryDetailPage';
import ReaderPage from './pages/ReaderPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import SearchPage from './pages/SearchPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isReaderPage = location.pathname.includes('/chapter/');

  const mainClasses = useMemo(() => {
    const baseClasses = 'flex-grow w-full relative z-10'; 
    
    if (isReaderPage) {
      return baseClasses; 
    }

    return `${baseClasses} container mx-auto max-w-7xl sm:px-6 md:px-6 py-8`;
  }, [isReaderPage]);
  
  return (
    <div className="min-h-screen flex flex-col font-sans bg-sukem-bg text-sukem-text transition-colors duration-300 relative selection:bg-sukem-primary/30 selection:text-sukem-primary">
      {!isReaderPage && <Header />}
      
      <main className={mainClasses}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />}/>
          <Route path="/story/:storyId" element={<StoryDetailPage />} />
          <Route path="/story/:storyId/chapter/:chapterId" element={<ReaderPage />} />
          
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected Route cho User */}
          <Route 
              path="/profile" 
              element={
                <UserRoute>
                  <ProfilePage />
                </UserRoute>
              } 
          />
          {/* Routes cho Admin */}
          <Route
              path="/admin/*"
              element={
                <ProtectedRoute>
                  <AdminRoutes />
                </ProtectedRoute>
              }
          />

          {/* Static Pages */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </main>
      
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
              <ToastProvider>
                <HashRouter>
                  <AppContent />
                </HashRouter>
              </ToastProvider>
            </CommentProvider>
          </StoryProvider>
        </UserPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;