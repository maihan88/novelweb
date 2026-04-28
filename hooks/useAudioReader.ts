import { useState, useRef, useCallback, useEffect } from 'react';

export type AudioHighlightColor =
    | 'yellow' | 'cyan' | 'green' | 'pink' | 'orange' | 'purple' | 'blue';

export const HIGHLIGHT_COLORS: Record<AudioHighlightColor, { bg: string; label: string }> = {
    yellow: { bg: 'rgba(255, 214, 0, 0.50)', label: 'Vàng' },
    cyan: { bg: 'rgba(34, 211, 238, 0.45)', label: 'Xanh lơ' },
    green: { bg: 'rgba(74, 222, 128, 0.45)', label: 'Xanh lá' },
    pink: { bg: 'rgba(244, 114, 182, 0.50)', label: 'Hồng' },
    orange: { bg: 'rgba(251, 146, 60, 0.50)', label: 'Cam' },
    purple: { bg: 'rgba(167, 139, 250, 0.50)', label: 'Tím' },
    blue: { bg: 'rgba(96, 165, 250, 0.50)', label: 'Xanh dương' },
};

/** Pre-process HTML: inject <span data-aidx="N"> into text nodes, returns wrapped HTML + sentence arrays */
export function preprocessHtmlForAudio(title: string, html: string): {
    titleSentences: string[];
    contentSentences: string[];
    wrappedHtml: string;
    totalSentences: number;
} {
    const div = document.createElement('div');
    div.innerHTML = html;

    let idx = 0;
    const titleSentences: string[] = [];
    const contentSentences: string[] = [];

    const titleParts = splitText(title);
    for (const part of titleParts) { titleSentences.push(part); idx++; }

    walkAndWrap(div, contentSentences, { current: idx });

    return {
        titleSentences,
        contentSentences,
        wrappedHtml: div.innerHTML,
        totalSentences: titleSentences.length + contentSentences.length,
    };
}

function splitText(text: string): string[] {
    return text
        .split(/(?<=[.!?…。！？])\s+|\n+/g)
        .map(s => s.trim())
        .filter(s => s.length > 1);
}

function walkAndWrap(node: Node, sentences: string[], idxRef: { current: number }) {
    if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (!text.trim()) return;
        const parts = splitText(text);
        if (parts.length === 0) return;
        if (parts.length === 1) {
            const span = document.createElement('span');
            span.setAttribute('data-aidx', String(idxRef.current++));
            span.textContent = text;
            sentences.push(text.trim());
            node.parentNode?.replaceChild(span, node);
        } else {
            const frag = document.createDocumentFragment();
            parts.forEach((part, i) => {
                const span = document.createElement('span');
                span.setAttribute('data-aidx', String(idxRef.current++));
                span.textContent = part + (i < parts.length - 1 ? ' ' : '');
                sentences.push(part.trim());
                frag.appendChild(span);
            });
            node.parentNode?.replaceChild(frag, node);
        }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
        const tag = (node as Element).tagName?.toLowerCase();
        if (tag === 'script' || tag === 'style') return;
        Array.from(node.childNodes).forEach(c => walkAndWrap(c, sentences, idxRef));
    }
}

interface UseAudioReaderOptions {
    titleSentences: string[];
    contentSentences: string[];
    voiceURI?: string;
    onChapterEnd?: () => void;
}

