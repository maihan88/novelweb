

export interface Chapter {
  _id: string;
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO Date string
  views: number;
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
  createdAt: string; // ISO Date string
  lastUpdatedAt: string; // ISO Date string
}

export type ReaderFont = 'font-serif' | 'font-sans' | 'font-mono';

export interface ReaderPreferences {
  fontSize: number;
  fontFamily: ReaderFont;
  lineHeight: number;
}

export interface User {
  _id: string;
  id: string;
  username: string;
  password?: string; // Should not be stored in plain text in a real app
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
  replies?: Comment[]; // Mảng chứa các bình luận trả lời
}
