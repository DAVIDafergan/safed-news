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

      {/* כפתור וואטסאפ קבוע */}
      <a
        href="https://api.whatsapp.com/send?phone=972525981770&text=היי+אשמח+לעזרה+בנוגע+לאתר+צפת+בתנופה"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 left-5 z-50 flex items-center justify-center w-16 h-16 bg-[#25D366] rounded-full shadow-2xl hover:bg-[#20ba5a] transition-all duration-300 hover:scale-110"
        aria-label="צרו קשר בוואטסאפ"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="32" 
          height="32" 
          viewBox="0 0 24 24" 
          fill="white"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-8.68-2.031-.967-.272-.099-.47-.149-.669.198-.198.347-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.151-.174.2-.298.3-.495.099-.198.05-.372-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
      </a>

    </div>
  );
};

export default App;