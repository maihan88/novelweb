import React, { useEffect, useState } from 'react';
import {
    PlayIcon,
    PauseIcon,
    StopIcon,
    SpeakerWaveIcon,
    ChevronDownIcon,
} from '@heroicons/react/24/solid';
import { AudioHighlightColor, HIGHLIGHT_COLORS } from '../hooks/useAudioReader';

interface AudioPlayerProps {
    isPlaying: boolean;
    isPaused: boolean;
    rate: number;
    pitch: number;
    highlightColor: AudioHighlightColor;
    voiceURI: string;
    onPlay: () => void;
    onPause: () => void;
    onResume: () => void;
    onStop: () => void;
    onRateChange: (r: number) => void;
    onPitchChange: (p: number) => void;
    onHighlightColorChange: (c: AudioHighlightColor) => void;
    onVoiceChange: (uri: string) => void;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
    isPlaying,
    isPaused,
    rate,
    pitch,
    highlightColor,
    voiceURI,
    onPlay,
    onPause,
    onResume,
    onStop,
    onRateChange,
    onPitchChange,
    onHighlightColorChange,
    onVoiceChange,
}) => {
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

    // Load voices (some browsers load async)
    useEffect(() => {
        const loadVoices = () => {
            const all = window.speechSynthesis.getVoices();
            if (all.length > 0) setVoices(all);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
        return () => { window.speechSynthesis.onvoiceschanged = null; };
    }, []);

    // Only Vietnamese voices; fallback to all if none found
    const viVoices = voices.filter(v => v.lang.startsWith('vi'));
    const displayVoices = viVoices.length > 0 ? viVoices : voices;

    const SliderInput = ({
        label,
        value,
        min,
        max,
        step,
        onChange,
        formatVal,
    }: {
        label: string;
        value: number;
        min: number;
        max: number;
        step: number;
        onChange: (v: number) => void;
        formatVal?: (v: number) => string;
    }) => (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-sukem-text-muted uppercase tracking-wider">{label}</span>
                <span className="text-xs font-bold text-sukem-primary tabular-nums">
                    {formatVal ? formatVal(value) : value}
                </span>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={e => onChange(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-sukem-primary bg-sukem-border"
                data-control-button
            />
        </div>
    );

    return (
        <div className="flex flex-col gap-4 text-sukem-text">
            {/* Status + Controls */}
            <div className="flex items-center gap-2 flex-wrap">
                <div className="flex-1 text-xs font-medium text-sukem-text-muted min-w-[80px]">
                    {isPlaying ? (
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-sukem-primary animate-pulse" />
                            Đang đọc...
                        </span>
                    ) : isPaused ? (
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" />
                            Đã tạm dừng
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-sukem-border" />
                            Chưa đọc
                        </span>
                    )}
                </div>

                {!isPlaying && !isPaused && (
                    <button
                        data-control-button
                        onClick={onPlay}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-sukem-primary text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    >
                        <PlayIcon className="h-3 w-3" /> Đọc
                    </button>
                )}
                {isPlaying && (
                    <button
                        data-control-button
                        onClick={onPause}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    >
                        <PauseIcon className="h-3 w-3" /> Dừng
                    </button>
                )}
                {isPaused && (
                    <button
                        data-control-button
                        onClick={onResume}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-sukem-primary text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    >
                        <PlayIcon className="h-3 w-3" /> Tiếp
                    </button>
                )}
                {(isPlaying || isPaused) && (
                    <button
                        data-control-button
                        onClick={onStop}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500 text-white text-xs font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
                    >
                        <StopIcon className="h-3 w-3" /> Kết thúc
                    </button>
                )}
            </div>

            {/* Voice selector */}
            <div className="space-y-1.5">
                <span className="text-xs font-semibold text-sukem-text-muted uppercase tracking-wider">Giọng đọc</span>
                <div className="relative">
                    <select
                        data-control-button
                        value={voiceURI}
                        onChange={e => onVoiceChange(e.target.value)}
                        className="w-full pl-3 pr-7 py-2 text-xs rounded-lg border border-sukem-border bg-sukem-bg text-sukem-text appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-sukem-primary"
                    >
                        <option value="">— Tự động chọn —</option>
                        {displayVoices.map(v => (
                            <option key={v.voiceURI} value={v.voiceURI}>
                                {v.name}{v.localService ? ' ✓' : ''}
                            </option>
                        ))}
                    </select>
                    <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-sukem-text-muted pointer-events-none" />
                </div>
                {voices.length === 0 && (
                    <p className="text-[10px] text-sukem-text-muted italic">Trình duyệt chưa tải xong danh sách giọng...</p>
                )}
            </div>


            {/* Sliders */}
            <SliderInput
                label="Tốc độ"
                value={rate}
                min={0.5}
                max={2}
                step={0.1}
                onChange={onRateChange}
                formatVal={v => `${v.toFixed(1)}×`}
            />
            <SliderInput
                label="Cao độ"
                value={pitch}
                min={0.5}
                max={2}
                step={0.1}
                onChange={onPitchChange}
                formatVal={v => `${v.toFixed(1)}`}
            />

            {/* Highlight color */}
            <div className="space-y-2">
                <span className="text-xs font-semibold text-sukem-text-muted uppercase tracking-wider">Màu highlight</span>
                <div className="flex flex-wrap gap-2">
                    {(Object.entries(HIGHLIGHT_COLORS) as [AudioHighlightColor, { bg: string; label: string }][]).map(
                        ([key, val]) => (
                            <button
                                key={key}
                                data-control-button
                                onClick={() => onHighlightColorChange(key)}
                                title={val.label}
                                className={`w-6 h-6 rounded-full border-2 transition-all active:scale-90 ${highlightColor === key
                                    ? 'border-sukem-primary scale-110 shadow-md'
                                    : 'border-transparent hover:border-sukem-border scale-100'
                                    }`}
                                style={{ backgroundColor: val.bg }}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export { AudioPlayer };
export default AudioPlayer;
