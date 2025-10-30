// src/components/ReaderControls.tsx
import React, { useState } from 'react';
import { ReaderPreferences, ReaderFont, ReaderTheme } from '../types';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { AdjustmentsHorizontalIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline';

interface ReaderControlsProps {
  preferences: ReaderPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<ReaderPreferences>>;
}

const marginSteps = [0, 5, 10, 15, 20];

const ReaderControls: React.FC<ReaderControlsProps> = ({ preferences, setPreferences }) => {
  const [isControlsOpen, setIsControlsOpen] = useState(false);

  // --- HÀM XỬ LÝ (Không đổi logic) ---
  const handleFontSizeChange = (amount: number) => {
    setPreferences(p => ({ ...p, fontSize: Math.max(12, Math.min(32, p.fontSize + amount)) }));
  };
  const handleFontFamilyChange = (font: ReaderFont) => { // Kiểu dữ liệu ReaderFont đã dùng key mới
    setPreferences(p => ({ ...p, fontFamily: font }));
  };
  const handleLineHeightChange = (amount: number) => {
    const newLineHeight = parseFloat((preferences.lineHeight + amount).toFixed(1));
    setPreferences(p => ({ ...p, lineHeight: Math.max(1.4, Math.min(2.2, newLineHeight)) }));
  };
  const handleMarginChange = (direction: number) => {
      const currentMarginIndex = marginSteps.indexOf(preferences.margin);
      const validCurrentIndex = currentMarginIndex === -1 ? 2 : currentMarginIndex;
      const newMarginIndex = Math.max(0, Math.min(marginSteps.length - 1, validCurrentIndex + direction));
      setPreferences(p => ({ ...p, margin: marginSteps[newMarginIndex] }));
  };
  const handleThemeChange = (theme: ReaderTheme) => {
      setPreferences(p => ({ ...p, theme: theme }));
  };
  // --- KẾT THÚC HÀM XỬ LÝ ---

  // --- CẬP NHẬT: Font Button Data ---
  // Tạo mảng để dễ dàng lặp và quản lý
  const fontOptions: { key: ReaderFont; name: string; style: React.CSSProperties }[] = [
      { key: 'font-reader-times', name: 'Times', style: { fontFamily: '"Times New Roman", Times, serif' } },
      { key: 'font-reader-lora', name: 'Lora', style: { fontFamily: '"Lora", serif' } },
      { key: 'font-reader-antiqua', name: 'Antiqua', style: { fontFamily: '"Book Antiqua", Palatino, serif' } }
  ];
  // --- KẾT THÚC CẬP NHẬT ---


  const MobileControlPanel = () => (
    <div className="flex flex-col gap-y-5">
      {/* Font Size (Không đổi) */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Cỡ chữ</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            <button data-control-button onClick={() => handleFontSizeChange(-1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors" aria-label="Giảm cỡ chữ">A-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.fontSize}px</span>
            <button data-control-button onClick={() => handleFontSizeChange(1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors" aria-label="Tăng cỡ chữ">A+</button>
        </div>
      </div>

      {/* --- CẬP NHẬT: Font Family Buttons (Mobile) --- */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Phông chữ</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            {fontOptions.map(font => (
                <button
                    key={font.key}
                    data-control-button
                    onClick={() => handleFontFamilyChange(font.key)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${preferences.fontFamily === font.key ? 'bg-orange-400 dark:bg-amber-500/80 text-white dark:text-stone-900 shadow' : 'hover:bg-white dark:hover:bg-stone-600'}`}
                    aria-label={`Font ${font.name}`}
                >
                    <span style={font.style}>{font.name}</span>
                </button>
            ))}
        </div>
      </div>
      {/* --- KẾT THÚC CẬP NHẬT --- */}

       {/* Line Height (Không đổi) */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Giãn dòng</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            <button data-control-button onClick={() => handleLineHeightChange(-0.1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors" aria-label="Giảm giãn dòng">-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.lineHeight.toFixed(1)}</span>
            <button data-control-button onClick={() => handleLineHeightChange(0.1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors" aria-label="Tăng giãn dòng">+</button>
        </div>
      </div>

      {/* Margin (Không đổi) */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Canh lề</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            <button data-control-button onClick={() => handleMarginChange(-1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors" aria-label="Giảm lề">-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.margin}%</span>
            <button data-control-button onClick={() => handleMarginChange(1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors" aria-label="Tăng lề">+</button>
        </div>
      </div>

      {/* Theme (Không đổi) */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Màu nền</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            <button
                data-control-button
                onClick={() => handleThemeChange('light')}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${preferences.theme === 'light' ? 'border-orange-400 dark:border-amber-500 ring-1 ring-orange-400 dark:ring-amber-500 ring-offset-1 dark:ring-offset-stone-800 bg-white' : 'border-slate-300 dark:border-stone-600 bg-white hover:border-slate-400'}`}
                aria-label="Nền sáng"
            />
             <button
                data-control-button
                onClick={() => handleThemeChange('sepia')}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${preferences.theme === 'sepia' ? 'border-orange-400 dark:border-amber-500 ring-1 ring-orange-400 dark:ring-amber-500 ring-offset-1 dark:ring-offset-stone-800 bg-[#fbf0d9]' : 'border-[#dcd3c1] dark:border-[#a0927c] bg-[#fbf0d9] hover:border-[#c8b79a]'}`}
                aria-label="Nền vàng nâu"
            />
             <button
                data-control-button
                onClick={() => handleThemeChange('dark')}
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${preferences.theme === 'dark' ? 'border-orange-400 dark:border-amber-500 ring-1 ring-orange-400 dark:ring-amber-500 ring-offset-1 dark:ring-offset-stone-800 bg-stone-900' : 'border-stone-700 dark:border-stone-500 bg-stone-900 hover:border-stone-600'}`}
                aria-label="Nền tối"
            />
        </div>
      </div>
    </div>
  );

  // Class cho nút font desktop
  const fontButtonClassDesktop = (fontKey: ReaderFont) => `
     data-control-button px-3 py-1.5 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-400 dark:focus:ring-offset-stone-800
     ${preferences.fontFamily === fontKey
       ? 'bg-orange-100 dark:bg-amber-900/60 text-orange-700 dark:text-amber-200 font-semibold shadow-inner'
       : 'text-slate-600 dark:text-stone-300 hover:bg-slate-200 dark:hover:bg-stone-600/70'
     }
   `;

  // Class cho nút theme desktop (Không đổi)
  const themeButtonClassDesktop = (theme: ReaderTheme, bgColorClass: string, borderColorClass: string, activeRingClass: string) => `
    data-control-button w-6 h-6 rounded-full border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-stone-800 ${bgColorClass}
    ${preferences.theme === theme
      ? `${activeRingClass} ring-2 ring-offset-1 dark:ring-offset-stone-700 shadow-inner ${borderColorClass}`
      : `${borderColorClass} hover:ring-1 hover:ring-offset-1 ${activeRingClass}`
    }
  `;

  const DesktopControlBar = () => (
      <div className="flex flex-wrap justify-center items-center gap-x-3 gap-y-2 p-2 bg-white/90 dark:bg-stone-800/90 backdrop-blur-md rounded-full shadow-lg border border-slate-200 dark:border-stone-700">
        {/* Font Size (Không đổi) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-stone-700 rounded-full p-1">
            <button data-control-button onClick={() => handleFontSizeChange(-1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors text-slate-600 dark:text-stone-300" aria-label="Giảm cỡ chữ"><span className="text-xs font-semibold">A-</span></button>
            <span className="text-xs w-8 text-center font-medium text-slate-700 dark:text-stone-200">{preferences.fontSize}px</span>
            <button data-control-button onClick={() => handleFontSizeChange(1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors text-slate-600 dark:text-stone-300" aria-label="Tăng cỡ chữ"><span className="text-xs font-semibold">A+</span></button>
        </div>

        {/* --- CẬP NHẬT: Font Family Buttons Desktop --- */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-stone-700 rounded-full p-1">
          {fontOptions.map(font => (
              <button
                key={font.key}
                onClick={() => handleFontFamilyChange(font.key)}
                className={fontButtonClassDesktop(font.key)}
                aria-label={`Font ${font.name}`}
              >
                  <span style={font.style}>{font.name}</span>
              </button>
          ))}
        </div>
        {/* --- KẾT THÚC CẬP NHẬT --- */}


        {/* Line Height (Không đổi) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-stone-700 rounded-full p-1">
           <button data-control-button onClick={() => handleLineHeightChange(-0.1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors text-slate-600 dark:text-stone-300" aria-label="Giảm giãn dòng"><AdjustmentsHorizontalIcon className="h-4 w-4 transform rotate-90"/></button>
           <span className="text-xs w-8 text-center font-medium text-slate-700 dark:text-stone-200">{preferences.lineHeight.toFixed(1)}</span>
           <button data-control-button onClick={() => handleLineHeightChange(0.1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors text-slate-600 dark:text-stone-300" aria-label="Tăng giãn dòng"><AdjustmentsHorizontalIcon className="h-4 w-4"/></button>
        </div>

        {/* Margin (Không đổi) */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-stone-700 rounded-full p-1">
            <button data-control-button onClick={() => handleMarginChange(-1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors text-slate-600 dark:text-stone-300" aria-label="Giảm lề"><ArrowsRightLeftIcon className="h-4 w-4 transform scale-x-[-1]" /></button>
            <span className="text-xs w-8 text-center font-medium text-slate-700 dark:text-stone-200">{preferences.margin}%</span>
            <button data-control-button onClick={() => handleMarginChange(1)} className="p-1.5 rounded-full hover:bg-slate-200 dark:hover:bg-stone-600 transition-colors text-slate-600 dark:text-stone-300" aria-label="Tăng lề"><ArrowsRightLeftIcon className="h-4 w-4" /></button>
        </div>

         {/* Theme (Không đổi) */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-stone-700 rounded-full p-1">
            <button
                onClick={() => handleThemeChange('light')}
                className={themeButtonClassDesktop('light', 'bg-white', 'border-slate-400 dark:border-stone-500', 'ring-orange-400')}
                aria-label="Nền sáng"
            />
             <button
                onClick={() => handleThemeChange('sepia')}
                className={themeButtonClassDesktop('sepia', 'bg-[#fbf0d9]', 'border-[#dcd3c1] dark:border-[#a0927c]', 'ring-orange-400')}
                aria-label="Nền vàng nâu"
            />
            <button
                onClick={() => handleThemeChange('dark')}
                className={themeButtonClassDesktop('dark', 'bg-stone-900', 'border-stone-600 dark:border-stone-400', 'ring-amber-400')}
                aria-label="Nền tối"
            />
        </div>
      </div>
  );

  // Return JSX (Không đổi cấu trúc ngoài)
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
                data-control-button
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
