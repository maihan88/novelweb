import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StoryManagementPage from '../pages/admin/StoryManagementPage.tsx';
import StoryEditPage from '../pages/admin/StoryEditPage.tsx';
import ChapterEditPage from '../pages/admin/ChapterEditPage.tsx';
import BannerManagementPage from '../pages/admin/BannerManagementPage.tsx';
import FeaturedManagementPage from '../pages/admin/FeaturedManagementPage.tsx';

const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<StoryManagementPage />} />
      <Route path="/banners" element={<BannerManagementPage />} />
      <Route path="/featured" element={<FeaturedManagementPage />} />
      <Route path="/story/edit/:storyId" element={<StoryEditPage />} />
      <Route path="/story/new" element={<StoryEditPage />} />
      <Route path="/story/:storyId/volume/:volumeId/chapter/new" element={<ChapterEditPage />} />
      <Route path="/story/:storyId/volume/:volumeId/chapter/edit/:chapterId" element={<ChapterEditPage />} />
    </Routes>
  );
};

export default AdminRoutes;