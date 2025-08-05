import { useState, useEffect } from 'react';

// Hàm này không thay đổi
function getStorageValue<T>(key: string, defaultValue: T): T {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(key);
        if (saved !== null) {
            try {
                return JSON.parse(saved) as T;
            } catch (e) {
                return defaultValue;
            }
        }
    }
    return defaultValue;
}

// Bỏ hoàn toàn logic liên quan đến useAuth
export function useLocalStorage<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        return getStorageValue(key, defaultValue);
    });

    useEffect(() => {
        try {
            // Chỉ lưu vào localStorage nếu key không phải là null
            if (key) {
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (e) {
            console.error("Lỗi khi lưu vào localStorage:", e);
        }
    }, [key, value]);

    return [value, setValue];
}