// --- types.ts מעודכן ---

export enum Category {
  NEWS = 'מבזקים',
  COMMUNITY = 'קהילה וחברה',
  POLITICS = 'פוליטיקה',
  SECURITY = 'ביטחון',
  CULTURE = 'תרבות ואומנות',
  CRIME = 'משפט ופלילים',
  WEATHER = 'מזג אוויר',
  INFRASTRUCTURE = 'תשתיות ותנועה',
  LOCAL = 'צפת והגליל'
}

export interface Post {
  _id: string; // MongoDB משתמש ב-_id
  title: string;
  excerpt: string;
  content: string; 
  category: Category;
  author: string;
  date: string; // מגיע כ-ISO string מהשרת
  imageUrl: string;
  imageCredit?: string;
  tags: string[];
  isFeatured: boolean;
  views: number;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  joinedDate: string;
}

export interface AdSlide {
  _id?: string;
  imageUrl: string;
  videoUrl?: string;
  linkUrl: string;
}

export interface Ad {
  _id: string;
  title: string;
  area: 'leaderboard' | 'sidebar' | 'sidebar_video' | 'article_bottom' | 'homepage_mid';
  isActive: boolean;
  slides: AdSlide[];
}

export interface Alert {
    _id: string;
    content: string;
    title: string;
    active: boolean;
    date: string;
}

export const CATEGORY_COLORS: Record<Category, string> = {
  [Category.NEWS]: 'bg-red-600',
  [Category.COMMUNITY]: 'bg-green-600',
  [Category.POLITICS]: 'bg-blue-600',
  [Category.SECURITY]: 'bg-orange-600',
  [Category.CULTURE]: 'bg-purple-600',
  [Category.CRIME]: 'bg-gray-800',
  [Category.WEATHER]: 'bg-cyan-600',
  [Category.INFRASTRUCTURE]: 'bg-yellow-600',
  [Category.LOCAL]: 'bg-red-700',
};