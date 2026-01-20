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
        const [p, a, u, m] = await Promise.all([
          axios.get(`${API_URL}/posts`),
          axios.get(`${API_URL}/ads`),
          axios.get(`${API_URL}/users`),
          axios.get(`${API_URL}/contact`)
        ]);
        setPosts(p.data);
        setAds(a.data);
        setRegisteredUsers(u.data);
        setContactMessages(m.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      if (res.data.user) {
        localStorage.setItem('safed_news_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        return true;
      }
      return false;
    } catch (err) { return false; }
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

  const addPost = async (postData: any) => {
    const res = await axios.post(`${API_URL}/posts`, postData);
    setPosts(prev => [res.data, ...prev]);
  };

  const deletePost = async (id: string) => {
    await axios.delete(`${API_URL}/posts/${id}`);
    setPosts(prev => prev.filter(p => p.id !== id));
  };

  const addContactMessage = async (msg: any) => {
    const res = await axios.post(`${API_URL}/contact`, msg);
    setContactMessages(prev => [res.data, ...prev]);
  };

  const toggleAccessibilityOption = (option: keyof AccessibilitySettings) => {
    if (option !== 'fontSize') setAccessibility(prev => ({ ...prev, [option]: !prev[option] }));
  };
  const setFontSize = (size: number) => setAccessibility(prev => ({ ...prev, fontSize: size }));
  const resetAccessibility = () => setAccessibility({ fontSize: 16, highContrast: false, readableFont: false, grayscale: false });

  const incrementViews = (id: string) => {};
  const updateAd = async (id: string, updates: any) => {};
  const createAd = async (ad: any) => {};
  const deleteAd = async (id: string) => {};
  const addComment = async (comment: any) => {};
  const toggleLikeComment = async (id: string) => {};
  const subscribeToNewsletter = async (email: string) => true;
  const sendNewsletter = async () => {};

  return (
    <AppContext.Provider value={{
      posts, ads, user, comments: [], registeredUsers, contactMessages, 
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