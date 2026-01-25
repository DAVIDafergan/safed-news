const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const helmet = require('helmet'); 
const rateLimit = require('express-rate-limit'); 
const fs = require('fs'); // ייבוא ספריית מערכת הקבצים להזרקת מטא-דאטה
require('dotenv').config();

const app = express();

// --- 1. הגדרות ליבה ואבטחה ---
app.set('trust proxy', 1); 

app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false,
}));

app.use(cors());
// הגדלת נפח הקבצים המותר להעלאה עבור באנרים כבדים
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 500, 
    message: { msg: 'יותר מדי בקשות, נא לנסות שוב בעוד כמה דקות' }
});
app.use('/api/', limiter);

// --- 2. חיבור למסד הנתונים ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ מחובר למנגו אטלס - המערכת מוכנה'))
    .catch(err => {
        console.error('❌ שגיאת חיבור למנגו:', err);
        process.exit(1);
    });

// --- 3. תבניות נתונים (Models) ---

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, default: 'user', enum: ['user', 'admin', 'editor'] },
    joinedDate: { type: String, default: () => new Date().toLocaleDateString('he-IL') }
});
const User = mongoose.model('User', UserSchema);

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, index: true },
    imageUrl: String,
    imageCredit: String,
    excerpt: String,
    author: String,
    tags: [String],
    isFeatured: { type: Boolean, default: false }, // שדה קריטי עבור הסליידר הראשי
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shortLinkCode: { type: String, unique: true }, // שדה לקוד לינק קצר
    date: { type: String, default: () => new Date().toLocaleDateString('he-IL') }
});
const Post = mongoose.model('Post', PostSchema);

const Ad = mongoose.model('Ad', new mongoose.Schema({
    area: String, title: String, isActive: { type: Boolean, default: true },
    slides: [{ imageUrl: String, linkUrl: String, videoUrl: String }]
}));

const Alert = mongoose.model('Alert', new mongoose.Schema({
    content: { type: String, required: true },
    active: { type: Boolean, default: true },
    title: String, 
    date: { type: String, default: () => new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }) }
}));

const ContactMessage = mongoose.model('ContactMessage', new mongoose.Schema({
    name: String, email: String, phone: String, subject: String, message: String,
    date: { type: String, default: () => new Date().toLocaleString('he-IL') },
    read: { type: Boolean, default: false }
}));

const SubscriberSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    date: { type: String, default: () => new Date().toLocaleDateString('he-IL') }
});
const Subscriber = mongoose.model('Subscriber', SubscriberSchema);

// מודל חדש לתגובות
const CommentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    userId: String,
    userName: { type: String, required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: [String],
    date: { type: String, default: () => new Date().toLocaleString('he-IL') }
});
const Comment = mongoose.model('Comment', CommentSchema);

// --- 4. Middleware לאימות והרשאות ---

const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'גישה נדחתה, חסר טוקן' });

    try {
        if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing");
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'הטוקן אינו תקין' });
    }
};

const adminMiddleware = (req, res, next) => {
    if (req.user && (req.user.role === 'admin' || req.user.role === 'editor')) {
        next();
    } else {
        res.status(403).json({ msg: 'גישה נדחתה: נדרשות הרשאות מנהל' });
    }
};

// --- 5. נתיבי API (Routes) ---

// --- פוסטים וכתבות ---
app.get('/api/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        const featured = req.query.featured; 
        
        let query = {};
        if (category) query.category = category;
        if (featured) query.isFeatured = (featured === 'true');

        const posts = await Post.find(query).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit);
        const total = await Post.countDocuments(query);
        res.json({ posts, totalPages: Math.ceil(total / limit), currentPage: page });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// יצירת פוסט - עם תיקון ל-ID ויצירת shortLinkCode אוטומטית
app.post('/api/posts', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        console.log("📥 נתונים שהתקבלו ליצירת פוסט:", req.body);
        
        if (!req.body.title || !req.body.content) {
            console.log("❌ חסרים שדות חובה: title או content");
            return res.status(400).json({ msg: "נא למלא כותרת ותוכן" });
        }

        const { id, _id, ...cleanData } = req.body;

        // יצירת קוד ייחודי לשיתוף אם לא נשלח מה-Frontend
        if (!cleanData.shortLinkCode) {
            cleanData.shortLinkCode = Math.floor(100000 + Math.random() * 900000).toString();
        }

        const newPost = new Post({
            ...cleanData,
            isFeatured: req.body.isFeatured === true || req.body.isFeatured === 'true',
            date: new Date().toLocaleDateString('he-IL')
        });

        const savedPost = await newPost.save();
        console.log("✅ הפוסט נשמר בהצלחה:", savedPost._id);
        res.json(savedPost);
    } catch (err) { 
        console.error("🔥 שגיאה קריטית בשמירת פוסט:", err);
        res.status(500).json({ 
            error: "שגיאת שרת פנימית", 
            message: err.message
        }); 
    }
});

