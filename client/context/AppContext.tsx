import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Post, Ad, User, Comment, ContactMessage, NewsletterSubscriber, AccessibilitySettings } from '../types';

const API_URL = '/api';

export interface AppState {
  posts: Post[]; ads: Ad[]; user: User | null; comments: Comment[];
  registeredUsers: User[]; contactMessages: ContactMessage[];
  newsletterSubscribers: NewsletterSubscriber[]; accessibility: AccessibilitySettings;
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
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    fontSize: 16, highContrast: false, readableFont: false, grayscale: false,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. טעינת נתונים ציבוריים (לא דורש טוקן)
        const [pRes, aRes] = await Promise.allSettled([
          axios.get(`${API_URL}/posts`),
          axios.get(`${API_URL}/ads`)
        ]);

        if (pRes.status === 'fulfilled') {
          const data = pRes.value.data;
          setPosts(Array.isArray(data) ? data : (data.posts || []));
        }
        if (aRes.status === 'fulfilled') setAds(aRes.value.data);

        // 2. טעינת נתונים מוגנים - רק אם יש משתמש מחובר וטוקן
        if (user && (user as any).token) {
          const config = { headers: { 'x-auth-token': (user as any).token } };
          const [uRes, mRes] = await Promise.allSettled([
            axios.get(`${API_URL}/users`, config),
            axios.get(`${API_URL}/contact`, config)
          ]);

          if (uRes.status === 'fulfilled') setRegisteredUsers(uRes.value.data);
          if (mRes.status === 'fulfilled') setContactMessages(mRes.value.data);
        }
      } catch (err) {
        console.error("Data fetch error:", err);
      } finally {
        setIsLoading(false); // מבטיח שהטעינה תסתיים תמיד
      }
    };
    fetchData();
  }, [user]);

  const login = async (email, password) => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      if (res.data.token) {
        const userData = { ...res.data.user, token: res.data.token };
        localStorage.setItem('safed_news_user', JSON.stringify(userData));
        setUser(userData);
        return true;
      }
      return false;
    } catch { return false; }
  };

  const logout = () => {
    localStorage.removeItem('safed_news_user');
    setUser(null);
  };

  const addPost = async (data) => {
    if (!user) return;
    const config = { headers: { 'x-auth-token': (user as any).token } };
    const res = await axios.post(`${API_URL}/posts`, data, config);
    setPosts(prev => [res.data, ...prev]);
  };

  const deletePost = async (id) => {
    if (!user) return;
    const config = { headers: { 'x-auth-token': (user as any).token } };
    await axios.delete(`${API_URL}/posts/${id}`, config);
    setPosts(prev => prev.filter(p => (p as any)._id !== id && (p as any).id !== id));
  };

  // פונקציות ריקות (Stubs) למניעת שגיאות טיפוסים
  const addContactMessage = async (msg) => { await axios.post(`${API_URL}/contact`, msg); };
  const toggleAccessibilityOption = (opt) => setAccessibility(prev => ({ ...prev, [opt]: !prev[opt] }));
  const setFontSize = (s) => setAccessibility(prev => ({ ...prev, fontSize: s }));
  const resetAccessibility = () => setAccessibility({ fontSize: 16, highContrast: false, readableFont: false, grayscale: false });
  const incrementViews = () => {};
  const updateAd = async () => {};
  const createAd = async () => {};
  const deleteAd = async () => {};
  const addComment = async () => {};
  const toggleLikeComment = async () => {};
  const subscribeToNewsletter = async () => true;
  const sendNewsletter = async () => {};

  return (
    <AppContext.Provider value={{
      posts, ads, user, comments: [], registeredUsers, contactMessages, 
      newsletterSubscribers: [], accessibility, isLoading,
      addPost, deletePost, incrementViews, updateAd, createAd, deleteAd,
      login, logout, register: async () => true, addComment, toggleLikeComment,
      addContactMessage, subscribeToNewsletter, sendNewsletter,
      toggleAccessibilityOption, setFontSize, resetAccessibility
    }}>
      {children}
    </AppContext.Provider>
  );
};