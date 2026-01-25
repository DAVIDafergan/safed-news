import React from 'react';
import { useApp } from '../context/AppContext';
import { HeroSlider } from '../components/HeroSlider';
import { PostCard } from '../components/PostCard';
import { AdUnit } from '../components/AdUnit';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Mail, Loader2 } from 'lucide-react';
import { Category, CATEGORY_COLORS } from '../types';

export const Home: React.FC = () => {
  // שימוש ב-Context המרכזי כדי למנוע שגיאות אימפורט ולוודא שהנתונים נשמרים בריענון
  const { posts, ads, isLoading } = useApp();

  // סינון כתבות מודגשות וכתבות אחרונות
  const featuredPosts = posts.filter(p => p.isFeatured);
  const latestPosts = posts.slice(0, 6);
  
  // מיקומי פרסומות
  const leaderboardAd = ads.find(a => a.area === 'leaderboard' && a.isActive);
  const sidebarAd = ads.find(a => a.area === 'sidebar' && a.isActive);
  const sidebarVideoAd = ads.find(a => a.area === 'sidebar_video' && a.isActive);
  const midPageAd = ads.find(a => a.area === 'homepage_mid' && a.isActive);

  // קטגוריות להצגה (ללא "חדשות" שמופיעות בנפרד למעלה)
  const categoriesToShow = Object.values(Category).filter(c => c !== Category.NEWS);

  // מסך טעינה מודרני
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-red-700" size={48} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20 bg-gray-50/30">
      {/* Hero Section - Slider של כתבות מודגשות */}
      <div className="mb-10 shadow-2xl">
        <HeroSlider posts={featuredPosts} />
      </div>

      <div className="container mx-auto px-4">
        
        {/* פרסומת ראשית (Leaderboard) */}
        <div className="mb-12">
           <AdUnit ad={leaderboardAd} className="w-full max-w-6xl mx-auto rounded-xl overflow-hidden shadow-md" />
        </div>

      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          
          {/* עמודה מרכזית - כתבות */}
          <div className="lg:w-2/3">
            
            {/* סקציית חדשות אחרונות */}
            <div className="mb-16">
              <div className="flex items-end justify-between mb-10 border-b-4 border-gray-100 pb-4">
                <div className="relative">
                  <h2 className="text-3xl md:text-4xl font-black text-gray-900 leading-none tracking-tighter">
                    חדשות אחרונות
                  </h2>
                  <div className="absolute -bottom-[18px] right-0 w-24 h-2 bg-red-700 rounded-full z-10"></div>
                </div>
                <Link to="/category/חדשות" className="text-red-700 text-sm font-black flex items-center hover:bg-red-700 hover:text-white px-5 py-2.5 rounded-full transition-all border-2 border-red-700 uppercase tracking-tight">
                  לכל הכתבות <ArrowLeft size={18} className="mr-2" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {latestPosts.map(post => (
                  <PostCard key={post.id || (post as any)._id} post={post} />
                ))}
              </div>
            </div>

            {/* באנר פרסומת אמצע דף */}
            <div className="mb-16">
                <AdUnit ad={midPageAd} className="w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100" />
            </div>

            {/* לופ קטגוריות */}
            <div className="space-y-24">
              {categoriesToShow.map((cat) => {
                 const catPosts = posts.filter(p => p.category === cat).slice(0, 4);
                 if (catPosts.length === 0) return null;
                 
                 const colorClass = CATEGORY_COLORS[cat] || 'bg-gray-600';
                 const textColorClass = colorClass.replace('bg-', 'text-');

                 return (
                   <div key={cat} className="category-section">
                      <div className="flex items-end justify-between mb-8 border-b-2 border-gray-100 pb-4">
                        <div className="flex items-center gap-4">
                            <span className={`w-3 h-10 rounded-sm ${colorClass}`}></span>
                            <h2 className="text-3xl font-black text-gray-900 leading-none tracking-tighter">
                              {cat}
                            </h2>
                        </div>
                        <Link to={`/category/${cat}`} className={`${textColorClass} hover:opacity-80 text-sm font-black flex items-center bg-white border border-gray-200 shadow-sm px-5 py-2 rounded-full transition-all`}>
                            עוד ב{cat} <ArrowLeft size={16} className="mr-2" />
                        </Link>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {catPosts.map(post => (
                          <PostCard key={post.id || (post as any)._id} post={post} layout="list" />
                        ))}
                      </div>
                   </div>
                 );
              })}
            </div>

          </div>

          {/* עמודת צד (Sidebar) */}
          <aside className="lg:w-1/3 flex flex-col gap-12">
            
            {/* הכי נקראים - עיצוב מודרני מודגש */}
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-28 z-10">
              <div className="flex items-center gap-3 mb-8 pb-5 border-b-2 border-gray-50">
                 <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-200">
                   <TrendingUp size={24} />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 tracking-tighter">
                    הכי נקראים
                 </h3>
              </div>
              
              <ul className="space-y-0 divide-y-2 divide-gray-50">
                {[...posts]
                  .sort((a, b) => (b.views || 0) - (a.views || 0))
                  .slice(0, 5)
                  .map((post, idx) => (
                    <li key={post.id || (post as any)._id} className="py-6 first:pt-0 last:pb-0 group">
                      <Link to={`/article/${post.id || (post as any)._id}`} className="flex gap-5 items-start">
                         <span className={`text-4xl font-black ${idx < 3 ? 'text-red-600/10' : 'text-gray-100'} leading-none shrink-0`}>
                           {idx + 1}
                         </span>
                         <div>
                            <h4 className="text-base font-extrabold text-gray-800 group-hover:text-red-700 transition-colors line-clamp-2 leading-tight mb-2 tracking-tight">
                              {post.title}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-gray-400'}`}></span>
                              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{post.category}</span>
                            </div>
                         </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>

            {/* פרסומת סיידבר */}
            <div className="text-center group">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">פרסומת</span>
              <AdUnit ad={sidebarAd} className="my-0 w-full rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow" />
            </div>

             {/* ניוזלטר - עיצוב יוקרתי */}
             <div className="bg-gradient-to-br from-gray-900 to-black rounded-3xl p-10 text-center text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-red-600 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                
                <Mail size={48} className="mx-auto mb-6 text-red-500" />
                <h3 className="text-2xl font-black mb-3 tracking-tighter">חדשות עד הבית</h3>
                <p className="text-gray-400 text-sm mb-8 font-medium">הירשמו לניוזלטר שלנו וקבלו את כל העדכונים החמים ישירות למייל.</p>
                <div className="space-y-4 relative z-10">
                   <input 
                     type="email" 
                     placeholder="האימייל שלך..." 
                     className="w-full bg-white/5 border-2 border-white/10 rounded-xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-red-600 text-white placeholder-gray-500 transition-all" 
                   />
                   <button className="w-full bg-red-600 hover:bg-red-700 text-white font-black py-4 rounded-xl shadow-lg shadow-red-900/20 transition-all active:scale-95">
                     הרשמה עכשיו
                   </button>
                </div>
             </div>

             {/* פרסומת וידאו סיידבר */}
             {sidebarVideoAd && sidebarVideoAd.isActive && (
                <div className="text-center">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 block">תוכן מקודם</span>
                  <AdUnit ad={sidebarVideoAd} className="my-0 w-full rounded-2xl overflow-hidden shadow-xl border-2 border-gray-100" />
                </div>
             )}

            {/* באנר צור קשר לפרסום */}
            <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-gray-200 text-center hover:border-red-200 transition-colors">
                <p className="font-black text-gray-900 text-lg mb-2 tracking-tight">מעוניינים לפרסם כאן?</p>
                <p className="text-sm text-gray-500 mb-6 font-medium">חשיפה מקסימלית לתושבי הגליל והסביבה</p>
                <Link to="/contact" className="inline-block w-full bg-black text-white px-6 py-4 rounded-xl font-black text-sm hover:bg-red-700 transition-all shadow-lg">
                  צרו קשר לפרטים נוספים
                </Link>
            </div>

          </aside>

        </div>
      </div>
    </div>
  );
};