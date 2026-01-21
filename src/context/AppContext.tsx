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
  addComment: (comment: Partial<Comment>) => Promise<void>;
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
    try {
      const saved = localStorage.getItem('safed_news_user');
      return (saved && saved !== "undefined") ? JSON.parse(saved) : null;
    } catch (err) {
      localStorage.removeItem('safed_news_user');
      return null;
    }
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>({
    fontSize: 16, highContrast: false, readableFont: false, grayscale: false,
  });

  const getAuthConfig = () => {
    const token = (user as any)?.token;
    return token ? { headers: { 'x-auth-token': token } } : {};
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pRes, aRes, cRes] = await Promise.allSettled([
          axios.get(`${API_URL}/posts`),
          axios.get(`${API_URL}/ads`),
          axios.get(`${API_URL}/comments`) // טעינת תגובות מהשרת
        ]);

        if (pRes.status === 'fulfilled') {
          setPosts(Array.isArray(pRes.value.data) ? pRes.value.data : (pRes.value.data.posts || []));
        }
        if (aRes.status === 'fulfilled') {
          setAds(Array.isArray(aRes.value.data) ? aRes.value.data : []);
        }
        if (cRes.status === 'fulfilled') {
          setComments(cRes.value.data);
        }

        if (user && (user as any).token) {
          const config = getAuthConfig();
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
    const res = await axios.post(`${API_URL}/posts`, data, getAuthConfig());
    setPosts(prev => [res.data, ...prev]);
  };

  const deletePost = async (id) => {
    await axios.delete(`${API_URL}/posts/${id}`, getAuthConfig());
    setPosts(prev => prev.filter(p => (p as any)._id !== id && (p as any).id !== id));
  };

  const incrementViews = async (id: string) => {
    try {
      await axios.patch(`${API_URL}/posts/${id}/view`);
      setPosts(prev => prev.map(p => 
        ((p as any)._id === id || p.id === id) ? { ...p, views: (p.views || 0) + 1 } : p
      ));
    } catch (e) { console.error("Views update failed"); }
  };

  // --- תגובות (Comments) ---
  const addComment = async (commentData: Partial<Comment>) => {
    try {
      const res = await axios.post(`${API_URL}/comments`, commentData);
      setComments(prev => [res.data, ...prev]);
    } catch (err) {
      console.error("שגיאה בהוספת תגובה:", err);
    }
  };

  const toggleLikeComment = async (commentId: string) => {
    try {
      const res = await axios.post(`${API_URL}/comments/${commentId}/like`, {}, getAuthConfig());
      setComments(prev => prev.map(c => 
        ((c as any)._id === commentId || c.id === commentId) ? res.data : c
      ));
    } catch (err) {
      console.error("שגיאה בלייק לתגובה:", err);
    }
  };

  const createAd = async (ad: Ad) => {
    const res = await axios.post(`${API_URL}/ads`, ad, getAuthConfig());
    setAds(prev => [...prev, res.data]);
  };

  const updateAd = async (id: string, updates: Partial<Ad>) => {
    const res = await axios.patch(`${API_URL}/ads/${id}`, updates, getAuthConfig());
    setAds(prev => prev.map(a => ((a as any)._id === id || a.id === id) ? res.data : a));
  };

  const deleteAd = async (id: string) => {
    await axios.delete(`${API_URL}/ads/${id}`, getAuthConfig());
    setAds(prev => prev.filter(a => (a as any)._id !== id && (a as any).id !== id));
  };

  const addContactMessage = async (msg) => { 
    await axios.post(`${API_URL}/contact`, msg); 
  };

  const subscribeToNewsletter = async (email: string) => {
    try {
      await axios.post(`${API_URL}/newsletter/subscribe`, { email });
      return true;
    } catch { return false; }
  };

  const toggleAccessibilityOption = (opt) => setAccessibility(prev => ({ ...prev, [opt]: !prev[opt] }));
  const setFontSize = (s) => setAccessibility(prev => ({ ...prev, fontSize: s }));
  const resetAccessibility = () => setAccessibility({ fontSize: 16, highContrast: false, readableFont: false, grayscale: false });

  return (
    <AppContext.Provider value={{
      posts, ads, user, comments, registeredUsers, contactMessages, 
      newsletterSubscribers: [], accessibility, isLoading,
      addPost, deletePost, incrementViews, updateAd, createAd, deleteAd,
      login, logout, register: async () => true, addComment, toggleLikeComment,
      addContactMessage, subscribeToNewsletter, sendNewsletter: async () => {},
      toggleAccessibilityOption, setFontSize, resetAccessibility
    }}>
      {children}
    </AppContext.Provider>
  );
};