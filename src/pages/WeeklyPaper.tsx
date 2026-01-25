import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Newspaper } from '../types';
import { ChevronRight, ChevronLeft, Calendar, Loader2 } from 'lucide-react';

export const WeeklyPaper: React.FC = () => {
  const [papers, setPapers] = useState<Newspaper[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0); // 0 = הכי חדש
  const [loading, setLoading] = useState(true);

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
    }
  };

  const currentPaper = papers[currentIndex];

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>;
  if (!currentPaper) return <div className="text-center p-20 text-xl">עדיין לא הועלו גיליונות.</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
      {/* כותרת וניווט */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-black text-red-700 flex items-center gap-2">
          <Calendar />
          העיתון השבועי: {currentPaper.title}
        </h1>
        
        <div className="flex gap-4 mt-4 md:mt-0">
          <button 
            onClick={() => setCurrentIndex(prev => prev + 1)}
            disabled={currentIndex >= papers.length - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            <ChevronRight size={18} />
            לגיליון הקודם
          </button>
          
          <button 
            onClick={() => setCurrentIndex(prev => prev - 1)}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
          >
            לגיליון הבא
            <ChevronLeft size={18} />
          </button>
        </div>
      </div>

      {/* אזור הצגת ה-PDF */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden h-[80vh]">
        <iframe 
          src={currentPaper.pdfUrl} 
          className="w-full h-full"
          title="Weekly Newspaper PDF"
        />
      </div>
      
      <p className="text-center text-gray-500 mt-4 text-sm">
        ניתן לבצע זום, להוריד או להדפיס באמצעות הסרגל העליון בתוך הצפייה בקובץ.
      </p>
    </div>
  );
};