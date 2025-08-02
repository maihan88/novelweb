

export interface Chapter {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO Date string
  views: number;
}

export interface Volume {
  id: string;
  title: string;
  chapters: Chapter[];
}

export interface Story {
  id:string;
  title: string;
  alias?: string;
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
  id: string;
  username: string;
  password?: string; // Should not be stored in plain text in a real app
  role: 'admin' | 'user';
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}