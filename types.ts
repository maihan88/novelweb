export interface Chapter {
  _id: string;
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  views: number;
  isRaw?: boolean;
}

export interface Volume {
  _id: string;
  id: string;
  title: string;
  chapters: Chapter[];
}

export interface Story {
  _id: string;
  id: string;
  title: string;
  alias: string[];
  author: string;
  description: string;
  coverImage: string;
  tags: string[];
  status: 'Đang dịch' | 'Hoàn thành';
  volumes: Volume[];
  totalViews: number;
  rating: number;
  ratingsCount: number;
  isHot?: boolean;
  isInBanner?: boolean;
  bannerPriority?: number;
  createdAt: string;
  lastUpdatedAt: string;
  
  latestChapter?: {
      title: string;
      createdAt: string;
      id: string;
  } | null;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  totalDocs: number;
  totalPages: number;
}

export interface StoriesResponse {
  stories: Story[];
  pagination: PaginationMetadata;
}

export interface StoryFilterParams {
  page?: number;
  limit?: number;
  sort?: 'updated' | 'hot' | 'new' | 'view';
  status?: string;
  keyword?: string;
  chapterRange?: string; // Thay đổi: dùng string range "0-50", "50-100"
  isHot?: boolean;
}

export type ReaderFont = 'font-reader-times' | 'font-reader-lora' | 'font-reader-antiqua';
export type ReaderTheme = 'light' | 'sepia' | 'dark' | 'midnight' | 'paper' | 'matrix';
export type ReaderTextAlign = 'text-left' | 'text-justify' | 'text-right' | 'text-center';

export interface ReaderPreferences {
  fontSize: number;
  fontFamily: ReaderFont; 
  lineHeight: number;
  margin: number;
  theme: ReaderTheme;
  textAlign: ReaderTextAlign; // --- CẬP NHẬT FIELD NÀY ---
}

export interface Bookmark {
  chapterId: string;
  progress: number;
  lastRead: string; // ISO Date string
  chapterTitle?: string; // Optional vì dữ liệu cũ có thể chưa có
  volumeTitle?: string;  // Optional
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