export function useAudioReader({
    titleSentences,
    contentSentences,
    voiceURI = '',
    onChapterEnd,
}: UseAudioReaderOptions) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [rate, setRateState] = useState(1);
    const [pitch, setPitchState] = useState(1);
    const [highlightColor, setHighlightColor] = useState<AudioHighlightColor>('yellow');

    // --- ALL mutable state in refs (no stale closures) ---
    // Update synchronously during render so they're always current when speak is called
    const allSentencesRef = useRef<string[]>([]);
    const titleLenRef = useRef(0);
    const rateRef = useRef(1);
    const pitchRef = useRef(1);
    const voiceURIRef = useRef('');
    const highlightColorRef = useRef<AudioHighlightColor>('yellow');
    const isStoppedRef = useRef(true);
    const sentenceIdxRef = useRef(-1);
    const onChapterEndRef = useRef(onChapterEnd);

    // Sync refs synchronously (during render body, before any speak call)
    allSentencesRef.current = [...titleSentences, ...contentSentences];
    titleLenRef.current = titleSentences.length;
    rateRef.current = rate;
    pitchRef.current = pitch;
    voiceURIRef.current = voiceURI;
    highlightColorRef.current = highlightColor;
    onChapterEndRef.current = onChapterEnd;

    // --- Highlight helper (no deps — reads from refs) ---
    const clearHighlight = useCallback(() => {
        document.querySelectorAll('[data-aidx]').forEach(el => {
            (el as HTMLElement).style.backgroundColor = '';
        });
        const titleEl = document.querySelector('[data-reader-title]') as HTMLElement | null;
        if (titleEl) titleEl.style.backgroundColor = '';
    }, []);

    const doHighlight = useCallback((idx: number) => {
        clearHighlight();
        const isTitleSentence = idx < titleLenRef.current;
        const el: HTMLElement | null = isTitleSentence
            ? document.querySelector('[data-reader-title]')
            : document.querySelector(`[data-aidx="${idx}"]`);
        if (el) {
            el.style.backgroundColor = HIGHLIGHT_COLORS[highlightColorRef.current]?.bg || 'rgba(255,214,0,0.5)';
            el.style.borderRadius = '3px';
            el.style.transition = 'background-color 0.15s ease';
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [clearHighlight]);

    // --- Core speak (stable ref — reads everything from refs, no stale closure) ---
    const speakRef = useRef<(idx: number) => void>(() => { });
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

    // Define the speak function and store in ref (redefined each render but stored immediately)
    const speak = useCallback((idx: number) => {
        if (isStoppedRef.current) return;
        const all = allSentencesRef.current;
        if (idx >= all.length) {
            clearHighlight();
            setIsPlaying(false);
            setIsPaused(false);
            sentenceIdxRef.current = -1;
            isStoppedRef.current = true;
            onChapterEndRef.current?.();
            return;
        }
        const text = all[idx]?.trim();
        if (!text) { speakRef.current(idx + 1); return; }

        sentenceIdxRef.current = idx;
        doHighlight(idx);

        const utterance = new SpeechSynthesisUtterance(text);
        utteranceRef.current = utterance; // Keep reference to prevent garbage collection bug
        utterance.lang = 'vi-VN';
        utterance.rate = rateRef.current;
        utterance.pitch = pitchRef.current;

        const voices = window.speechSynthesis.getVoices();
        if (voiceURIRef.current) {
            const v = voices.find(v => v.voiceURI === voiceURIRef.current);
            if (v) utterance.voice = v;
        } else {
            const vi = voices.find(v => v.lang.startsWith('vi'));
            if (vi) utterance.voice = vi;
        }

        // Use captured idx (not ref) in onend to avoid race conditions
        const capturedIdx = idx;
        utterance.onend = () => {
            if (!isStoppedRef.current) speakRef.current(capturedIdx + 1);
        };
        utterance.onerror = (e) => {
            if (e.error !== 'interrupted' && e.error !== 'canceled' && !isStoppedRef.current) {
                speakRef.current(capturedIdx + 1);
            }
        };
        window.speechSynthesis.speak(utterance);
    }, [clearHighlight, doHighlight]);

    // Always keep speakRef current
    speakRef.current = speak;

    // --- Public API ---
    const start = useCallback((startIdx = 0) => {
        window.speechSynthesis.cancel();
        isStoppedRef.current = false;
        setIsPlaying(true);
        setIsPaused(false);
        // Small delay so cancel() fully clears before speaking
        setTimeout(() => speakRef.current(startIdx), 50);
    }, []);

    const pause = useCallback(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
            window.speechSynthesis.pause();
            setIsPaused(true);
            setIsPlaying(false);
        }
    }, []);

    const resume = useCallback(() => {
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
            setIsPaused(false);
            setIsPlaying(true);
        } else {
            start(Math.max(0, sentenceIdxRef.current));
        }
    }, [start]);

    const stop = useCallback(() => {
        isStoppedRef.current = true;
        window.speechSynthesis.cancel();
        clearHighlight();
        setIsPlaying(false);
        setIsPaused(false);
        sentenceIdxRef.current = -1;
    }, [clearHighlight]);

    const setRate = useCallback((newRate: number) => {
        setRateState(newRate);
        // rateRef.current will be updated on next render via the sync line above,
        // but we need it now for the restart — set it immediately too
        rateRef.current = newRate;
        if (!isStoppedRef.current) {
            const cur = sentenceIdxRef.current;
            window.speechSynthesis.cancel();
            setTimeout(() => { if (!isStoppedRef.current) speakRef.current(cur >= 0 ? cur : 0); }, 50);
        }
    }, []);

    const setPitch = useCallback((newPitch: number) => {
        setPitchState(newPitch);
        pitchRef.current = newPitch;
        if (!isStoppedRef.current) {
            const cur = sentenceIdxRef.current;
            window.speechSynthesis.cancel();
            setTimeout(() => { if (!isStoppedRef.current) speakRef.current(cur >= 0 ? cur : 0); }, 50);
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isStoppedRef.current = true;
            window.speechSynthesis.cancel();
        };
    }, []);

    return { isPlaying, isPaused, rate, pitch, highlightColor, setRate, setPitch, setHighlightColor, start, pause, resume, stop };
}