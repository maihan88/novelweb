import React, { useState, useRef, useEffect } from 'react';
import { ReaderPreferences, ReaderFont, ReaderTheme } from '../types';
import { 
    XMarkIcon, 
    SwatchIcon, 
} from '@heroicons/react/24/solid';
import { 
    AdjustmentsHorizontalIcon, 
    MinusIcon, 
    PlusIcon, 
    QueueListIcon, 
    LanguageIcon 
} from '@heroicons/react/24/outline';

interface ReaderControlsProps {
  preferences: ReaderPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<ReaderPreferences>>;
}

const marginSteps = [0, 5, 10, 15, 20];

const ReaderControls: React.FC<ReaderControlsProps> = ({ preferences, setPreferences }) => {
  const [isControlsOpen, setIsControlsOpen] = useState(false);
  const [showDesktopTheme, setShowDesktopTheme] = useState(false);
  const [showDesktopLayout, setShowDesktopLayout] = useState(false);

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
  };

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

  const MobileControlPanel = () => (
    <div className="flex flex-col gap-y-5 text-sukem-text">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">Cỡ chữ</span>
        <div className="flex items-center gap-1 p-1 bg-sukem-bg rounded-full border border-sukem-border">
            <button data-control-button onClick={() => handleFontSizeChange(-1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sukem-card transition-colors">A-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.fontSize}px</span>
            <button data-control-button onClick={() => handleFontSizeChange(1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sukem-card transition-colors">A+</button>
        </div>
      </div>
       <div className="flex items-center justify-between">
        <span className="font-medium text-sm">Phông chữ</span>
        <div className="flex items-center gap-1 p-1 bg-sukem-bg rounded-full border border-sukem-border">
            {fontOptions.map(font => (
                <button
                    key={font.key}
                    data-control-button
                    onClick={() => handleFontFamilyChange(font.key)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${preferences.fontFamily === font.key ? 'bg-sukem-primary text-white shadow' : 'hover:bg-sukem-card'}`}
                >
                    <span style={font.style}>{font.name}</span>
                </button>
            ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">Giãn dòng</span>
        <div className="flex items-center gap-1 p-1 bg-sukem-bg rounded-full border border-sukem-border">
            <button data-control-button onClick={() => handleLineHeightChange(-0.1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sukem-card transition-colors">-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.lineHeight.toFixed(1)}</span>
            <button data-control-button onClick={() => handleLineHeightChange(0.1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sukem-card transition-colors">+</button>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm">Canh lề</span>
        <div className="flex items-center gap-1 p-1 bg-sukem-bg rounded-full border border-sukem-border">
            <button data-control-button onClick={() => handleMarginChange(-1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sukem-card transition-colors">-</button>
            <span className="text-sm w-10 text-center font-semibold">{preferences.margin}%</span>
            <button data-control-button onClick={() => handleMarginChange(1)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sukem-card transition-colors">+</button>
        </div>
      </div>
      <div className="space-y-2">
        <span className="font-medium text-sm">Màu nền</span>
        <div className="grid grid-cols-6 gap-2 p-1 bg-sukem-bg rounded-xl border border-sukem-border">
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

  const DesktopVerticalSidebar = () => {
    const sidebarBtnClass = (isActive: boolean) => `
        group relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 shadow-sm
        ${isActive 
            ? 'bg-sukem-primary text-white shadow-orange-500/30' 
            : 'bg-sukem-card/90 text-sukem-text-muted hover:bg-sukem-bg hover:text-sukem-primary border border-sukem-border'
        }
    `;

    const popoverClass = `
        absolute right-full mr-3 top-1/2 -translate-y-1/2
        bg-sukem-card/95 backdrop-blur-xl
        border border-sukem-border
        shadow-xl rounded-2xl p-3
        flex items-center gap-3
        animate-in fade-in slide-in-from-right-2 duration-200
        origin-right
    `;

    return (
        <div 
            ref={desktopRef}
            className="flex flex-col items-center gap-3 p-2 rounded-2xl bg-sukem-bg/50 backdrop-blur-sm border border-sukem-border/50 transition-all hover:bg-sukem-bg/80"
        >
            <div className="flex flex-col gap-1 p-1 bg-sukem-card/80 rounded-xl shadow-sm border border-sukem-border">
                <button onClick={() => handleFontSizeChange(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sukem-bg text-sukem-text transition-colors" title="Tăng cỡ chữ">
                    <PlusIcon className="h-4 w-4" />
                </button>
                <div className="text-[10px] font-bold text-center text-sukem-text-muted select-none py-0.5">{preferences.fontSize}</div>
                <button onClick={() => handleFontSizeChange(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sukem-bg text-sukem-text transition-colors" title="Giảm cỡ chữ">
                    <MinusIcon className="h-4 w-4" />
                </button>
            </div>

            <div className="w-6 h-px bg-sukem-border"></div>

            <div className="relative">
                <button onClick={() => { setShowDesktopLayout(!showDesktopLayout); setShowDesktopTheme(false); }} className={sidebarBtnClass(showDesktopLayout)} title="Cài đặt hiển thị">
                    <QueueListIcon className="h-5 w-5" />
                </button>
                
                {showDesktopLayout && (
                    <div className={`${popoverClass} flex-col !items-stretch gap-4 min-w-[220px] text-sukem-text`}>
                        <div className="space-y-2">
                             <div className="flex items-center gap-2 text-xs font-semibold text-sukem-text-muted uppercase tracking-wider">
                                <LanguageIcon className="h-3 w-3" /> Phông chữ
                             </div>
                             <div className="flex flex-wrap gap-1.5">
                                {fontOptions.map(font => (
                                    <button key={font.key} onClick={() => handleFontFamilyChange(font.key)}
                                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium border transition-all ${
                                            preferences.fontFamily === font.key 
                                            ? 'bg-sukem-bg border-sukem-primary text-sukem-primary' 
                                            : 'border-sukem-border bg-sukem-bg text-sukem-text-muted hover:border-sukem-text-muted'
                                        }`}
                                    >
                                        <span style={font.style}>{font.name}</span>
                                    </button>
                                ))}
                             </div>
                        </div>

                        <div className="h-px bg-sukem-border"></div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-sukem-text-muted uppercase tracking-wider">Giãn dòng</div>
                                <div className="flex items-center justify-between bg-sukem-bg rounded-lg p-1 border border-sukem-border">
                                    <button onClick={() => handleLineHeightChange(-0.1)} className="p-1 hover:bg-sukem-card rounded transition-colors"><MinusIcon className="h-3 w-3"/></button>
                                    <span className="text-xs font-bold">{preferences.lineHeight.toFixed(1)}</span>
                                    <button onClick={() => handleLineHeightChange(0.1)} className="p-1 hover:bg-sukem-card rounded transition-colors"><PlusIcon className="h-3 w-3"/></button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-xs font-semibold text-sukem-text-muted uppercase tracking-wider">Lề trang</div>
                                <div className="flex items-center justify-between bg-sukem-bg rounded-lg p-1 border border-sukem-border">
                                    <button onClick={() => handleMarginChange(-1)} className="p-1 hover:bg-sukem-card rounded transition-colors"><MinusIcon className="h-3 w-3"/></button>
                                    <span className="text-xs font-bold">{preferences.margin}%</span>
                                    <button onClick={() => handleMarginChange(1)} className="p-1 hover:bg-sukem-card rounded transition-colors"><PlusIcon className="h-3 w-3"/></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="relative">
                <button onClick={() => { setShowDesktopTheme(!showDesktopTheme); setShowDesktopLayout(false); }} className={sidebarBtnClass(showDesktopTheme)} title="Màu nền">
                    <SwatchIcon className="h-5 w-5" />
                    <span className={`absolute bottom-2 right-2 w-2 h-2 rounded-full border border-black/10 shadow-sm`} style={{ backgroundColor: themeOptions.find(t => t.key === preferences.theme)?.bg.replace('bg-', '').replace('[', '').replace(']', '') || '#fff' }}></span>
                </button>

                {showDesktopTheme && (
                    <div className={`${popoverClass} grid grid-cols-3 gap-2 w-[180px]`}>
                         {themeOptions.map(t => (
                            <button key={t.key} onClick={() => handleThemeChange(t.key)}
                                className={`relative aspect-square rounded-xl border-2 transition-all duration-200 hover:scale-105 focus:outline-none ${t.bg} ${
                                    preferences.theme === t.key ? `${t.border} ${t.ring} ring-2 ring-offset-2 dark:ring-offset-stone-900 z-10 scale-105` : 'border-transparent hover:border-slate-300/50 shadow-sm'
                                }`} title={t.name}
                            >
                                {preferences.theme === t.key && (<div className="absolute inset-0 flex items-center justify-center"><div className="w-2 h-2 rounded-full bg-current opacity-40 shadow-sm"></div></div>)}
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
      <div className="md:hidden">
         {isControlsOpen && (<div className="fixed inset-0 bg-black/30 dark:bg-black/50 z-40 backdrop-blur-sm" onClick={() => setIsControlsOpen(false)} aria-hidden="true" />)}
        <div className="fixed bottom-5 right-5 z-50">
             <div data-control-button className={`absolute bottom-20 right-0 w-80 bg-sukem-card/90 backdrop-blur-md shadow-2xl rounded-2xl p-5 border border-sukem-border transition-all duration-300 ease-out origin-bottom-right ${isControlsOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2 pointer-events-none'}`}>
                <MobileControlPanel />
            </div>
            <button data-control-button onClick={() => setIsControlsOpen(p => !p)}
                className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-stone-900 focus:ring-sukem-primary ${isControlsOpen ? 'bg-slate-600 text-white hover:bg-slate-700 rotate-90' : 'bg-sukem-primary text-white hover:opacity-90'}`}
            >
                {isControlsOpen ? <XMarkIcon className="h-7 w-7 transition-transform duration-300" /> : <AdjustmentsHorizontalIcon className="h-7 w-7 transition-transform duration-300" />}
            </button>
        </div>
      </div>
      <div className="hidden md:block fixed right-6 top-1/2 -translate-y-1/2 z-50">
        <DesktopVerticalSidebar />
      </div>
    </>
  );
};

export default ReaderControls;