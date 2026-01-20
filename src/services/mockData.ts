import { Post, Category, Ad, Comment, User, ContactMessage, NewsletterSubscriber } from '../types';

export const INITIAL_POSTS: Post[] = [
  // Weather
  {
    id: '1',
    title: 'שלג ראשון בצפת: העירייה נערכת לחסימת צירים',
    excerpt: 'המערכת החורפית מגיעה לשיאה הלילה. מפלסות השלג כבר בכוננות, והלימודים מחר יתחילו בשעה 10:00.',
    content: `<p>העיר צפת מתכסה בלבן? על פי התחזית העדכנית, צפוי שלג קל החל משעות הערב.</p>`,
    category: Category.WEATHER,
    author: 'מערכת צפת בתנופה',
    date: '2023-10-24',
    imageUrl: 'https://picsum.photos/id/606/800/600',
    tags: ['שלג', 'חורף', 'עירייה'],
    isFeatured: true,
    views: 1250,
    shortLinkCode: '000101'
  },
  {
    id: 'w2',
    title: 'תחזית שבועית: התחממות קלה לקראת הסופ"ש',
    excerpt: 'אחרי הסערה הגדולה, השמש חוזרת. כל הפרטים על מזג האוויר בימים הקרובים.',
    content: '<p>הטמפרטורות יעלו במקצת...</p>',
    category: Category.WEATHER,
    author: 'דני רופ',
    date: '2023-10-25',
    imageUrl: 'https://picsum.photos/id/10/800/600',
    tags: ['שמש', 'תחזית'],
    isFeatured: false,
    views: 400,
    shortLinkCode: '000109'
  },
  {
    id: 'w3',
    title: 'הכנרת עולה: 2 ס"מ נוספו הלילה',
    excerpt: 'הגשמים העזים בצפון נותנים אותותיהם במפלס האגם הלאומי.',
    content: '<p>חדשות טובות למשק המים...</p>',
    category: Category.WEATHER,
    author: 'כתבנו בצפון',
    date: '2023-10-23',
    imageUrl: 'https://picsum.photos/id/1043/800/600',
    tags: ['כנרת', 'מים'],
    isFeatured: false,
    views: 600,
    shortLinkCode: '000110'
  },
  {
    id: '2',
    title: 'פסטיבל הכלייזמרים חוזר: עשרות אלפי מבקרים צפויים',
    excerpt: 'הפסטיבל הבינלאומי חוזר לסמטאות העיר העתיקה עם מיטב האמנים מהארץ ומהעולם.',
    content: `<p>המסורת נמשכת. פסטיבל הכלייזמרים...</p>`,
    category: Category.CULTURE,
    author: 'דנה כהן',
    date: '2023-10-23',
    imageUrl: 'https://picsum.photos/id/452/800/600',
    tags: ['תרבות', 'פסטיבל'],
    isFeatured: true,
    views: 980,
    shortLinkCode: '000102'
  },
  {
    id: '5',
    title: 'בחירות מקומיות: סקירת המועמדים המובילים',
    excerpt: 'חודש לבחירות, והמרוץ לראשות העיר מתחמם. פאנל מיוחד.',
    content: `<p>מערכת הבחירות נכנסת לישורת האחרונה...</p>`,
    category: Category.POLITICS,
    author: 'פוליטי מדיני',
    date: '2023-10-20',
    imageUrl: 'https://picsum.photos/id/403/800/600',
    tags: ['בחירות', 'פוליטיקה'],
    isFeatured: true,
    views: 3200,
    shortLinkCode: '000105'
  },
  {
    id: '3',
    title: 'אושרה תוכנית המתאר החדשה לשכונת דרום',
    excerpt: '500 יחידות דיור חדשות, פארק רחב ידיים ומרכז מסחרי.',
    content: `<p>בשורה לזוגות הצעירים...</p>`,
    category: Category.INFRASTRUCTURE,
    author: 'יוסי לוי',
    date: '2023-10-22',
    imageUrl: 'https://picsum.photos/id/122/800/600',
    tags: ['נדלן', 'בניה'],
    isFeatured: false,
    views: 450,
    shortLinkCode: '000103'
  },
  {
    id: '4',
    title: 'תרגיל חירום רחב היקף בגליל העליון',
    excerpt: 'כוחות הביטחון וההצלה יקיימו מחר תרגיל המדמה נפילת טילים.',
    content: `<p>החל משעות הבוקר יורגש עומס תנועה...</p>`,
    category: Category.SECURITY,
    author: 'כתב צבאי',
    date: '2023-10-24',
    imageUrl: 'https://picsum.photos/id/905/800/600',
    tags: ['ביטחון', 'צהל'],
    isFeatured: false,
    views: 2100,
    shortLinkCode: '000104'
  },
  {
    id: 'cm1',
    title: 'מתנדבים למען הקשישים בחורף',
    excerpt: 'פרויקט "חמם ליבם" יוצא לדרך. בואו להתנדב ולסייע.',
    content: '<p>ערבות הדדית...</p>',
    category: Category.COMMUNITY,
    author: 'רווחה',
    date: '2023-10-26',
    imageUrl: 'https://picsum.photos/id/270/800/600',
    tags: ['התנדבות', 'רווחה'],
    isFeatured: true,
    views: 450,
    shortLinkCode: '000134'
  }
];

