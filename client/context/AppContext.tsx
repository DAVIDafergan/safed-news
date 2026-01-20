import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Post, Ad, User, Comment, ContactMessage, NewsletterSubscriber, AccessibilitySettings } from '../types';

// הגדרת כתובת השרת - ב-Railway זה בדרך כלל נתיב יחסי
const API_URL = '/api';

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
  addPost: (post: any) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  incrementViews: (id: string) => void;
  updateAd: (id: string, updates: Partial<Ad>) => Promise<void>;
  createAd: (ad: Ad) => Promise<void>;
  deleteAd: (id: string) => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (userData: any) => Promise<boolean>;
  addComment: (comment: Comment) => Promise<void>;
  toggleLikeComment: (commentId: string) => Promise<void>;
  addContactMessage: (msg: ContactMessage) => Promise<void>;
  subscribeToNewsletter: (email: string) => Promise<boolean>;
  sendNewsletter: (subject: string, content: string, postId?: string) => Promise<void>;
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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('safed_news_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    fontSize: 16, highContrast: false, readableFont: false, grayscale: false,
  });

  // טעינת נתונים ראשונית מהשרת (כדי שהמידע לא ייעלם בריענון)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const postsRes = await axios.get(`${API_URL}/posts`);
        setPosts(postsRes.data);
        const adsRes = await axios.get(`${API_URL}/ads`);
        setAds(adsRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- התחברות אמיתית ---
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // כאן אנחנו שולחים בקשה אמיתית לשרת ב-Railway
      const res = await axios.post(`${API_URL}/login`, { email, password });
      if (res.data.user) {
        localStorage.setItem('safed_news_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return true;
      }
      return false;
    } catch (err) {
      return false;
    }
  };

  const register = async (userData: any): Promise<boolean> => {
    try {
      const res = await axios.post(`${API_URL}/register`, userData);
      if (res.data.user) {
        localStorage.setItem('safed_news_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return true;
      }
      return false;
    } catch (err) { return false; }
  };

  const logout = () => {
    localStorage.removeItem('safed_news_user');
    setUser(null);
  };

  // --- שמירת תוכן אמיתית במסד הנתונים ---
  const addPost = async (postData: any) => {
    try {
      const res = await axios.post(`${API_URL}/posts`, postData);
      setPosts(prev => [res.data, ...prev]); // עדכון ה-State עם מה שחזר מהמנגו
    } catch (err) { console.error(err); }
  };

  const addContactMessage = async (msg: ContactMessage) => {
    await axios.post(`${API_URL}/contact`, msg);
  };

  // פונקציות עזר לנגישות
  const toggleAccessibilityOption = (option: keyof AccessibilitySettings) => {
    if (option !== 'fontSize') setAccessibility(prev => ({ ...prev, [option]: !prev[option] }));
  };
  const setFontSize = (size: number) => setAccessibility(prev => ({ ...prev, fontSize: size }));
  const resetAccessibility = () => setAccessibility({ fontSize: 16, highContrast: false, readableFont: false, grayscale: false });

  // פונקציות ריקות להשלמה
  const deletePost = async (id: string) => { await axios.delete(`${API_URL}/posts/${id}`); setPosts(prev => prev.filter(p => p.id !== id)); };
  const incrementViews = (id: string) => {};
  const updateAd = async () => {};
  const createAd = async () => {};
  const deleteAd = async () => {};
  const addComment = async () => {};
  const toggleLikeComment = async () => {};
  const subscribeToNewsletter = async () => true;
  const sendNewsletter = async () => {};

  return (
    <AppContext.Provider value={{
      posts, ads, user, comments: [], registeredUsers: [], contactMessages: [], 
      newsletterSubscribers: [], accessibility, isLoading,
      addPost, deletePost, incrementViews, updateAd, createAd, deleteAd,
      login, logout, register, addComment, toggleLikeComment,
      addContactMessage, subscribeToNewsletter, sendNewsletter,
      toggleAccessibilityOption, setFontSize, resetAccessibility
    }}>
      {children}
    </AppContext.Provider>
  );
};