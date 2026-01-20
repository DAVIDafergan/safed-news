import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types'; // וודא שהנתיב תואם לתיקיית ה-types שלך
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // בדיקה בטעינת האתר - סנכרון מול ה-LocalStorage המאוחד
  useEffect(() => {
    const checkLoggedIn = () => {
      try {
        const storedData = localStorage.getItem('safed_news_user');
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          // אם יש משתמש וטוקן, אנחנו מחשיבים אותו כמחובר
          if (parsedData && parsedData.token) {
            setUser(parsedData);
          }
        }
      } catch (error) {
        console.error("Failed to parse user data from storage", error);
        localStorage.removeItem('safed_news_user');
      } finally {
        setIsLoading(false); // מבטיח שהאפליקציה תצא ממצב טעינה ולא תיתקע על מסך לבן
      }
    };

    checkLoggedIn();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const data = await api.login(email, pass);
      if (data && data.token) {
        // איחוד הנתונים לאובייקט אחד ושמירה ב-LocalStorage
        const userData = { ...data.user, token: data.token };
        localStorage.setItem('safed_news_user', JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error("פרטי התחברות שגויים");
      }
    } catch (error) {
      console.error("Login error", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('safed_news_user');
    setUser(null);
    // אופציונלי: ריענון דף כדי לנקות את כל ה-State של האפליקציה
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {/* אם המערכת בטעינה ראשונית, נציג מסך טעינה נקי ולא מסך לבן */}
      {!isLoading ? children : (
        <div className="min-h-screen flex items-center justify-center bg-white">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-red-700"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};