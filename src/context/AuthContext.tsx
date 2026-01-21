import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// הגדרת הממשק של המשתמש
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'user';
  token?: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, userData: any) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('safed_news_user');
        if (savedUser && savedUser !== "undefined") {
          const parsed = JSON.parse(savedUser);
          if (parsed && parsed.token) {
            setUser(parsed);
            // הגדרת הטוקן כברירת מחדל לכל הבקשות של axios
            axios.defaults.headers.common['x-auth-token'] = parsed.token;
          }
        }
      } catch (err) {
        console.error("שגיאה בטעינת משתמש מה-storage", err);
        localStorage.removeItem('safed_news_user');
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = (token: string, userData: any) => {
    const fullUserData = { ...userData, token };
    localStorage.setItem('safed_news_user', JSON.stringify(fullUserData));
    axios.defaults.headers.common['x-auth-token'] = token;
    setUser(fullUserData);
  };

  const logout = () => {
    localStorage.removeItem('safed_news_user');
    delete axios.defaults.headers.common['x-auth-token'];
    setUser(null);
    window.location.href = '/'; // חזרה לדף הבית בניתוק
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};