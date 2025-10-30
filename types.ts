export interface Chapter {
  _id: string;
  id: string;
  title: string;
  content: string;
  createdAt: string;
  views: number;
  isRaw?: boolean;
}

export interface Volume {
  _id: string;
  id:string;
  title: string;
  chapters: Chapter[];
}

export interface Story {
  _id: string;
  id:string;
  title: string;
  alias: string[];
  author: string;
  description: string;
  coverImage: string;
  tags: string[];
  status: 'Đang dịch' | 'Hoàn thành';
  volumes: Volume[];
  views: number;
  rating: number;
  ratingsCount: number;
  isHot?: boolean;
  isInBanner?: boolean;
  createdAt: string;
  lastUpdatedAt: string;
}

// --- CẬP NHẬT ReaderFont VỚI KEY MỚI ---
export type ReaderFont = 'font-reader-times' | 'font-reader-lora' | 'font-reader-antiqua';
// Tailwind tự động tạo class dạng `font-<key>`, ví dụ: font-reader-times
// --- KẾT THÚC CẬP NHẬT ---

export type ReaderTheme = 'light' | 'sepia' | 'dark';

export interface ReaderPreferences {
  fontSize: number;
  fontFamily: ReaderFont; // Giờ sẽ là một trong các giá trị 'font-reader-*'
  lineHeight: number;
  margin: number;
  theme: ReaderTheme;
}

export interface Bookmark {
  chapterId: string;
  progress: number;
  lastRead: string;
}

export interface User {
  _id: string;
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'user';
}

export interface Comment {
  _id: string;
  id: string;
  storyId: string;
  chapterId: string;
  user: string;
  username: string;
  parentId: string | null;
  text: string;
  timestamp: string;
  replies?: Comment[];
}
