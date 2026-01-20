import { Post, Ad, User, Comment, ContactMessage, NewsletterSubscriber } from '../types';

// בייצור ב-Railway, אנחנו משתמשים בנתיב יחסי
const API_URL = '/api';

// פונקציית עזר לקבלת הטוקן המאובטח מהאחסון
const getAuthHeader = () => {
  const savedUser = localStorage.getItem('safed_news_user');
  if (savedUser) {
    const { token } = JSON.parse(savedUser);
    return token ? { 'x-auth-token': token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }
  return { 'Content-Type': 'application/json' };
};

export const api = {
  // --- אתחול נתונים ---
  fetchInitialData: async () => {
    try {
      const [postsRes, adsRes] = await Promise.all([
        fetch(`${API_URL}/posts`).then(r => r.json()),
        fetch(`${API_URL}/ads`).then(r => r.json())
      ]);

      return { 
        posts: Array.isArray(postsRes) ? postsRes : (postsRes.posts || []), 
        ads: adsRes, 
        comments: [], 
        registeredUsers: [],
        contactMessages: [],
        newsletterSubscribers: []
      };
    } catch (error) {
      console.error("Server connection failed", error);
      throw error;
    }
  },

  // --- כתבות (Posts) ---
  addPost: async (post: Post) => {
    const response = await fetch(`${API_URL}/posts`, { 
      method: 'POST', 
      headers: getAuthHeader(),
      body: JSON.stringify(post) 
    });
    if (!response.ok) throw new Error('Failed to add post');
    return response.json();
  },

  deletePost: async (id: string) => {
    const response = await fetch(`${API_URL}/posts/${id}`, { 
      method: 'DELETE',
      headers: getAuthHeader()
    });
    if (!response.ok) throw new Error('Failed to delete post');
    return response.json();
  },

  incrementViews: async (id: string) => {
    // שליחה שקטה של עדכון צפייה
    fetch(`${API_URL}/posts/${id}`).catch(() => {});
  },

  // --- פרסומות (Ads) ---
  updateAd: async (id: string, updates: Partial<Ad>) => {
    const response = await fetch(`${API_URL}/ads/${id}`, { 
      method: 'PATCH', 
      headers: getAuthHeader(),
      body: JSON.stringify(updates) 
    });
    return response.json();
  },

  createAd: async (ad: Ad) => {
    const response = await fetch(`${API_URL}/ads`, { 
      method: 'POST', 
      headers: getAuthHeader(),
      body: JSON.stringify(ad) 
    });
    return response.json();
  },

  // --- משתמשים ואימות (Auth) ---
  login: async (email: string, pass: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass })
    });
    
    if (!response.ok) return null;
    return response.json(); // מחזיר { token, user }
  },

  register: async (userData: any) => {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.ok;
  },

  // --- הודעות צור קשר ---
  sendMessage: async (msg: ContactMessage) => {
    const response = await fetch(`${API_URL}/contact`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg) 
    });
    return response.ok;
  },

  // --- ניוזלטר ---
  subscribe: async (email: string) => {
    const response = await fetch(`${API_URL}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    return response.ok;
  }
};