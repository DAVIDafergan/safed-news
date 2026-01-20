import React, { createContext, useContext, useState, useEffect } from 'react';
import { Post, Ad, User, Comment, ContactMessage, NewsletterSubscriber, AccessibilitySettings } from '../types';

export interface AppState {
  posts: Post[];
  ads: Ad[];
  user: User | null;
  comments: Comment[];
  registeredUsers: User[];
  contactMessages: ContactMessage[];
  newsletterSubscribers: NewsletterSubscriber[];
  accessibility: AccessibilitySettings;
  isLoading: boolean;
  
  // Async Actions
  addPost: (post: Post) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  incrementViews: (id: string) => void;
  updateAd: (id: string, updates: Partial<Ad>) => Promise<void>;
  createAd: (ad: Ad) => Promise<void>;
  deleteAd: (id: string) => Promise<void>;
  
  login: (usernameOrEmail: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (user: User) => Promise<boolean>;
  
  addComment: (comment: Comment) => Promise<void>;
  toggleLikeComment: (commentId: string) => Promise<void>;
  
  addContactMessage: (msg: ContactMessage) => Promise<void>;
  subscribeToNewsletter: (email: string) => Promise<boolean>;
  sendNewsletter: (subject: string, content: string, postId?: string) => Promise<void>;
  
  // Accessibility (Sync)
  toggleAccessibilityOption: (option: keyof AccessibilitySettings) => void;
  setFontSize: (size: number) => void;
  resetAccessibility: () => void;
}

export const AppContext = createContext<AppState | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

// --- מימוש ה-Provider ---

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. אתחול המשתמש ישירות מה-localStorage כדי למנוע ניתוק ברענון
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('safed_news_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    fontSize: 16,
    highContrast: false,
    readableFont: false,
    grayscale: false,
  });

  // --- לוגיקת התחברות עם שמירה בזיכרון ---
  const login = async (usernameOrEmail: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // כאן תבצע את הקריאה ל-API שלך בשרת (Railway)
      const mockUser: User = { 
        id: '1', 
        name: usernameOrEmail, 
        email: usernameOrEmail, 
        role: usernameOrEmail === 'admin' ? 'admin' : 'user' 
      };

      // השורה הקריטית: שמירה בדפדפן
      localStorage.setItem('safed_news_user', JSON.stringify(mockUser));
      setUser(mockUser);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // מחיקה מהדפדפן ומה-State
    localStorage.removeItem('safed_news_user');
    setUser(null);
  };

  const register = async (userData: User): Promise<boolean> => {
    // לוגיקת הרשמה מול השרת
    return true;
  };

  // --- ניהול תוכן ---
  const addPost = async (post: Post) => {
    setPosts([post, ...posts]);
  };

  const deletePost = async (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
  };

  const incrementViews = (id: string) => {
    setPosts(posts.map(p => p.id === id ? { ...p, views: (p.views || 0) + 1 } : p));
  };

  const addContactMessage = async (msg: ContactMessage) => {
    setContactMessages([msg, ...contactMessages]);
  };

  // --- נגישות ---
  const toggleAccessibilityOption = (option: keyof AccessibilitySettings) => {
    if (option !== 'fontSize') {
      setAccessibility(prev => ({ ...prev, [option]: !prev[option] }));
    }
  };

  const setFontSize = (size: number) => {
    setAccessibility(prev => ({ ...prev, fontSize: size }));
  };

  const resetAccessibility = () => {
    setAccessibility({
      fontSize: 16,
      highContrast: false,
      readableFont: false,
      grayscale: false,
    });
  };

  // פונקציות להשלמת ה-Interface
  const updateAd = async () => {};
  const createAd = async () => {};
  const deleteAd = async () => {};
  const addComment = async () => {};
  const toggleLikeComment = async () => {};
  const subscribeToNewsletter = async () => true;
  const sendNewsletter = async () => {};

  return (
    <AppContext.Provider value={{
      posts, ads, user, comments, registeredUsers, contactMessages, 
      newsletterSubscribers, accessibility, isLoading,
      addPost, deletePost, incrementViews, updateAd, createAd, deleteAd,
      login, logout, register, addComment, toggleLikeComment,
      addContactMessage, subscribeToNewsletter, sendNewsletter,
      toggleAccessibilityOption, setFontSize, resetAccessibility
    }}>
      {children}
    </AppContext.Provider>
  );
};