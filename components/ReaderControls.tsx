import React, { useState } from 'react';
import { ReaderPreferences, ReaderFont } from '../types';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface ReaderControlsProps {
  preferences: ReaderPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<ReaderPreferences>>;
  isAutoScrolling: boolean;
  toggleAutoScroll: () => void;
}

const ReaderControls: React.FC<ReaderControlsProps> = ({ preferences, setPreferences, isAutoScrolling, toggleAutoScroll }) => {
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  const handleFontSizeChange = (amount: number) => {
    setPreferences(p => ({ ...p, fontSize: Math.max(12, Math.min(32, p.fontSize + amount)) }));
  };

  const handleFontFamilyChange = (font: ReaderFont) => {
    setPreferences(p => ({ ...p, fontFamily: font }));
  };
  
  const handleLineHeightChange = (amount: number) => {
    setPreferences(p => ({ ...p, lineHeight: Math.max(1.4, Math.min(2.2, p.lineHeight + amount)) }));
  };

  const MobileControlPanel = () => (
    <div className="flex flex-col gap-4">
      {/* Font Size */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Cỡ chữ</span>
        <div className="flex items-center gap-1 p-1 bg-orange-200/70 dark:bg-amber-400/50 rounded-full">
            <button onClick={() => handleFontSizeChange(-1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-amber-50 dark:hover:bg-stone-600 transition-colors" aria-label="Giảm cỡ chữ">A-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.fontSize}px</span>
            <button onClick={() => handleFontSizeChange(1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-amber-50 dark:hover:bg-stone-600 transition-colors" aria-label="Tăng cỡ chữ">A+</button>
        </div>
      </div>
      {/* Font Family */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Phông chữ</span>
        <div className="flex items-center gap-1 p-1 bg-orange-200/70 dark:bg-stone-700/70 rounded-full">
            <button onClick={() => handleFontFamilyChange('font-serif')} className={`px-4 py-1.5 rounded-full text-sm transition-colors ${preferences.fontFamily === 'font-serif' ? 'bg-orange-400 dark:bg-amber-300/50 text-white shadow' : 'hover:bg-amber-50 dark:hover:bg-stone-600'}`} aria-label="Font Serif"><span className="font-serif">Serif</span></button>
            <button onClick={() => handleFontFamilyChange('font-sans')} className={`px-4 py-1.5 rounded-full text-sm transition-colors ${preferences.fontFamily === 'font-sans' ? 'bg-orange-400 dark:bg-amber-300/50 text-white shadow' : 'hover:bg-amber-50 dark:hover:bg-stone-600'}`} aria-label="Font Sans-serif"><span className="font-sans">Sans</span></button>
        </div>
      </div>
       {/* Line Height */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Giãn dòng</span>
        <div className="flex items-center gap-1 p-1 bg-orange-200/70 dark:bg-stone-700/70 rounded-full">
            <button onClick={() => handleLineHeightChange(-0.1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-amber-50 dark:hover:bg-stone-600 transition-colors" aria-label="Giảm giãn dòng">-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.lineHeight.toFixed(1)}</span>
            <button onClick={() => handleLineHeightChange(0.1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-amber-50 dark:hover:bg-stone-600 transition-colors" aria-label="Tăng giãn dòng">+</button>
        </div>
      </div>
       {/* Auto Scroll */}
       <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-600 pt-3 mt-1">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Tự động cuộn</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={isAutoScrolling} onChange={toggleAutoScroll} className="sr-only peer" />
          <div className="w-11 h-6 bg-orange-200 peer-focus:outline-none rounded-full peer dark:bg-stone-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-orange-400 dark:peer-checked:bg-amber-300/50"></div>
        </label>
      </div>
    </div>
  );
  
  const DesktopControlBar = () => (
      <div className="flex flex-wrap justify-center items-center gap-x-1 sm:gap-x-2 gap-y-1">
        {/* Font Size */}
        <div className="flex items-center gap-1">
          <button onClick={() => handleFontSizeChange(-1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" aria-label="Giảm cỡ chữ">A-</button>
          <span className="text-sm w-6 text-center">{preferences.fontSize}px</span>
          <button onClick={() => handleFontSizeChange(1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" aria-label="Tăng cỡ chữ">A+</button>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>

        {/* Font Family */}
        <div className="flex items-center gap-1">
          <button onClick={() => handleFontFamilyChange('font-serif')} className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${preferences.fontFamily === 'font-serif' ? 'text-orange-500' : ''}`} aria-label="Font Serif">
            <span className="font-serif">Ag</span>
          </button>
          <button onClick={() => handleFontFamilyChange('font-sans')} className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${preferences.fontFamily === 'font-sans' ? 'text-orange-500' : ''}`} aria-label="Font Sans-serif">
            <span className="font-sans">Ag</span>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
        
        {/* Line Height */}
        <div className="flex items-center gap-1">
          <button onClick={() => handleLineHeightChange(-0.1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" aria-label="Giảm giãn dòng">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16M10 3v18m4-18v18" /></svg>
          </button>
          <span className="text-sm w-8 text-center">{preferences.lineHeight.toFixed(1)}</span>
          <button onClick={() => handleLineHeightChange(0.1)} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" aria-label="Tăng giãn dòng">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600"></div>
        
        {/* Auto Scroll */}
        <button onClick={toggleAutoScroll} className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${isAutoScrolling ? 'text-orange-500' : ''}`} aria-label="Tự động cuộn">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
  );

  return (
    <>
      {/* MOBILE & TABLET VIEW */}
      <div className="md:hidden">
        {isControlsOpen && (
            <div
                className="fixed inset-0 bg-black/20 z-40"
                onClick={() => setIsControlsOpen(false)}
                aria-hidden="true"
            />
        )}
        {/* --- SỬA ĐỔI CHÍNH NẰM Ở ĐÂY --- */}
        {/* Bỏ các class flexbox: flex flex-col items-end gap-3 */}
        <div className="fixed bottom-5 right-5 z-50">
             {/* Thêm class `absolute` và định vị cho panel */}
             <div
                className={`
                    absolute bottom-20 right-0
                    w-72 bg-white/80 dark:bg-stone-800/80 backdrop-blur-md shadow-2xl rounded-2xl p-4
                    transition-all duration-300 ease-in-out origin-bottom-right
                    ${isControlsOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                `}
              >
                <MobileControlPanel />
            </div>
            <button
                onClick={() => setIsControlsOpen(p => !p)}
                className="h-16 w-16 rounded-full bg-orange-400 text-white flex items-center justify-center shadow-lg transition-transform duration-200 ease-in-out transform hover:scale-105 active:scale-95"
                aria-label={isControlsOpen ? 'Đóng cài đặt' : 'Mở cài đặt'}
            >
                {isControlsOpen ? <XMarkIcon className="h-7 w-7" /> : <SparklesIcon className="h-7 w-7" />}
            </button>
        </div>
      </div>
      
      {/* DESKTOP VIEW */}
      <div className="hidden md:block fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg rounded-full p-2 border border-gray-200 dark:border-gray-700 z-50">
        <DesktopControlBar/>
      </div>
    </>
  );
};

export default ReaderControls;
