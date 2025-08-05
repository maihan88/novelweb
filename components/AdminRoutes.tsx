import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage.tsx';
import StoryEditPage from '../pages/admin/StoryEditPage.tsx';
import ChapterEditPage from '../pages/admin/ChapterEditPage.tsx';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminDashboardPage />} />
      <Route path="/story/edit/:storyId" element={<StoryEditPage />} />
      <Route path="/story/new" element={<StoryEditPage />} />
      <Route path="/story/:storyId/volume/:volumeId/chapter/new" element={<ChapterEditPage />} />
      <Route path="/story/:storyId/volume/:volumeId/chapter/edit/:chapterId" element={<ChapterEditPage />} />
    </Routes>
  );
};

export default AdminRoutes;