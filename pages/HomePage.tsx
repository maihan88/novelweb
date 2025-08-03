import React, { useState, useEffect } from 'react';
import StoryCard from '../components/StoryCard';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { Story } from '../types';

const HomePage: React.FC = () => {
  const [data, setData] = useState<{ stories: Story[], totalPages: number }>({ stories: [], totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:3001/api/stories?page=${currentPage}&q=${searchTerm}`);
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch stories:", error);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timerId = setTimeout(() => {
      fetchStories();
    }, 500); // Chờ 500ms sau khi người dùng ngừng gõ rồi mới tìm kiếm

    return () => clearTimeout(timerId);
  }, [currentPage, searchTerm]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <input
          type="text"
          placeholder="Tìm kiếm truyện, tác giả..."
          className="w-full p-3 border rounded-md bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
          }}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><LoadingSpinner /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.stories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={data.totalPages}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
};

export default HomePage;