app.patch('/api/posts/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const updatedPost = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedPost);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/posts/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- תגובות (Comments) ---
app.get('/api/comments', async (req, res) => {
    try {
        const comments = await Comment.find().sort({ _id: -1 });
        res.json(comments);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/comments', async (req, res) => {
    try {
        const { id, _id, ...cleanData } = req.body;
        const newComment = new Comment(cleanData);
        await newComment.save();
        res.json(newComment);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/comments/:id/like', authMiddleware, async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ msg: 'התגובה לא נמצאה' });

        const userId = req.user.id;
        const index = comment.likedBy.indexOf(userId);

        if (index === -1) {
            comment.likedBy.push(userId);
            comment.likes += 1;
        } else {
            comment.likedBy.splice(index, 1);
            comment.likes -= 1;
        }

        await comment.save();
        res.json(comment);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- מבזקים (Alerts) ---
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await Alert.find({ active: true }).sort({ _id: -1 });
        res.json(alerts);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/alerts', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const { id, _id, ...cleanData } = req.body;
        const newAlert = new Alert(cleanData);
        await newAlert.save();
        res.json(newAlert);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/alerts/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        await Alert.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- אימות ומשתמשים ---
app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing in environment");
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) return res.status(400).json({ msg: 'המשתמש כבר קיים' });

        user = new User({ email, password, name });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = { user: { id: user.id, role: user.role } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) { 
        console.error("❌ שגיאת רישום:", err.message);
        res.status(500).json({ error: 'שגיאת שרת ברישום', details: err.message }); 
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is missing in environment");
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ msg: 'פרטים שגויים' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'פרטים שגויים' });

        const payload = { user: { id: user.id, role: user.role } };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
    } catch (err) { 
        console.error("❌ שגיאת התחברות:", err.message);
        res.status(500).json({ error: 'שגיאת שרת בהתחברות', details: err.message }); 
    }
});

app.get('/api/users', authMiddleware, async (req, res) => { res.json(await User.find().select('-password')); });

// --- פרסומות (Ads) ---
app.get('/api/ads', async (req, res) => res.json(await Ad.find({ isActive: true })));

app.post('/api/ads', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const { id, _id, ...cleanData } = req.body;
        const newAd = new Ad(cleanData);
        const savedAd = await newAd.save();
        res.json(savedAd);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// נתיב לעדכון פרסומת (למשל הוספת שקופיות)
app.patch('/api/ads/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const updatedAd = await Ad.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updatedAd);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// נתיב למחיקת פרסומת
app.delete('/api/ads/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        await Ad.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- ניוזלטר והודעות מהאתר ---
app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        const existing = await Subscriber.findOne({ email });
        if (existing) return res.status(400).json({ msg: 'כבר רשום לניוזלטר' });
        await new Subscriber({ email }).save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/contact', authMiddleware, async (req, res) => res.json(await ContactMessage.find().sort({ _id: -1 })));
app.post('/api/contact', async (req, res) => res.json(await new ContactMessage(req.body).save()));

// נתיב למחיקת הודעת קשר (לניהול הודעות)
app.delete('/api/contact/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        await ContactMessage.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 6. הגדרות שיתוף דינמיות (Metadata Injection) ---

const serveWithMeta = async (req, res, searchField, searchValue) => {
    try {
        const query = {};
        query[searchField] = searchValue;
        const post = await Post.findOne(query);
        const indexPath = path.resolve(__dirname, 'dist', 'index.html');
        let htmlData = fs.readFileSync(indexPath, 'utf8');

        if (post) {
            // הזרקת נתוני הפוסט לתגיות המטא של ה-HTML
            htmlData = htmlData
                .replace(/<title>.*?<\/title>/g, `<title>${post.title} | צפת בתנופה</title>`)
                .replace(/property="og:title" content=".*?"/g, `property="og:title" content="${post.title}"`)
                .replace(/property="og:description" content=".*?"/g, `property="og:description" content="${post.excerpt || 'לחצו לקריאת הכתבה המלאה'}"`)
                .replace(/property="og:image" content=".*?"/g, `property="og:image" content="${post.imageUrl || 'https://zfatbt.com/logo.png'}"`)
                .replace(/property="og:url" content=".*?"/g, `property="og:url" content="https://zfatbt.com/article/${post._id}"`);
        }
        res.send(htmlData);
    } catch (err) {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
};

// נתיב הלינק הקצר (למשל: /p/123456)
app.get('/p/:shortCode', (req, res) => serveWithMeta(req, res, 'shortLinkCode', req.params.shortCode));

// נתיב הכתבה המלא (למשל: /article/ID)
app.get('/article/:id', (req, res) => serveWithMeta(req, res, '_id', req.params.id));

// --- 7. הגשת האתר (Frontend) ---
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
    if (req.path.includes('.')) return res.status(404).send('Resource not found');
    res.sendFile(path.join(distPath, 'index.html'));
});

// --- 8. הרצת השרת ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => { 
    console.log(`🚀 שרת "צפת בתנופה" באוויר בפורט ${PORT}`); 
});