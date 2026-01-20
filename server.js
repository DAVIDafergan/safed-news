const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs'); 
const jwt = require('jsonwebtoken'); 
const helmet = require('helmet'); 
const rateLimit = require('express-rate-limit'); 
require('dotenv').config();

const app = express();

// --- תיקון קריטי עבור Railway ושירותי ענן ---
// מאפשר ל-rate-limit לזהות את ה-IP האמיתי של הגולש דרך ה-Proxy של Railway
app.set('trust proxy', 1);

// --- הגדרות אבטחה ו-Middleware ---

// הגדרת Helmet מותאמת אישית - פותר את שגיאות ה-CSP (המסך הלבן)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            ...helmet.contentSecurityPolicy.getDefaultDirectives(),
            "script-src": ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com"], // מאפשר Tailwind CDN וסקריפטים פנימיים של React
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "img-src": ["'self'", "data:", "https:", "http:"], // מאפשר טעינת תמונות מכל מקור בטוח
        },
    },
    crossOriginEmbedderPolicy: false, // פותר בעיות טעינת תמונות חיצוניות ב-Chrome
}));

app.use(cors());
app.use(express.json());

// הגבלת בקשות (Rate Limiting) כדי למנוע ספאם והתקפות DDOS
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 דקות
    max: 100, // מקסימום 100 בקשות לכל כתובת IP
    message: { msg: 'יותר מדי בקשות מה-IP הזה, נא לנסות שוב מאוחר יותר' }
});
app.use('/api/', limiter);

// --- 1. חיבור למסד הנתונים ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ מחובר ל-MongoDB - המערכת מוכנה לעבודה'))
    .catch(err => {
        console.error('❌ שגיאת חיבור ל-MongoDB:', err);
        process.exit(1);
    });

// --- Middleware לאימות מנהלים ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'אין הרשאה, חסר טוקן' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'הטוקן אינו תקין' });
    }
};

// --- 2. תבניות נתונים (Models) ---

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, index: true },
    imageUrl: String,
    excerpt: String,
    author: String,
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    date: { type: Date, default: Date.now, index: true }
});
const Post = mongoose.model('Post', PostSchema);

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, default: 'user', enum: ['user', 'admin', 'editor'] },
    joinedDate: { type: Date, default: Date.now }
});
const User = mongoose.model('User', UserSchema);

const Ad = mongoose.model('Ad', new mongoose.Schema({
    area: String, title: String, isActive: { type: Boolean, default: true },
    slides: [{ imageUrl: String, linkUrl: String, videoUrl: String }]
}));

const Alert = mongoose.model('Alert', new mongoose.Schema({
    content: String, active: { type: Boolean, default: true },
    title: String, date: { type: Date, default: Date.now }
}));

const ContactMessage = mongoose.model('ContactMessage', new mongoose.Schema({
    name: String, email: String, phone: String, subject: String, message: String,
    date: { type: Date, default: Date.now },
    read: { type: Boolean, default: false }
}));

// --- 3. נתיבי API ---

// כתבות עם Pagination
app.get('/api/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;

        let query = {};
        if (category) query.category = category;

        const posts = await Post.find(query)
            .sort({ date: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Post.countDocuments(query);

        res.json({
            posts,
            totalPages: Math.ceil(total / limit),
            currentPage: page
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
        if (!post) return res.status(404).json({ msg: 'הכתבה לא נמצאה' });
        res.json(post);
    } catch (err) {
        res.status(404).json({ error: "Post not found" });
    }
});

app.post('/api/posts', authMiddleware, async (req, res) => {
    try {
        const newPost = new Post(req.body);
        await newPost.save();
        res.json(newPost);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/alerts', async (req, res) => res.json(await Alert.find({ active: true }).sort({ date: -1 })));
app.post('/api/alerts', authMiddleware, async (req, res) => res.json(await new Alert(req.body).save()));
app.delete('/api/alerts/:id', authMiddleware, async (req, res) => {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// אימות משתמשים (Auth)
app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'משתמש כבר קיים' });

        user = new User({ email, password, name });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
        });
    } catch (err) {
        res.status(500).send('שגיאת שרת');
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'פרטים שגויים' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'פרטים שגויים' });

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
        });
    } catch (err) {
        res.status(500).send('שגיאת שרת');
    }
});

app.get('/api/users', authMiddleware, async (req, res) => {
    res.json(await User.find().select('-password'));
});

app.get('/api/ads', async (req, res) => res.json(await Ad.find({ isActive: true })));
app.post('/api/ads', authMiddleware, async (req, res) => res.json(await new Ad(req.body).save()));
app.post('/api/contact', async (req, res) => res.json(await new ContactMessage(req.body).save()));

// --- 4. הגשת האתר (Frontend) ---

const distPath = path.join(__dirname, 'client', 'dist');

// חשוב: הגשת קבצים סטטיים חייבת להיות לפני הניתוב הכללי (*)
app.use(express.static(distPath));

// פתרון שגיאת ה-MIME Type: מבטיח שאם קובץ לא נמצא, לא יוחזר דף HTML בטעות
app.get('*', (req, res) => {
    if (req.path.includes('.') && !req.path.startsWith('/api')) {
        return res.status(404).send('Not found');
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

// שימוש בכתובת 0.0.0.0 הכרחי בסביבות Railway להאזנה נכונה לבקשות
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => console.log(`🚀 שרת "צפת בתנופה" רץ בפורט ${PORT}`));