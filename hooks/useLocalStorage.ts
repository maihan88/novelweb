// maihan88/novelweb/novelweb-30378715fdd33fd98f7c1318544ef93eab22c598/hooks/useLocalStorage.tsx
import { useState, useEffect } from 'react';

function getStorageValue<T>(key: string, defaultValue: T): T {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            try {
                return JSON.parse(saved) as T;
            } catch (e) {
                console.error("Failed to parse local storage value for key:", key, e);
                return defaultValue;
            }
        }
    }
    return defaultValue;
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        return getStorageValue(key, defaultValue);
    });

    useEffect(() => {
        try {
            if (value === null) {
                localStorage.removeItem(key);
            } else {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (e) {
            console.error("Failed to set local storage value for key:", key, e);
        }
    }, [key, value]);

    return [value, setValue];
}
