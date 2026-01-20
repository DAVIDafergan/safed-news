--- START OF FILE client/src/context/AuthContext.tsx ---

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../../../types'; // וודא שהנתיב נכון
import { AuthService } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (credentials: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // בודק בטעינת האתר אם יש משתמש שמור
  useEffect(() => {
    const checkLoggedIn = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // שחזור המשתמש מהזיכרון המקומי
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse user data", error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setIsLoading(false);
    };

    checkLoggedIn();
  }, []);

  const login = async (credentials: any) => {
    try {
      const data = await AuthService.login(credentials);
      setUser(data.user);
      // ה-AuthService כבר שומר ב-localStorage, אז אין צורך כאן
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};