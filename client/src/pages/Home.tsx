import React, { useState, useEffect } from 'react';
// import { useApp } from '../context/AppContext'; // נמחק - זה מקור הדמו
import { HeroSlider } from '../components/HeroSlider';
import { PostCard } from '../components/PostCard';
import { AdUnit } from '../components/AdUnit';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Mail } from 'lucide-react';
import { Category, CATEGORY_COLORS, Post, Ad } from '../types';
import { PostService } from '../services/api';
import api from '../services/api'; // לטעינת פרסומות

export const Home: React.FC = () => {
  // מצבים לשמירת הנתונים האמיתיים מהשרת
  const [posts, setPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  // שליפת נתונים בטעינת הדף
  useEffect(() => {
    const fetchData = async () => {
      try {
        // טעינת כתבות (מביאים 100 כדי למלא את כל הקטגוריות בדף הבית)
        // וטעינת פרסומות במקביל
        const [postsData, adsResponse] = await Promise.all([
          PostService.getAll(1, '', 100), // הנחה שהוספת פרמטר limit ל-api.ts, אחרת זה יביא ברירת מחדל
          api.get('/ads')
        ]);

        // תמיכה במבנה תשובה שמחזיר אובייקט עם מערך posts או מערך ישיר
        const realPosts = postsData.posts || postsData;
        
        setPosts(realPosts);
        setAds(adsResponse.data);
      } catch (error) {
        console.error("Failed to load homepage data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // לוגיקה מקורית (נשמרה במדויק)
  const featuredPosts = posts.filter(p => p.isFeatured);
  const latestPosts = posts.slice(0, 6);
  
  // Ad slots Logic
  const leaderboardAd = ads.find(a => a.area === 'leaderboard' && a.isActive);
  const sidebarAd = ads.find(a => a.area === 'sidebar' && a.isActive);
  const sidebarVideoAd = ads.find(a => a.area === 'sidebar_video' && a.isActive);
  const midPageAd = ads.find(a => a.area === 'homepage_mid' && a.isActive);

  // Get all categories except NEWS
  const categoriesToShow = Object.values(Category).filter(c => c !== Category.NEWS);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-700"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-20">
      {/* Hero Section - Full width on mobile */}
      <div className="mb-10 shadow-xl">
        <HeroSlider posts={featuredPosts} />
      </div>

      <div className="container mx-auto px-4">
        
        {/* Main Leaderboard Ad */}
        <div className="mb-12">
           <AdUnit ad={leaderboardAd} className="w-full max-w-6xl mx-auto rounded-lg overflow-hidden shadow-sm" />
        </div>

        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
          
          {/* Main Content Column */}
          <div className="lg:w-2/3">
            
            {/* Latest News Section */}
            <div className="mb-16">
              <div className="flex items-end justify-between mb-8 border-b-2 border-red-50 pb-3">
                <div className="relative">
                  <h2 className="text-3xl font-black text-gray-900 leading-none">
                    חדשות אחרונות
                  </h2>
                  <div className="absolute -bottom-4 right-0 w-20 h-1.5 bg-red-700 rounded-full"></div>
                </div>
                <Link to="/category/חדשות" className="text-red-700 text-sm font-bold flex items-center hover:bg-red-50 px-4 py-2 rounded-full transition-colors border border-red-100">
                  לכל הכתבות <ArrowLeft size={16} className="mr-1" />
                </Link>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {latestPosts.map(post => (
                  // שינוי key ל-_id
                  <PostCard key={post._id} post={post} />
                ))}
              </div>
            </div>

            {/* Mid Page Ad Banner */}
            <div className="mb-16">
                <AdUnit ad={midPageAd} className="w-full rounded-lg overflow-hidden shadow-md border border-gray-100" />
            </div>

            {/* All Categories Loop */}
            <div className="space-y-20">
              {categoriesToShow.map((cat) => {
                 const catPosts = posts.filter(p => p.category === cat).slice(0, 4);
                 if (catPosts.length === 0) return null;
                 
                 const colorClass = CATEGORY_COLORS[cat] || 'bg-gray-600';
                 const textColorClass = colorClass.replace('bg-', 'text-');

                 return (
                   <div key={cat} className="category-section">
                      <div className="flex items-end justify-between mb-8 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-3">
                            <span className={`w-2 h-8 rounded-full ${colorClass}`}></span>
                            <h2 className="text-2xl font-black text-gray-900 leading-none">
                              {cat}
                            </h2>
                        </div>
                        <Link to={`/category/${cat}`} className={`${textColorClass} hover:opacity-80 text-sm font-bold flex items-center bg-gray-50 px-4 py-2 rounded-full transition-colors`}>
                           עוד ב{cat} <ArrowLeft size={16} className="mr-1" />
                        </Link>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {catPosts.map(post => (
                          // שינוי key ל-_id
                          <PostCard key={post._id} post={post} layout="list" />
                        ))}
                      </div>
                   </div>
                 );
              })}
            </div>

          </div>

          {/* Sidebar Column */}
          <aside className="lg:w-1/3 flex flex-col gap-10">
            
            {/* Most Viewed / Trending */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24 z-10">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                 <div className="p-2 bg-red-50 text-red-700 rounded-full">
                   <TrendingUp size={20} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900">
                    הכי נקראים
                 </h3>
              </div>
              
              <ul className="space-y-0 divide-y divide-gray-50">
                {posts
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 5)
                  .map((post, idx) => (
                    // שינוי key ל-_id
                    <li key={post._id} className="py-4 first:pt-0 last:pb-0 group">
                      {/* שינוי לינק ל-_id */}
                      <Link to={`/article/${post._id}`} className="flex gap-4 items-start">
                         <span className={`text-3xl font-black ${idx < 3 ? 'text-red-700/20' : 'text-gray-100'} leading-none`}>0{idx + 1}</span>
                         <div>
                            <h4 className="text-sm font-bold text-gray-800 group-hover:text-red-700 transition-colors line-clamp-2 leading-snug mb-1">
                              {post.title}
                            </h4>
                            <span className="text-xs text-gray-400 block">{post.category}</span>
                         </div>
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>

            {/* Sidebar Standard Ad */}
            <div className="text-center">
              <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 block">פרסומת</span>
              <AdUnit ad={sidebarAd} label={false} className="my-0 w-full" />
            </div>

             {/* Newsletter Signup (Better Design) */}
             <div className="bg-gray-900 rounded-2xl p-8 text-center text-white shadow-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-opacity"></div>
                
                <Mail size={40} className="mx-auto mb-4 text-red-500" />
                <h3 className="text-xl font-black mb-2">חדשות עד הבית</h3>
                <p className="text-gray-400 text-sm mb-6">הירשמו לניוזלטר שלנו וקבלו את כל העדכונים החמים ישירות למייל.</p>
                <div className="space-y-3 relative z-10">
                   <input type="email" placeholder="האימייל שלך..." className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-white placeholder-gray-500" />
                   <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors">הרשמה</button>
                </div>
             </div>

             {/* Sidebar Video Ad */}
             {sidebarVideoAd && sidebarVideoAd.isActive && (
                <div className="text-center">
                  <span className="text-[10px] text-gray-400 uppercase tracking-widest mb-2 block">תוכן מקודם</span>
                  <AdUnit ad={sidebarVideoAd} label={false} className="my-0 w-full rounded-2xl overflow-hidden shadow-lg border border-gray-200" />
                </div>
             )}

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-center">
                <p className="font-bold text-gray-800 mb-1">מעוניינים לפרסם כאן?</p>
                <p className="text-xs text-gray-500 mb-4">חשיפה מקסימלית לתושבי הגליל</p>
                <Link to="/contact" className="inline-block w-full bg-white border-2 border-red-700 text-red-700 hover:bg-red-700 hover:text-white px-4 py-2 rounded-lg text-sm font-bold transition-all duration-300">
                  צרו קשר לפרטים
                </Link>
            </div>

          </aside>

        </div>
      </div>
    </div>
  );
};