import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Newspaper } from '../types';
import { ChevronRight, ChevronLeft, Calendar, Loader2, Download, RefreshCw, ExternalLink } from 'lucide-react';

export const WeeklyPaper: React.FC = () => {
  const [papers, setPapers] = useState<Newspaper[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = הכי חדש
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPapers = async () => {
    try {
      const data = await api.getNewspapers();
      setPapers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPapers();
  };

  const currentPaper = papers[currentIndex];

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-red-700" size={40} /></div>;

  // מצב בו אין גיליונות
  if (!currentPaper) return (
    <div className="flex flex-col items-center justify-center p-20 text-center gap-4">
        <p className="text-xl text-gray-600">עדיין לא הועלו גיליונות.</p>
        <button 
            onClick={handleRefresh} 
            className="flex items-center gap-2 text-red-700 font-bold hover:bg-red-50 p-2 rounded transition"
        >
            <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
            נסה לרענן שוב
        </button>
    </div>
  );

  // יצירת קישור למציג של גוגל (פותר את הבעיה בנייד)
  // אנחנו בודקים אם ה-URL הוא מלא (S3) או מקומי, ומקודדים אותו
  const isPdf = currentPaper.pdfUrl.toLowerCase().endsWith('.pdf') || currentPaper.pdfUrl.includes('upload'); 
  // בנייד עדיף להשתמש ב-Google Viewer
  const googleViewerUrl = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(currentPaper.pdfUrl)}`;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      {/* כותרת וניווט */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div className="text-center md:text-right">
            <h1 className="text-2xl font-black text-red-700 flex items-center justify-center md:justify-start gap-2">
            <Calendar />
            העיתון השבועי
            </h1>
            <p className="text-gray-500 text-sm mt-1">{currentPaper.title} | {currentPaper.date}</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          <button 
            onClick={() => setCurrentIndex(prev => prev + 1)}
            disabled={currentIndex >= papers.length - 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            <ChevronRight size={16} />
            הקודם
          </button>
          
          <button 
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-md"
          >
            הבא
            <ChevronLeft size={16} />
          </button>

           {/* כפתור הורדה ישירה - קריטי לנייד */}
           <a 
            href={currentPaper.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm font-medium"
          >
            <Download size={16} />
            הורד
          </a>
        </div>
      </div>

      {/* אזור הצגת ה-PDF */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-[75vh] relative group">
        
        {/* שימוש במציג של גוגל שעובד בכל המכשירים */}
        <iframe 
          src={googleViewerUrl} 
          className="w-full h-full border-none"
          title="Weekly Newspaper Reader"
        />

        {/* שכבת עזרה אם ה-PDF לא נטען */}
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 -z-10">
             <div className="text-center p-4">
                 <Loader2 className="animate-spin mx-auto text-gray-400 mb-2" />
                 <p className="text-gray-500">טוען תצוגה מקדימה...</p>
                 <a href={currentPaper.pdfUrl} target="_blank" rel="noreferrer" className="text-red-600 font-bold mt-2 block underline">
                     לא נפתח? לחץ כאן להורדה
                 </a>
             </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center text-gray-400 text-xs px-2">
         <span>מציג ע"י Google Docs Viewer</span>
         <button onClick={handleRefresh} className="flex items-center gap-1 hover:text-red-600 transition">
             <RefreshCw size={12} /> רענן נתונים
         </button>
      </div>
    </div>
  );
};