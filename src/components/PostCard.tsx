import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, Share2, ChevronLeft, Loader2, Eye, Trash2 } from 'lucide-react';
import { Post, CATEGORY_COLORS } from '../types';
import { useApp } from '../context/AppContext';

interface PostCardProps {
  post: Post;
  layout?: 'grid' | 'list';
}

export const PostCard: React.FC<PostCardProps> = ({ post, layout = 'grid' }) => {
  const navigate = useNavigate();
  const { user, deletePost } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const categoryColor = CATEGORY_COLORS[post.category] || 'bg-gray-600';

  // התיקון לניווט: שימוש ב-_id של MongoDB
  const postId = (post as any)._id || post.id;

  const shareOnWhatsapp = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = encodeURIComponent(`${post.title}\nלקריאה: https://zfatbt.com/p/${post.shortLinkCode}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleReadMore = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;
    
    setIsLoading(true);
    // Simulate network request/loading time for visual feedback
    setTimeout(() => {
      setIsLoading(false);
      navigate(`/article/${postId}`);
    }, 600);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm('האם אתה בטוח שברצונך למחוק כתבה זו?')) {
      await deletePost(postId);
    }
  };

  if (layout === 'list') {
    return (
      <Link to={`/article/${postId}`} className="flex gap-5 group bg-white p-4 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden transform hover:-translate-x-1 relative">
        {/* כפתור מחיקה למנהל בלבד ברשימה */}
        {user?.role === 'admin' && (
          <button 
            onClick={handleDelete}
            className="absolute top-2 right-2 z-30 bg-red-600 text-white p-1.5 rounded-full shadow-lg hover:bg-red-800 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        )}

        <div className="w-1/3 md:w-1/4 shrink-0 overflow-hidden rounded-xl relative aspect-[4/3] md:aspect-video shadow-inner">
           <img 
            src={post.imageUrl || '/assets/logo.png'} 
            alt={post.title} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
            onError={(e) => { e.currentTarget.src = '/assets/logo.png'; }}
          />
           <span className={`absolute bottom-0 right-0 ${categoryColor} text-white text-[10px] md:text-xs px-3 py-1 rounded-tl-xl font-bold shadow-md`}>
            {post.category}
          </span>
        </div>
        <div className="flex-1 flex flex-col justify-between py-1">
          <div>
            <h3 className="font-bold text-lg md:text-xl leading-snug text-gray-900 group-hover:text-red-700 transition-colors mb-3 line-clamp-2">
              {post.title}
            </h3>
            <p className="text-sm text-gray-500 line-clamp-2 hidden md:block font-normal leading-relaxed">
              {post.excerpt}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400 mt-3 border-t border-gray-50 pt-3 md:border-none md:pt-0">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 font-medium bg-gray-50 px-2 py-1 rounded-md">
                <Clock size={12} />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Eye size={12} />
                <span>{post.views}</span>
              </div>
            </div>
            <div className="flex gap-3">
               <button 
                onClick={shareOnWhatsapp}
                className="text-gray-400 hover:text-green-600 transition-colors flex items-center gap-1 hover:bg-green-50 px-2 py-1 rounded-full"
              >
                <Share2 size={14} />
                <span className="hidden md:inline font-bold">שתף</span>
              </button>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid Layout - Mobile Optimized
  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 border border-gray-100 flex flex-col h-full group relative">
      {/* כפתור מחיקה למנהל בלבד בגריד */}
      {user?.role === 'admin' && (
        <button 
          onClick={handleDelete}
          className="absolute top-4 left-4 z-30 bg-red-600 text-white p-2 rounded-full shadow-xl hover:bg-red-800 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      )}

      <Link to={`/article/${postId}`} className="relative aspect-video md:aspect-[16/10] overflow-hidden block">
        <img 
          src={post.imageUrl || '/assets/logo.png'} 
          alt={post.title} 
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          onError={(e) => { e.currentTarget.src = '/assets/logo.png'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Category Tag */}
        <span className={`absolute top-4 right-4 ${categoryColor} text-white text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-lg shadow-lg font-bold backdrop-blur-sm`}>
          {post.category}
        </span>
      </Link>
      
      <div className="p-6 flex flex-col flex-1 relative">
        <div className="flex items-center text-xs text-gray-400 mb-3 gap-2 font-medium">
          <Clock size={12} />
          <span>{post.date}</span>
          <span className="text-gray-300">|</span>
          <Eye size={12} />
          <span>{post.views}</span>
        </div>
        
        <Link to={`/article/${postId}`} className="block mb-3">
          <h3 className="font-bold text-lg md:text-xl leading-tight text-gray-900 group-hover:text-red-700 transition-colors">
            {post.title}
          </h3>
        </Link>
        
        <p className="text-sm text-gray-500 line-clamp-3 mb-5 flex-1 font-normal leading-relaxed">
          {post.excerpt}
        </p>
        
        <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
           <button 
             onClick={handleReadMore}
             disabled={isLoading}
             className="text-red-700 text-sm font-bold hover:underline flex items-center gap-1 group-hover:gap-2 transition-all disabled:opacity-70 disabled:no-underline"
           >
             {isLoading ? (
               <>
                 טוען <Loader2 size={14} className="animate-spin" />
               </>
             ) : (
               <>
                 קרא עוד <ChevronLeft size={14} />
               </>
             )}
           </button>
           <button 
              onClick={shareOnWhatsapp}
              className="text-gray-400 hover:text-white hover:bg-green-500 transition-all p-2 rounded-full shadow-sm hover:shadow-green-200"
              title="שתף בוואצאפ"
            >
              <Share2 size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};