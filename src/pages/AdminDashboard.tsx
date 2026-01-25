import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Category, Post, Ad, AdSlide } from '../types';
import { useNavigate } from 'react-router-dom';
import { Plus, Layout, LogOut, Image as ImageIcon, Link as LinkIcon, Users, Mail, Trash2, Edit2, GripVertical, Check, X as XIcon, Save, Video, Bell, Upload, Camera, RefreshCw } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user, logout, addPost, deletePost, ads, updateAd, registeredUsers, contactMessages, posts } = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'posts' | 'ads' | 'users' | 'messages' | 'alerts'>('posts');

  // --- הודעות (בעיה 1 - סנכרון מול השרת) ---
  const [localMessages, setLocalMessages] = useState(contactMessages);
  
  const fetchMessages = async () => {
      try {
          const token = localStorage.getItem('x-auth-token');
          const res = await fetch('/api/contact', {
              headers: { 'x-auth-token': token || '' }
          });
          const data = await res.json();
          setLocalMessages(data);
      } catch (err) {
          console.error("שגיאה בטעינת הודעות:", err);
      }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
        fetchMessages();
    }
  }, [activeTab]); 

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm('למחוק את ההודעה לצמיתות?')) return;
    try {
        const token = localStorage.getItem('x-auth-token');
        await fetch(`/api/contact/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token || '' }
        });
        fetchMessages(); // רענון הרשימה לאחר מחיקה
    } catch (err) { console.error(err); }
  };

  // New Post Form State
  const [newPost, setNewPost] = useState<Partial<Post>>({
    title: '',
    category: Category.NEWS,
    excerpt: '',
    content: '',
    imageUrl: '',
    imageCredit: '',
    tags: [],
    isFeatured: false,
  });
  const [tagsInput, setTagsInput] = useState('');

  // Flash News State
  const [flashContent, setFlashContent] = useState('');

  // Ad Management State
  const [isCreatingAd, setIsCreatingAd] = useState(false);
  const [newAdData, setNewAdData] = useState({ title: '', area: 'sidebar' });
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [editingSlides, setEditingSlides] = useState<AdSlide[]>([]);
  const [draggedSlideIndex, setDraggedSlideIndex] = useState<number | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title || !newPost.content) return;

    const post: Post = {
      id: Date.now().toString(),
      title: newPost.title!,
      excerpt: newPost.excerpt || '',
      content: newPost.content!,
      category: newPost.category as Category,
      author: user?.name || 'Admin',
      date: new Date().toISOString().split('T')[0],
      imageUrl: newPost.imageUrl || 'https://picsum.photos/800/600',
      imageCredit: newPost.imageCredit || 'רשתות חברתיות',
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      isFeatured: newPost.isFeatured || false,
      views: 0,
      shortLinkCode: Math.floor(100000 + Math.random() * 900000).toString()
    };

    addPost(post);
    alert('הכתבה פורסמה בהצלחה!');
    
    setNewPost({
      title: '',
      category: Category.NEWS,
      excerpt: '',
      content: '',
      imageUrl: '',
      imageCredit: '',
      tags: [],
      isFeatured: false,
    });
    setTagsInput('');
  };

  const handleFlashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!flashContent.trim()) return;

    const flashPost: Post = {
        id: `flash-${Date.now()}`,
        title: flashContent,
        excerpt: '',
        content: '<p>מבזק חדשות</p>',
        category: Category.NEWS,
        author: 'מבזקים',
        date: new Date().toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'}),
        imageUrl: '',
        tags: [],
        isFeatured: false,
        views: 0,
        shortLinkCode: ''
    };
    
    addPost(flashPost);
    setFlashContent('');
    alert('המבזק נוסף!');
  };

  const handleDeleteFlash = (e: React.MouseEvent, post: any) => {
    e.preventDefault();
    e.stopPropagation(); 
    
    const idToDelete = post._id || post.id;
    if(window.confirm('למחוק את המבזק?')) {
       deletePost(idToDelete);
    }
  };

  const flashPosts = posts.filter(p => p.category === Category.NEWS);

  // --- פונקציות ניהול באנרים (מעודכן לשרת) ---
  const handleCreateAd = async () => {
    if (!newAdData.title) return alert('נא להזין שם לקמפיין');
    
    const newAd = {
      title: newAdData.title,
      area: newAdData.area,
      isActive: true,
      slides: [{ id: Date.now().toString(), imageUrl: 'https://via.placeholder.com/1200x200', linkUrl: '' }]
    };

    try {
      const token = localStorage.getItem('x-auth-token');
      const res = await fetch('/api/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify(newAd)
      });
      if (res.ok) {
        alert('באנר חדש נוצר בהצלחה!');
        setIsCreatingAd(false);
        window.location.reload(); 
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteAd = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק את כל שטח הפרסום הזה?')) return;
    try {
        const token = localStorage.getItem('x-auth-token');
        const res = await fetch(`/api/ads/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token || '' }
        });
        if (res.ok) {
            alert('הבאנר נמחק בהצלחה');
            window.location.reload();
        }
    } catch (err) { console.error(err); }
  };

  const startEditingAd = (ad: Ad) => {
    setEditingAdId(ad.id || (ad as any)._id);
    setEditingSlides([...ad.slides]); 
    setTimeout(() => {
        document.getElementById('ad-editor')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const cancelEditingAd = () => {
    setEditingAdId(null);
    setEditingSlides([]);
  };

  const saveAdChanges = async () => {
    if (editingAdId) {
      try {
          const token = localStorage.getItem('x-auth-token');
          const response = await fetch(`/api/ads/${editingAdId}`, {
              method: 'PATCH',
              headers: {
                  'Content-Type': 'application/json',
                  'x-auth-token': token || ''
              },
              body: JSON.stringify({ slides: editingSlides })
          });
          
          if (response.ok) {
              updateAd(editingAdId, { slides: editingSlides });
              setEditingAdId(null);
              setEditingSlides([]);
              alert('השינויים נשמרו בהצלחה ויופיעו באתר!');
          }
      } catch (err) {
          console.error(err);
          alert('שגיאה בשמירה לשרת');
      }
    }
  };

  const addSlide = () => {
    const newSlide: AdSlide = {
      id: Date.now().toString(),
      imageUrl: 'https://via.placeholder.com/800x200',
      linkUrl: '', 
      videoUrl: ''
    };
    setEditingSlides([...editingSlides, newSlide]);
  };

  const removeSlide = (index: number) => {
    const newSlides = [...editingSlides];
    newSlides.splice(index, 1);
    setEditingSlides(newSlides);
  };

  const updateSlide = (index: number, field: keyof AdSlide, value: string) => {
    const newSlides = [...editingSlides];
    newSlides[index] = { ...newSlides[index], [field]: value };
    setEditingSlides(newSlides);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSlideIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSlideIndex === null || draggedSlideIndex === targetIndex) return;

    const newSlides = [...editingSlides];
    const [draggedItem] = newSlides.splice(draggedSlideIndex, 1);
    newSlides.splice(targetIndex, 0, draggedItem);
    
    setEditingSlides(newSlides);
    setDraggedSlideIndex(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 text-right" dir="rtl">
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">מערכת ניהול - צפת בתנופה</h1>
            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full font-medium">
              שלום, {user?.name}
            </span>
          </div>
          <button 
            onClick={handleLogout}
            className="text-gray-500 hover:text-red-600 flex items-center gap-1 text-sm font-medium"
          >
            <LogOut size={16} /> יציאה
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 mb-8">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition ${activeTab === 'posts' ? 'bg-red-700 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <Plus size={18} /> הוספת כתבה
          </button>
          
           <button
            onClick={() => setActiveTab('alerts')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition ${activeTab === 'alerts' ? 'bg-red-700 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <Bell size={18} /> ניהול מבזקים
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition ${activeTab === 'ads' ? 'bg-red-700 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <Layout size={18} /> ניהול באנרים
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition ${activeTab === 'users' ? 'bg-red-700 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <Users size={18} /> משתמשים רשומים
          </button>
           <button
            onClick={() => setActiveTab('messages')}
            className={`px-6 py-3 rounded-lg font-bold flex items-center gap-2 transition ${activeTab === 'messages' ? 'bg-red-700 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            <Mail size={18} /> הודעות נכנסות
          </button>
        </div>

        {/* --- ALERTS TAB CONTENT --- */}
        {activeTab === 'alerts' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-fade-in h-fit">
                    <h2 className="text-2xl font-bold mb-6 text-red-700 flex items-center gap-2">
                        <Bell size={24} /> פרסום מבזק חדש
                    </h2>
                    <p className="text-gray-500 mb-6">
                        המבזק יופיע מיידית בפס הנגלל (Ticker) בראש האתר.
                    </p>
                    <form onSubmit={handleFlashSubmit}>
                        <label className="block text-sm font-bold text-gray-700 mb-2">תוכן המבזק</label>
                        <textarea
                            value={flashContent}
                            onChange={(e) => setFlashContent(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none h-32 resize-none text-lg"
                            placeholder="לדוגמה: שלג החל לרדת בצפת, הלימודים יתקיימו כסדרם..."
                            required
                        />
                        <button
                            type="submit"
                            className="w-full mt-4 bg-red-700 text-white font-bold py-3 rounded-lg hover:bg-red-800 transition shadow-lg flex items-center justify-center gap-2"
                        >
                            <Check size={20} /> פרסם מבזק
                        </button>
                    </form>
                  </div>

                  <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">מבזקים פעילים ({flashPosts.length})</h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar">
                        {flashPosts.length > 0 ? (
                            flashPosts.map(post => (
                                <div key={post.id || (post as any)._id} className="flex justify-between items-start bg-gray-50 p-4 rounded-lg border border-gray-100 hover:bg-gray-100 transition">
                                    <div>
                                        <p className="font-bold text-gray-900 mb-1">{post.title}</p>
                                        <span className="text-xs text-gray-500">{post.date}</span>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={(e) => handleDeleteFlash(e, post)}
                                        className="bg-white text-gray-400 hover:text-red-600 hover:bg-red-50 border border-gray-200 p-2 rounded-lg transition shadow-sm mr-2 cursor-pointer z-10"
                                        title="מחק מבזק"
                                    >
                                        <Trash2 size={18} className="pointer-events-none" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-10 text-gray-400">
                                אין מבזקים פעילים כרגע.
                            </div>
                        )}
                    </div>
                  </div>
              </div>
        )}

        {activeTab === 'posts' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">יצירת כתבה חדשה</h2>
            <form onSubmit={handlePostSubmit} className="space-y-6 max-w-4xl">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">כותרת הכתבה</label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 outline-none"
                    placeholder="הכנס כותרת ראשית..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">קטגוריה</label>
                  <select
                    value={newPost.category}
                    onChange={(e) => setNewPost({...newPost, category: e.target.value as Category})}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 outline-none"
                  >
                    {Object.values(Category).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">תקציר (Excerpt)</label>
                <textarea
                  value={newPost.excerpt}
                  onChange={(e) => setNewPost({...newPost, excerpt: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 outline-none h-20 resize-none"
                  placeholder="תקציר שיופיע בכרטיס הכתבה..."
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">תוכן הכתבה (HTML)</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 outline-none h-64 font-mono text-sm"
                  placeholder="<p>תוכן הכתבה...</p>"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">תמונה ראשית</label>
                    <div className="flex flex-col gap-2">
                         <div className="relative">
                            <ImageIcon size={18} className="absolute top-2.5 right-3 text-gray-400" />
                            <input
                                type="text"
                                value={newPost.imageUrl}
                                onChange={(e) => setNewPost({...newPost, imageUrl: e.target.value})}
                                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="הדבק קישור או העלה קובץ..."
                            />
                        </div>
                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 border border-gray-200 border-dashed">
                           <Upload size={16} />
                           <span>בחר תמונה מהמחשב</span>
                           <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden"
                              onChange={(e) => handleImageUpload(e, (url) => setNewPost({...newPost, imageUrl: url}))}
                           />
                        </label>
                        {newPost.imageUrl && (
                          <div className="mt-2 h-32 bg-gray-50 rounded border border-gray-200 overflow-hidden">
                            <img src={newPost.imageUrl} alt="preview" className="w-full h-full object-contain" />
                          </div>
                        )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">קרדיט צילום</label>
                        <div className="relative">
                             <Camera size={18} className="absolute top-2.5 right-3 text-gray-400" />
                             <input
                                type="text"
                                value={newPost.imageCredit || ''}
                                onChange={(e) => setNewPost({...newPost, imageCredit: e.target.value})}
                                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="לדוגמה: דוברות העירייה / פלוני אלמוני"
                            />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">תגיות (מופרדות בפסיק)</label>
                        <input
                            type="text"
                            value={tagsInput}
                            onChange={(e) => setTagsInput(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 outline-none"
                            placeholder="צפת, שלג, עירייה..."
                        />
                      </div>
                  </div>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-lg">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={newPost.isFeatured}
                  onChange={(e) => setNewPost({...newPost, isFeatured: e.target.checked})}
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
                <label htmlFor="isFeatured" className="font-bold text-gray-700 cursor-pointer">
                  הצג בסליידר הראשי (כתבה מובילה)
                </label>
              </div>

              <button
                type="submit"
                className="bg-red-700 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-800 transition shadow-lg flex items-center gap-2"
              >
                <Save size={20} /> פרסם כתבה
              </button>
            </form>
          </div>
        )}

        {/* --- ADS MANAGER TAB (FIXED AREAS) --- */}
        {activeTab === 'ads' && (
          <div className="space-y-8 animate-fade-in">
             <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                 <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">ניהול באנרים ופרסומות</h2>
                    <p className="text-sm text-gray-500 mt-1">בחר שטח פרסום קיים לעדכון התמונות, הסרטונים והקישורים שלו.</p>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ads.map(ad => (
                        <div key={ad.id || (ad as any)._id} className="bg-gray-50 p-6 rounded-xl border border-gray-200 hover:shadow-md transition relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-lg text-gray-900">{ad.title}</h3>
                                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-0.5 rounded uppercase">{ad.area}</span>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${ad.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                            </div>
                            
                            <div className="aspect-video bg-gray-200 rounded-lg mb-4 overflow-hidden relative">
                                {ad.slides.length > 0 && (
                                    <img src={ad.slides[0].imageUrl} alt="preview" className="w-full h-full object-cover opacity-70" />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white font-bold text-sm">
                                    {ad.slides.length} תמונות/סרטונים
                                </div>
                            </div>

                            <button 
                                onClick={() => startEditingAd(ad)}
                                className="w-full bg-white border border-gray-300 text-gray-700 font-bold py-2 rounded-lg hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition flex items-center justify-center gap-2"
                            >
                                <Edit2 size={16} /> ערוך קמפיין / נהל שקופיות
                            </button>
                        </div>
                    ))}
                 </div>
             </div>

             {/* Ad Editor Section */}
             {editingAdId && (
                 <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-red-100 animate-fade-in scroll-mt-20" id="ad-editor">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <h3 className="text-2xl font-bold text-gray-900">עריכת קמפיין: {ads.find(a => (a.id === editingAdId || (a as any)._id === editingAdId))?.title}</h3>
                        <div className="flex gap-3">
                            <button onClick={addSlide} className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-lg font-bold transition">
                                <Plus size={16} /> הוסף תמונה/סרטון
                            </button>
                            <button onClick={saveAdChanges} className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition shadow-md">
                                <Save size={16} /> שמור שינויים באתר
                            </button>
                            <button onClick={cancelEditingAd} className="flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 px-4 py-2 rounded-lg font-bold transition">
                                <XIcon size={16} /> ביטול
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {editingSlides.map((slide, index) => (
                            <div 
                                key={slide.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDrop={(e) => handleDrop(e, index)}
                                className={`flex flex-col md:flex-row gap-6 items-start p-6 bg-gray-50 rounded-xl border border-gray-200 transition-all ${draggedSlideIndex === index ? 'opacity-50 ring-2 ring-red-300' : 'hover:border-red-200'}`}
                            >
                                <div className="cursor-grab text-gray-400 hover:text-gray-600 hidden md:block mt-8">
                                    <GripVertical size={24} />
                                </div>
                                
                                <div className="w-full md:w-32 h-24 bg-gray-200 rounded-lg overflow-hidden shrink-0 border border-gray-300">
                                    {slide.videoUrl ? (
                                        <video src={slide.videoUrl} className="w-full h-full object-cover" autoPlay muted loop />
                                    ) : (
                                        <img src={slide.imageUrl} alt="preview" className="w-full h-full object-cover" />
                                    )}
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">תמונה (קישור או העלאה)</label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <ImageIcon size={14} className="absolute top-3 right-3 text-gray-400" />
                                                <input 
                                                    type="text" 
                                                    value={slide.imageUrl}
                                                    onChange={(e) => updateSlide(index, 'imageUrl', e.target.value)}
                                                    className="w-full pl-3 pr-9 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none"
                                                />
                                            </div>
                                             <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 px-3 py-2 rounded flex items-center justify-center transition" title="העלה תמונה">
                                                <Upload size={16} />
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(e, (url) => updateSlide(index, 'imageUrl', url))}
                                                />
                                            </label>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">קישור יעד (לאן השקופית תוביל?)</label>
                                        <div className="relative">
                                            <LinkIcon size={14} className="absolute top-3 right-3 text-gray-400" />
                                            <input 
                                                type="text" 
                                                value={slide.linkUrl}
                                                onChange={(e) => updateSlide(index, 'linkUrl', e.target.value)}
                                                placeholder="https://example.com"
                                                className="w-full pl-3 pr-9 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none"
                                            />
                                        </div>
                                    </div>
                                     <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">קישור לוידאו (אופציונלי - יופיע במקום תמונה)</label>
                                        <div className="relative flex gap-2">
                                            <div className="relative flex-1">
                                                <Video size={14} className="absolute top-3 right-3 text-gray-400" />
                                                <input 
                                                    type="text" 
                                                    value={slide.videoUrl || ''}
                                                    onChange={(e) => updateSlide(index, 'videoUrl', e.target.value)}
                                                    placeholder="https://...mp4"
                                                    className="w-full pl-3 pr-9 py-2 bg-white border border-gray-300 rounded text-sm focus:ring-1 focus:ring-red-500 outline-none"
                                                />
                                            </div>
                                            {slide.videoUrl && (
                                                <button onClick={() => updateSlide(index, 'videoUrl', '')} className="text-red-500 p-2 border rounded border-red-100 hover:bg-red-50">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => removeSlide(index)}
                                    className="text-red-400 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition self-center md:self-auto"
                                    title="מחק שקופית זו"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
             )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
             <h2 className="text-2xl font-bold mb-6 text-gray-800">משתמשים רשומים ({registeredUsers.length})</h2>
             <div className="overflow-x-auto">
               <table className="w-full text-right">
                 <thead>
                   <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider border-b border-gray-200">
                     <th className="py-3 px-4 font-bold">שם</th>
                     <th className="py-3 px-4 font-bold">אימייל</th>
                     <th className="py-3 px-4 font-bold">תפקיד</th>
                     <th className="py-3 px-4 font-bold">תאריך הצטרפות</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {registeredUsers.map(u => (
                     <tr key={u.id} className="hover:bg-gray-50 transition">
                       <td className="py-3 px-4 font-medium text-gray-900">{u.name}</td>
                       <td className="py-3 px-4 text-gray-600">{u.email}</td>
                       <td className="py-3 px-4">
                         <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-50 text-blue-700'}`}>
                           {u.role === 'admin' ? 'מנהל' : 'משתמש'}
                         </span>
                       </td>
                       <td className="py-3 px-4 text-gray-500 text-sm">{u.joinedDate || '-'}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 animate-fade-in">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">הודעות מהאתר ({localMessages.length})</h2>
                <button onClick={fetchMessages} className="text-red-700 flex items-center gap-1 text-sm font-bold hover:bg-red-50 p-2 rounded transition"><RefreshCw size={14}/>רענן נתונים</button>
             </div>
             <div className="space-y-4">
               {localMessages.length > 0 ? (
                 localMessages.map(msg => (
                   <div key={msg.id || (msg as any)._id} className={`p-6 rounded-xl border relative transition-all ${msg.read ? 'bg-gray-50 border-gray-200' : 'bg-white border-red-100 shadow-sm border-r-4 border-r-red-500'}`}>
                      <button 
                        onClick={() => handleDeleteMessage(msg.id || (msg as any)._id)}
                        className="absolute top-4 left-4 text-gray-300 hover:text-red-500 transition-colors"
                      >
                          <Trash2 size={18} />
                      </button>
                      <div className="flex justify-between items-start mb-3">
                         <div>
                            <h3 className="font-bold text-lg text-gray-900">{msg.subject}</h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
                               <span className="font-bold text-gray-800">{msg.name}</span>
                               <span className="hidden md:inline">&bull;</span>
                               <span>{msg.email}</span>
                               <span className="hidden md:inline">&bull;</span>
                               <span>{msg.phone || 'אין טלפון'}</span>
                            </div>
                         </div>
                         <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-100">{msg.date}</span>
                      </div>
                      <p className="text-gray-700 bg-gray-50/50 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.message}
                      </p>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-20 text-gray-400">
                   אין הודעות חדשות במערכת.
                 </div>
               )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};