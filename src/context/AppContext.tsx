import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Post, Ad, User, Comment, ContactMessage, NewsletterSubscriber, AccessibilitySettings } from '../types';

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
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    fontSize: 16, highContrast: false, readableFont: false, grayscale: false,
  });

  // טעינת משתמש והגדרת טוקן ראשונית
  useEffect(() => {
    const loadSession = () => {
      const saved = localStorage.getItem('safed_news_user');
      if (saved && saved !== "undefined") {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.token) {
            setUser(parsed);
            axios.defaults.headers.common['x-auth-token'] = parsed.token;
          }
        } catch (e) {
          localStorage.removeItem('safed_news_user');
        }
      }
    };
    loadSession();
  }, []);

  // משיכת נתונים מהשרת
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, aRes] = await Promise.allSettled([
          axios.get(`${API_URL}/posts`),
          axios.get(`${API_URL}/ads`)
        ]);

        if (pRes.status === 'fulfilled') setPosts(Array.isArray(pRes.value.data) ? pRes.value.data : (pRes.value.data.posts || []));
        if (aRes.status === 'fulfilled') setAds(Array.isArray(aRes.value.data) ? aRes.value.data : []);

        if (user?.token) {
          const config = { headers: { 'x-auth-token': user.token } };
          const [uRes, mRes] = await Promise.allSettled([
            axios.get(`${API_URL}/users`, config),
            axios.get(`${API_URL}/contact`, config)
          ]);
          if (uRes.status === 'fulfilled') setRegisteredUsers(uRes.value.data);
          if (mRes.status === 'fulfilled') setContactMessages(mRes.value.data);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      // ניקוי רווחים למניעת שגיאות הקלדה
      const cleanEmail = email.trim().toLowerCase();
      const res = await axios.post(`${API_URL}/login`, { email: cleanEmail, password });
      
      if (res.data.token) {
        const userData = { ...res.data.user, token: res.data.token };
        localStorage.setItem('safed_news_user', JSON.stringify(userData));
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
        setUser(userData);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("שגיאת התחברות:", error.response?.data || error.message);
      return false;
    }
  };

  const register = async (userData: any) => {
    try {
      userData.email = userData.email.trim().toLowerCase();
      const res = await axios.post(`${API_URL}/register`, userData);
      if (res.data.token) {
        const fullUser = { ...res.data.user, token: res.data.token };
        localStorage.setItem('safed_news_user', JSON.stringify(fullUser));
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
        setUser(fullUser);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error("שגיאת רישום:", error.response?.data || error.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('safed_news_user');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
  };

  // --- שאר הפונקציות נשארות ללא שינוי ---
  const addPost = async (data: any) => {
    const res = await axios.post(`${API_URL}/posts`, data);
    setPosts(prev => [res.data, ...prev]);
  };

  const deletePost = async (id: string) => {
    await axios.delete(`${API_URL}/posts/${id}`);
    setPosts(prev => prev.filter(p => (p as any)._id !== id && (p as any).id !== id));
  };

  const incrementViews = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/posts/${id}/view`);
      setPosts(prev => prev.map(p => ((p as any)._id === id || p.id === id) ? { ...p, views: (p.views || 0) + 1 } : p));
    } catch (e) { console.error("Views update failed"); }
  };

  const createAd = async (ad: Ad) => {
    const res = await axios.post(`${API_URL}/ads`, ad);
    setAds(prev => [...prev, res.data]);
  };

  const updateAd = async (id: string, updates: Partial<Ad>) => {
    const res = await axios.patch(`${API_URL}/ads/${id}`, updates);
    setAds(prev => prev.map(a => ((a as any)._id === id || a.id === id) ? res.data : a));
  };

  const deleteAd = async (id: string) => {
    await axios.delete(`${API_URL}/ads/${id}`);
    setAds(prev => prev.filter(a => (a as any)._id !== id && (a as any).id !== id));
  };

  const addContactMessage = async (msg: any) => { await axios.post(`${API_URL}/contact`, msg); };
  const subscribeToNewsletter = async (email: string) => {
    try { await axios.post(`${API_URL}/newsletter/subscribe`, { email }); return true; } catch { return false; }
  };

  const toggleAccessibilityOption = (opt: keyof AccessibilitySettings) => setAccessibility(prev => ({ ...prev, [opt]: !prev[opt] }));
  const setFontSize = (s: number) => setAccessibility(prev => ({ ...prev, fontSize: s }));
  const resetAccessibility = () => setAccessibility({ fontSize: 16, highContrast: false, readableFont: false, grayscale: false });

  return (
    <AppContext.Provider value={{
      posts, ads, user, comments: [], registeredUsers, contactMessages, 
      newsletterSubscribers: [], accessibility, isLoading,
      addPost, deletePost, incrementViews, updateAd, createAd, deleteAd,
      login, logout, register, addComment: async () => {}, toggleLikeComment: async () => {},
      addContactMessage, subscribeToNewsletter, sendNewsletter: async () => {},
      toggleAccessibilityOption, setFontSize, resetAccessibility
    }}>
      {children}
    </AppContext.Provider>
  );
};