// file: components/ReaderControls.tsx

import React, { useState, useRef, useEffect } from 'react';
import { ReaderPreferences, ReaderFont, ReaderTheme } from '../types';
import { 
    XMarkIcon, 
    SwatchIcon, // Icon bảng màu
} from '@heroicons/react/24/solid';
import { 
    AdjustmentsHorizontalIcon, 
    ArrowsRightLeftIcon,
    MinusIcon,
    PlusIcon,
    QueueListIcon, // Icon cho font/layout
    LanguageIcon // Icon cho Font family
} from '@heroicons/react/24/outline';

interface ReaderControlsProps {
  preferences: ReaderPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<ReaderPreferences>>;
}

const marginSteps = [0, 5, 10, 15, 20];

const ReaderControls: React.FC<ReaderControlsProps> = ({ preferences, setPreferences }) => {
  const [isControlsOpen, setIsControlsOpen] = useState(false); // Mobile toggle
  
  // State cho Desktop Sub-menus
  const [showDesktopTheme, setShowDesktopTheme] = useState(false);
  const [showDesktopLayout, setShowDesktopLayout] = useState(false);

  // --- Logic xử lý (Giữ nguyên) ---
  const handleFontSizeChange = (amount: number) => {
    setPreferences(p => ({ ...p, fontSize: Math.max(12, Math.min(32, p.fontSize + amount)) }));
  };
  const handleFontFamilyChange = (font: ReaderFont) => {
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
      // Trên desktop, sau khi chọn theme thì có thể giữ menu hoặc đóng tuỳ ý. 
      // Ở đây ta giữ nguyên để user thấy sự thay đổi.
  };

  // --- Data ---
  const fontOptions: { key: ReaderFont; name: string; style: React.CSSProperties }[] = [
      { key: 'font-reader-times', name: 'Times', style: { fontFamily: '"Times New Roman", Times, serif' } },
      { key: 'font-reader-lora', name: 'Lora', style: { fontFamily: '"Lora", serif' } },
      { key: 'font-reader-antiqua', name: 'Antiqua', style: { fontFamily: '"Book Antiqua", Palatino, serif' } }
  ];

  const themeOptions: { key: ReaderTheme; name: string; bg: string; border: string; ring: string }[] = [
      { key: 'light', name: 'Sáng', bg: 'bg-white', border: 'border-slate-300', ring: 'ring-orange-400' },
      { key: 'paper', name: 'Giấy', bg: 'bg-[#f5f5f4]', border: 'border-stone-300', ring: 'ring-stone-500' },
      { key: 'sepia', name: 'Vàng', bg: 'bg-[#fbf0d9]', border: 'border-[#dcd3c1]', ring: 'ring-[#d4b483]' },
      { key: 'midnight', name: 'Đêm', bg: 'bg-[#0f172a]', border: 'border-slate-600', ring: 'ring-slate-400' },
      { key: 'dark', name: 'Tối', bg: 'bg-[#1c1917]', border: 'border-stone-600', ring: 'ring-stone-400' },
      { key: 'matrix', name: 'Matrix', bg: 'bg-black', border: 'border-green-800', ring: 'ring-green-500' },
  ];

  // --- Click Outside Logic để đóng các popup desktop ---
  const desktopRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (desktopRef.current && !desktopRef.current.contains(event.target as Node)) {
            setShowDesktopTheme(false);
            setShowDesktopLayout(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  // --- MOBILE CONTROL PANEL (Giữ nguyên logic cũ, chỉ render khi md:hidden) ---
  const MobileControlPanel = () => (
    <div className="flex flex-col gap-y-5">
      {/* ... (Code Mobile cũ giữ nguyên) ... */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Cỡ chữ</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            <button data-control-button onClick={() => handleFontSizeChange(-1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors">A-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.fontSize}px</span>
            <button data-control-button onClick={() => handleFontSizeChange(1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors">A+</button>
        </div>
      </div>
       <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Phông chữ</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            {fontOptions.map(font => (
                <button
                    key={font.key}
                    data-control-button
                    onClick={() => handleFontFamilyChange(font.key)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${preferences.fontFamily === font.key ? 'bg-orange-400 dark:bg-amber-500/80 text-white dark:text-stone-900 shadow' : 'hover:bg-white dark:hover:bg-stone-600'}`}
                >
                    <span style={font.style}>{font.name}</span>
                </button>
            ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Giãn dòng</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            <button data-control-button onClick={() => handleLineHeightChange(-0.1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors">-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.lineHeight.toFixed(1)}</span>
            <button data-control-button onClick={() => handleLineHeightChange(0.1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors">+</button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Canh lề</span>
        <div className="flex items-center gap-1 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-full">
            <button data-control-button onClick={() => handleMarginChange(-1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors">-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.margin}%</span>
            <button data-control-button onClick={() => handleMarginChange(1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-stone-600 transition-colors">+</button>
        </div>
      </div>
      <div className="space-y-2">
        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">Màu nền</span>
        <div className="grid grid-cols-6 gap-2 p-1 bg-orange-100 dark:bg-stone-700/70 rounded-xl">
             {themeOptions.map(t => (
                 <button
                    key={t.key}
                    data-control-button
                    onClick={() => handleThemeChange(t.key)}
                    className={`col-span-1 aspect-square rounded-full flex items-center justify-center border-2 transition-all ${t.bg} ${
                        preferences.theme === t.key 
                        ? `${t.border} ${t.ring} ring-2 ring-offset-1 dark:ring-offset-stone-800` 
                        : 'border-transparent hover:border-slate-300'
                    }`}
                    title={t.name}
                 >
                     {preferences.theme === t.key && <div className="w-2 h-2 rounded-full bg-current opacity-50" />}
                 </button>
             ))}
        </div>
      </div>
    </div>
  );

  // --- DESKTOP VERTICAL SIDEBAR (Thiết kế mới) ---
  const DesktopVerticalSidebar = () => {
    // Style chung cho nút icon sidebar
    const sidebarBtnClass = (isActive: boolean) => `
        group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm
        ${isActive 
            ? 'bg-orange-500 text-white shadow-orange-500/30' 
            : 'bg-white/90 dark:bg-stone-800/90 text-slate-500 dark:text-stone-400 hover:bg-orange-50 dark:hover:bg-stone-700 hover:text-orange-600 dark:hover:text-orange-400'
        }
    `;

    // Style cho Popover panel
    const popoverClass = `
        absolute right-full mr-3 top-1/2 -translate-y-1/2
        bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl
        border border-slate-200 dark:border-slate-700
        shadow-xl rounded-2xl p-3
        flex items-center gap-3
        animate-in fade-in slide-in-from-right-2 duration-200
        origin-right
    `;

    return (
        <div 
            ref={desktopRef}
            className="flex flex-col items-center gap-3 p-2 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-white/20 dark:border-white/5 transition-all hover:bg-white/60 dark:hover:bg-black/40"
        >
            {/* 1. Font Size Control (Luôn hiện để tiện bấm) */}
            <div className="flex flex-col gap-1 p-1 bg-white/80 dark:bg-stone-800/80 rounded-xl shadow-sm border border-slate-100 dark:border-stone-700">
                <button 
                    onClick={() => handleFontSizeChange(1)} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-stone-700 text-slate-600 dark:text-stone-300 transition-colors"
                    title="Tăng cỡ chữ"
                >
                    <PlusIcon className="h-4 w-4" />
                </button>
                <div className="text-[10px] font-bold text-center text-slate-400 select-none py-0.5">
                    {preferences.fontSize}
                </div>
                <button 
                    onClick={() => handleFontSizeChange(-1)} 
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-stone-700 text-slate-600 dark:text-stone-300 transition-colors"
                    title="Giảm cỡ chữ"
                >
                    <MinusIcon className="h-4 w-4" />
                </button>
            </div>

            {/* Separator */}
            <div className="w-6 h-px bg-slate-200 dark:bg-stone-700/50"></div>

            {/* 2. Layout & Fonts Menu Button */}
            <div className="relative">
                <button 
                    onClick={() => { setShowDesktopLayout(!showDesktopLayout); setShowDesktopTheme(false); }}
                    className={sidebarBtnClass(showDesktopLayout)}
                    title="Cài đặt hiển thị"
                >
                    <QueueListIcon className="h-5 w-5" />
                </button>
                
                {/* Layout Popover (Hiện sang trái) */}
                {showDesktopLayout && (
                    <div className={`${popoverClass} flex-col !items-stretch gap-4 min-w-[220px]`}>
                        {/* Font Family */}
                        <div className="space-y-2">
                             <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                <LanguageIcon className="h-3 w-3" /> Phông chữ
                             </div>
                             <div className="flex flex-wrap gap-1.5">
                                {fontOptions.map(font => (
                                    <button
                                        key={font.key}
                                        onClick={() => handleFontFamilyChange(font.key)}
                                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                                            preferences.fontFamily === font.key 
                                            ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400' 
                                            : 'border-slate-100 dark:border-stone-800 bg-slate-50 dark:bg-stone-800 text-slate-600 dark:text-stone-400 hover:border-slate-300'
                                        }`}
                                    >
                                        <span style={font.style}>{font.name}</span>
                                    </button>
                                ))}
                             </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-stone-700/50"></div>

                        {/* Line Height & Margin */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Giãn dòng</div>
                                <div className="flex items-center justify-between bg-slate-100 dark:bg-stone-800 rounded-lg p-1">
                                    <button onClick={() => handleLineHeightChange(-0.1)} className="p-1 hover:bg-white dark:hover:bg-stone-700 rounded transition-colors"><MinusIcon className="h-3 w-3"/></button>
                                    <span className="text-xs font-bold">{preferences.lineHeight.toFixed(1)}</span>
                                    <button onClick={() => handleLineHeightChange(0.1)} className="p-1 hover:bg-white dark:hover:bg-stone-700 rounded transition-colors"><PlusIcon className="h-3 w-3"/></button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lề trang</div>
                                <div className="flex items-center justify-between bg-slate-100 dark:bg-stone-800 rounded-lg p-1">
                                    <button onClick={() => handleMarginChange(-1)} className="p-1 hover:bg-white dark:hover:bg-stone-700 rounded transition-colors"><MinusIcon className="h-3 w-3"/></button>
                                    <span className="text-xs font-bold">{preferences.margin}%</span>
                                    <button onClick={() => handleMarginChange(1)} className="p-1 hover:bg-white dark:hover:bg-stone-700 rounded transition-colors"><PlusIcon className="h-3 w-3"/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Theme Menu Button */}
            <div className="relative">
                <button 
                    onClick={() => { setShowDesktopTheme(!showDesktopTheme); setShowDesktopLayout(false); }}
                    className={sidebarBtnClass(showDesktopTheme)}
                    title="Màu nền"
                >
                    <SwatchIcon className="h-5 w-5" />
                    {/* Indicator chấm màu hiện tại */}
                    <span 
                        className={`absolute bottom-2 right-2 w-2 h-2 rounded-full border border-black/10 shadow-sm`} 
                        style={{ backgroundColor: themeOptions.find(t => t.key === preferences.theme)?.bg.replace('bg-', '').replace('[', '').replace(']', '') || '#fff' }}
                    ></span>
                </button>

                {/* Theme Popover (Hiện sang trái) - GRID MÀU */}
                {showDesktopTheme && (
                    <div className={`${popoverClass} grid grid-cols-3 gap-2 w-[180px]`}>
                         {themeOptions.map(t => (
                            <button
                                key={t.key}
                                onClick={() => handleThemeChange(t.key)}
                                className={`
                                    relative aspect-square rounded-xl border-2 transition-all duration-200 hover:scale-105 focus:outline-none
                                    ${t.bg}
                                    ${preferences.theme === t.key 
                                        ? `${t.border} ${t.ring} ring-2 ring-offset-2 dark:ring-offset-stone-900 z-10 scale-105` 
                                        : 'border-transparent hover:border-slate-300/50 shadow-sm'
                                    }
                                `}
                                title={t.name}
                            >
                                {preferences.theme === t.key && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-current opacity-40 shadow-sm"></div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
  };

  return (
    <>
      {/* MOBILE & TABLET VIEW (Dưới 768px) */}
      <div className="md:hidden">
         {isControlsOpen && (
            <div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 backdrop-blur-sm" onClick={() => setIsControlsOpen(false)} aria-hidden="true" />
        )}
        <div className="fixed bottom-5 right-5 z-50">
             <div data-control-button className={`absolute bottom-20 right-0 w-80 bg-white/90 dark:bg-stone-800/90 backdrop-blur-md shadow-2xl rounded-2xl p-5 border border-slate-200 dark:border-stone-700 transition-all duration-300 ease-out origin-bottom-right ${isControlsOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`}>
                <MobileControlPanel />
            </div>
            <button
                data-control-button
                onClick={() => setIsControlsOpen(p => !p)}
                className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-stone-900 focus:ring-orange-500 ${isControlsOpen ? 'bg-slate-600 text-white hover:bg-slate-700 rotate-90' : 'bg-gradient-to-br from-orange-400 to-amber-400 text-white hover:from-orange-500 hover:to-amber-500'}`}
            >
                {isControlsOpen ? <XMarkIcon className="h-7 w-7 transition-transform duration-300" /> : <AdjustmentsHorizontalIcon className="h-7 w-7 transition-transform duration-300" />}
            </button>
        </div>
      </div>

      {/* DESKTOP VIEW (Sidebar bên phải) */}
      <div className="hidden md:block fixed right-6 top-1/2 -translate-y-1/2 z-50">
        <DesktopVerticalSidebar />
      </div>
    </>
  );
};

export default ReaderControls;
