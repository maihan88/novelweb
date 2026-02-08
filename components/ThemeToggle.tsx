import React from 'react';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full transition-all duration-300
                 bg-sukem-bg text-sukem-text hover:bg-sukem-accent hover:text-white
                 border border-sukem-border shadow-sm group"
      title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
    >
      {theme === 'light' ? (
        <SunIcon className="h-5 w-5 transition-transform group-hover:rotate-45" />
      ) : (
        <MoonIcon className="h-5 w-5 transition-transform group-hover:-rotate-12" />
      )}
    </button>
  );
};

export default ThemeToggle;