export const INITIAL_ADS: Ad[] = [
  {
    id: 'ad1',
    title: 'מבצע רכב',
    area: 'sidebar',
    isActive: true,
    slides: [
      {
        id: 's1',
        imageUrl: 'https://picsum.photos/id/111/300/250',
        linkUrl: '#'
      }
    ]
  },
  {
    id: 'ad_video',
    title: 'פרסומת וידאו',
    area: 'sidebar_video',
    isActive: true,
    slides: [
      {
        id: 'sv1',
        imageUrl: 'https://picsum.photos/id/444/300/250', // Fallback
        videoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        linkUrl: '#'
      }
    ]
  },
  {
    id: 'ad2',
    title: 'נדלן צפת',
    area: 'leaderboard',
    isActive: true,
    slides: [
      {
        id: 's2',
        imageUrl: 'https://picsum.photos/id/222/1200/200',
        linkUrl: '#'
      },
      {
        id: 's3',
        imageUrl: 'https://picsum.photos/id/234/1200/200',
        linkUrl: '#'
      }
    ]
  },
  {
    id: 'ad3',
    title: 'באנר אמצע דף',
    area: 'homepage_mid',
    isActive: true,
    slides: [
      {
        id: 's4',
        imageUrl: 'https://picsum.photos/id/555/1200/300',
        linkUrl: '#'
      },
       {
        id: 's5',
        imageUrl: 'https://picsum.photos/id/666/1200/300',
        linkUrl: '#'
      }
    ]
  }
];

export const INITIAL_COMMENTS: Comment[] = [
  {
    id: 'c1',
    postId: '1',
    userId: 'u2',
    userName: 'דוד כהן',
    content: 'כל הכבוד לעירייה על ההיערכות המוקדמת!',
    date: '2023-10-24 10:30',
    likes: 5,
    likedBy: []
  },
  {
    id: 'c2',
    postId: '1',
    userId: 'u3',
    userName: 'שרה לוי',
    content: 'מקווה שלא יחסמו את הכניסה לעיר, אני צריכה להגיע לעבודה.',
    date: '2023-10-24 11:15',
    likes: 2,
    likedBy: []
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u2',
    name: 'דוד כהן',
    email: 'david@example.com',
    password: 'password123',
    role: 'user',
    isAuthenticated: false,
    joinedDate: '2023-09-15'
  },
  {
    id: 'u3',
    name: 'שרה לוי',
    email: 'sara@example.com',
    password: 'password123',
    role: 'user',
    isAuthenticated: false,
    joinedDate: '2023-10-01'
  }
];

export const INITIAL_MESSAGES: ContactMessage[] = [
    {
        id: 'm1',
        name: 'ישראל ישראלי',
        email: 'israel@test.com',
        phone: '050-1234567',
        subject: 'הצעה לכתבה',
        message: 'שלום, יש לי סיפור מעניין על...',
        date: '2023-10-20 10:00',
        read: false
    }
];

export const INITIAL_SUBSCRIBERS: NewsletterSubscriber[] = [
    {
        id: 's1',
        email: 'subscriber1@example.com',
        joinedDate: '2023-10-01',
        isActive: true
    }
];