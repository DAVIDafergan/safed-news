import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { NewsTicker } from './components/NewsTicker';
import { Home } from './pages/Home';
import { Article } from './pages/Article';
import { CategoryPage } from './pages/CategoryPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Contact } from './pages/Contact';
import { AccessibilityWidget } from './components/AccessibilityWidget';
import { Loader2 } from 'lucide-react';
import { useApp } from './context/AppContext'; 
import { Category } from './types';

const App: React.FC = () => {
  // שליפת הנתונים מה-Context המרכזי
  const { user, posts, isLoading } = useApp();

  // מסך טעינה עד שהנתונים מגיעים מהשרת ב-Railway
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <Loader2 size={40} className="animate-spin text-red-700" />
        <p className="text-gray-500 font-bold">טוען נתונים...</p>
      </div>
    );
  }

  // סינון מבזקים עבור הטיקר העליון
  const tickerPosts = posts.filter(p => p.category === Category.NEWS || p.category === 'מבזקים');

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-900 bg-[#f8f9fa] relative">
      <Header onSearch={() => {}} user={user} />
      
      {/* הצגת טיקר המבזקים רק במסכים רחבים */}
      <div className="hidden md:block">
        <NewsTicker posts={tickerPosts.slice(0, 10)} />
      </div>
      
      <main id="main-content" className="flex-1 w-full max-w-[100vw] overflow-x-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* נתיב דינמי לכתבה בודדת - כאן מתבצע החיבור ל-ID */}
          <Route path="/article/:id" element={<Article />} />
          
          <Route path="/category/:categoryName" element={<CategoryPage />} />
          
          {/* הגנת נתיב ניהול: רק אדמין יכול להיכנס */}
          <Route 
            path="/admin" 
            element={user && (user.role === 'admin' || user.role === 'editor') ? <AdminDashboard /> : <Login />} 
          />
          
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* ניתוב מחדש במקרה של דף לא נמצא */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="bg-[#111] text-gray-400 py-16 mt-12 border-t-8 border-red-700 text-right">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <h3 className="text-white text-2xl font-bold mb-4">צפת בתנופה</h3>
            <p className="text-sm">האתר המוביל לחדשות וקהילה בצפת.</p>
          </div>
          {/* ניתן להוסיף כאן עמודות נוספות לפוטר */}
        </div>
      </footer>

      <AccessibilityWidget />
    </div>
  );
};

export default App;