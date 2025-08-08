import { useState, useEffect } from 'react';

function getStorageValue<T>(key: string | null, defaultValue: T): T {
    if (typeof window !== 'undefined' && key) { // Chỉ đọc nếu có key
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

export function useLocalStorage<T>(key: string | null, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const [value, setValue] = useState<T>(() => {
        return getStorageValue(key, defaultValue);
    });

    useEffect(() => {
        // Đồng bộ lại state từ localStorage khi key thay đổi (ví dụ: khi người dùng đăng nhập/đăng xuất)
        setValue(getStorageValue(key, defaultValue));
    }, [key]);

    useEffect(() => {
        try {
            if (key) { // Chỉ lưu vào localStorage nếu có key (tức là user đã đăng nhập)
                localStorage.setItem(key, JSON.stringify(value));
            }
        } catch (e) {
            console.error("Lỗi khi lưu vào localStorage:", e);
        }
    }, [key, value]);

    return [value, setValue];
}