import React, { useState } from 'react';
import { ReaderPreferences, ReaderFont } from '../types';
import { SparklesIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { AdjustmentsHorizontalIcon, ArrowDownIcon } from '@heroicons/react/24/outline'; // Giữ lại AdjustmentsHorizontalIcon

// === BỎ PROPS LIÊN QUAN AUTO SCROLL ===
interface ReaderControlsProps {
  preferences: ReaderPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<ReaderPreferences>>;
  // isAutoScrolling: boolean; // Bỏ
  // toggleAutoScroll: () => void; // Bỏ
}
// === KẾT THÚC ===

const ReaderControls: React.FC<ReaderControlsProps> = ({ preferences, setPreferences }) => { // Bỏ props khỏi destructuring
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
    <div className="flex flex-col gap-y-5">
      {/* Font Size */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Cỡ chữ</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            <button data-control-button onClick={() => handleFontSizeChange(-1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors" aria-label="Giảm cỡ chữ">A-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.fontSize}px</span>
            <button data-control-button onClick={() => handleFontSizeChange(1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors" aria-label="Tăng cỡ chữ">A+</button>
        </div>
      </div>

      {/* Font Family */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Phông chữ</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            <button data-control-button onClick={() => handleFontFamilyChange('font-serif')} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${preferences.fontFamily === 'font-serif' ? 'bg-orange-400 dark:bg-amber-500/80 text-white dark:text-stone-900 shadow' : 'hover:bg-white dark:hover:bg-stone-600'}`} aria-label="Font Serif"><span className="font-serif">Serif</span></button>
            <button data-control-button onClick={() => handleFontFamilyChange('font-sans')} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${preferences.fontFamily === 'font-sans' ? 'bg-orange-400 dark:bg-amber-500/80 text-white dark:text-stone-900 shadow' : 'hover:bg-white dark:hover:bg-stone-600'}`} aria-label="Font Sans-serif"><span className="font-sans">Sans</span></button>
            <button data-control-button onClick={() => handleFontFamilyChange('font-mono')} className={`px-3 py-1.5 rounded-full text-sm transition-colors ${preferences.fontFamily === 'font-mono' ? 'bg-orange-400 dark:bg-amber-500/80 text-white dark:text-stone-900 shadow' : 'hover:bg-white dark:hover:bg-stone-600'}`} aria-label="Font Mono"><span className="font-mono">Mono</span></button>
        </div>
      </div>

       {/* Line Height */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Giãn dòng</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            <button data-control-button onClick={() => handleLineHeightChange(-0.1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors" aria-label="Giảm giãn dòng">-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.lineHeight.toFixed(1)}</span>
            <button data-control-button onClick={() => handleLineHeightChange(0.1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors" aria-label="Tăng giãn dòng">+</button>
        </div>
      </div>

       {/* === BỎ AUTO SCROLL (MOBILE) === */}
       {/* <div className="flex items-center justify-between border-t border-slate-200 dark:border-stone-600 pt-3 mt-1">...</div> */}
       {/* === KẾT THÚC === */}
    </div>
  );

  const fontButtonClass = (font: ReaderFont) => `
     data-control-button px-3 py-1.5 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400 dark:focus:ring-offset-stone-800
     ${preferences.fontFamily === font
       ? 'bg-orange-100 dark:bg-amber-900/60 text-orange-700 dark:text-amber-200 font-semibold shadow-inner'
       : 'text-slate-600 dark:text-stone-300 hover:bg-slate-200 dark:hover:bg-stone-600/70'
     }
   `;

  const DesktopControlBar = () => (
      <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 p-2 bg-white/90 dark:bg-stone-800/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200 dark:border-stone-700">
        {/* Font Size */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-stone-700 rounded-full p-1">
          <button data-control-button onClick={() => handleFontSizeChange(-1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors text-slate-600 dark:text-stone-300" aria-label="Giảm cỡ chữ">
              <span className="text-xs font-semibold">A-</span>
          </button>
          <span className="text-xs w-8 text-center font-medium text-slate-700 dark:text-stone-200">{preferences.fontSize}px</span>
          <button data-control-button onClick={() => handleFontSizeChange(1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors text-slate-600 dark:text-stone-300" aria-label="Tăng cỡ chữ">
               <span className="text-xs font-semibold">A+</span>
          </button>
        </div>

        {/* Font Family */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-stone-700 rounded-full p-1">
          <button onClick={() => handleFontFamilyChange('font-serif')} className={fontButtonClass('font-serif')} aria-label="Font Serif">
            <span className="font-serif">Serif</span>
          </button>
          <button onClick={() => handleFontFamilyChange('font-sans')} className={fontButtonClass('font-sans')} aria-label="Font Sans-serif">
            <span className="font-sans">Sans</span>
          </button>
          <button onClick={() => handleFontFamilyChange('font-mono')} className={fontButtonClass('font-mono')} aria-label="Font Mono">
            <span className="font-mono">Mono</span>
          </button>
        </div>

        {/* Line Height */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-stone-700 rounded-full p-1">
          <button data-control-button onClick={() => handleLineHeightChange(-0.1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors text-slate-600 dark:text-stone-300" aria-label="Giảm giãn dòng">
            <AdjustmentsHorizontalIcon className="h-4 w-4 transform rotate-90"/>
          </button>
          <span className="text-xs w-8 text-center font-medium text-slate-700 dark:text-stone-200">{preferences.lineHeight.toFixed(1)}</span>
          <button data-control-button onClick={() => handleLineHeightChange(0.1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors text-slate-600 dark:text-stone-300" aria-label="Tăng giãn dòng">
            <AdjustmentsHorizontalIcon className="h-4 w-4"/>
          </button>
        </div>

        {/* === BỎ AUTO SCROLL (DESKTOP) === */}
        {/* <button ...> ... </button> */}
        {/* === KẾT THÚC === */}
      </div>
  );

  return (
    <>
      {/* MOBILE & TABLET VIEW */}
      <div className="md:hidden">
        {isControlsOpen && (
            <div
                className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 backdrop-blur-sm"
                onClick={() => setIsControlsOpen(false)}
                aria-hidden="true"
            />
        )}
        <div className="fixed bottom-5 right-5 z-50">
             <div
                data-control-button // Đánh dấu panel để không bị dừng auto scroll (nếu có) khi click vào đây
                className={`
                    absolute bottom-20 right-0
                    w-72 bg-white/90 dark:bg-stone-800/90 backdrop-blur-md shadow-2xl rounded-2xl p-5 border border-slate-200 dark:border-stone-700
                    transition-all duration-300 ease-out origin-bottom-right
                    ${isControlsOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}
                `}
              >
                <MobileControlPanel />
            </div>
            {/* Nút mở/đóng */}
            <button
                data-control-button // Đánh dấu nút
                onClick={() => setIsControlsOpen(p => !p)}
                className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-stone-900 focus:ring-orange-500 ${
                    isControlsOpen ? 'bg-slate-600 text-white hover:bg-slate-700 rotate-90' : 'bg-gradient-to-br from-orange-400 to-amber-400 text-white hover:from-orange-500 hover:to-amber-500'
                }`}
                aria-label={isControlsOpen ? 'Đóng cài đặt đọc' : 'Mở cài đặt đọc'}
            >
                {isControlsOpen
                    ? <XMarkIcon className="h-7 w-7 transition-transform duration-300" />
                    : <AdjustmentsHorizontalIcon className="h-7 w-7 transition-transform duration-300" />
                }
            </button>
        </div>
      </div>

      {/* DESKTOP VIEW */}
      <div className="hidden md:block fixed bottom-4 left-1/2 -translate-x-1/2 w-auto z-50">
        <DesktopControlBar/>
      </div>
    </>
  );
};

export default ReaderControls;
