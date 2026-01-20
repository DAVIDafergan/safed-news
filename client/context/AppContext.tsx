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
        // טעינת נתונים ציבוריים בלבד בטעינה ראשונה - מונע שגיאות 401 לקבלת מסך לבן
        const [postsRes, adsRes] = await Promise.all([
          axios.get(`${API_URL}/posts`).catch(() => ({ data: [] })),
          axios.get(`${API_URL}/ads`).catch(() => ({ data: [] }))
        ]);
        
        // וידוא שהנתונים הם מערכים לפני העדכון (תמיכה במבנה אובייקט של פוסטים)
        const pData = postsRes.data;
        setPosts(Array.isArray(pData) ? pData : (pData.posts || []));
        setAds(Array.isArray(adsRes.data) ? adsRes.data : []);

        // משיכת נתונים מוגנים (משתמשים והודעות) רק אם יש טוקן שמור
        // שים לב: אנחנו מחפשים טוקן ב-localStorage או בתוך אובייקט המשתמש השמור
        const savedUserData = localStorage.getItem('safed_news_user');
        const token = savedUserData ? JSON.parse(savedUserData).token : null;

        if (token) {
          const config = { headers: { 'x-auth-token': token } };
          const [uRes, mRes] = await Promise.all([
            axios.get(`${API_URL}/users`, config).catch(() => ({ data: [] })),
            axios.get(`${API_URL}/contact`, config).catch(() => ({ data: [] }))
          ]);
          setRegisteredUsers(uRes.data);
          setContactMessages(mRes.data);
        }
      } catch (err) {
        console.error("Critical error in fetchData:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      if (res.data.user || res.data.token) {
        // שומרים את כל אובייקט התגובה הכולל את הטוקן והמשתמש
        const userData = { ...res.data.user, token: res.data.token };
        localStorage.setItem('safed_news_user', JSON.stringify(userData));
        setUser(userData);
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
      if (res.data.user || res.data.token) {
        const fullUserData = { ...res.data.user, token: res.data.token };
        localStorage.setItem('safed_news_user', JSON.stringify(fullUserData));
        setUser(fullUserData);
        return true;
      }
      return false;
    } catch (err) { 
      return false; 
    }
  };

  const logout = () => {
    localStorage.removeItem('safed_news_user');
    setUser(null);
  };

  const addPost = async (postData: any) => {
    try {
      const res = await axios.post(`${API_URL}/posts`, postData);
      setPosts(prev => [res.data, ...prev]);
    } catch (err) {
      console.error("Failed to add post:", err);
    }
  };

  const deletePost = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/posts/${id}`);
      setPosts(prev => prev.filter(p => (p as any).id !== id && (p as any)._id !== id));
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  const addContactMessage = async (msg: any) => {
    try {
      const res = await axios.post(`${API_URL}/contact`, msg);
      setContactMessages(prev => [res.data, ...prev]);
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const toggleAccessibilityOption = (option: keyof AccessibilitySettings) => {
    if (option !== 'fontSize') setAccessibility(prev => ({ ...prev, [option]: !prev[option] }));
  };

  const setFontSize = (size: number) => setAccessibility(prev => ({ ...prev, fontSize: size }));

  const resetAccessibility = () => setAccessibility({ fontSize: 16, highContrast: false, readableFont: false, grayscale: false });

  // פונקציות להשלמה עתידית (Stubs) - נשמרות כדי לא לשבור את הטיפוסים
  const incrementViews = (id: string) => {
    axios.get(`${API_URL}/posts/${id}`).catch(() => {});
  };

  const updateAd = async (id: string, updates: any) => { console.log("Update Ad", id, updates); };
  const createAd = async (ad: any) => { console.log("Create Ad", ad); };
  const deleteAd = async (id: string) => { console.log("Delete Ad", id); };
  const addComment = async (comment: any) => { console.log("Add Comment", comment); };
  const toggleLikeComment = async (id: string) => { console.log("Like Comment", id); };
  const subscribeToNewsletter = async (email: string) => { 
    console.log("Newsletter Subscribe", email);
    return true; 
  };
  const sendNewsletter = async (subject: string, content: string) => { 
    console.log("Send Newsletter", subject, content); 
  };

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