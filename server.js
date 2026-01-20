const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // להצפנת סיסמאות
const jwt = require('jsonwebtoken'); // ליצירת טוקנים לאימות
const helmet = require('helmet'); // כותרות אבטחה
const rateLimit = require('express-rate-limit'); // מניעת התקפות הצפה
require('dotenv').config();

const app = express();

// --- הגדרות אבטחה ו-Middleware ---
app.use(helmet()); // הגנה בסיסית
app.use(cors());
app.use(express.json());

// הגבלת בקשות (מונע התקפות DDOS וספאם)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 דקות
    max: 100 // מקסימום 100 בקשות ל-IP
});
app.use('/api/', limiter);

// --- 1. חיבור למסד הנתונים ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ מחובר ל-MongoDB - המערכת מוכנה לעבודה'))
    .catch(err => {
        console.error('❌ שגיאת חיבור ל-MongoDB:', err);
        process.exit(1);
    });

// --- Middleware לאימות מנהלים (Protection) ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'אין הרשאה, חסר טוקן' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ msg: 'הטוקן אינו תקין' });
    }
};

// --- 2. תבניות נתונים (Models) משופרות ---

const PostSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    category: { type: String, index: true }, // אינדקס לחיפוש מהיר
    imageUrl: String,
    excerpt: String,
    author: String,
    tags: [String],
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    date: { type: Date, default: Date.now, index: true } // שינוי ל-Date אמיתי למיון נכון
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

// --- כתבות (Posts) עם חלוקה לעמודים (Pagination) ---
app.get('/api/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;

        let query = {};
        if (category) query.category = category;

        const posts = await Post.find(query)
            .sort({ date: -1 }) // מיון לפי תאריך יורד (החדש ביותר)
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
        // עדכון צפיות והחזרת הכתבה
        const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
        res.json(post);
    } catch (err) {
        res.status(404).json({ error: "Post not found" });
    }
});

// יצירה ומחיקה דורשות אימות (authMiddleware)
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

// --- מבזקים (Alerts) ---
app.get('/api/alerts', async (req, res) => res.json(await Alert.find({ active: true }).sort({ date: -1 })));
app.post('/api/alerts', authMiddleware, async (req, res) => res.json(await new Alert(req.body).save()));
app.delete('/api/alerts/:id', authMiddleware, async (req, res) => {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// --- אימות משתמשים (Auth) - מאובטח ---
app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'משתמש כבר קיים' });

        user = new User({ email, password, name });

        // הצפנת הסיסמה
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // יצירת טוקן
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאת שרת');
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'פרטים שגויים' });

        // השוואת סיסמה מוצפנת
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'פרטים שגויים' });

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('שגיאת שרת');
    }
});

app.get('/api/users', authMiddleware, async (req, res) => {
    // החזרת משתמשים ללא הסיסמה
    res.json(await User.find().select('-password'));
});

// --- פרסומות וצור קשר ---
app.get('/api/ads', async (req, res) => res.json(await Ad.find({ isActive: true })));
app.post('/api/ads', authMiddleware, async (req, res) => res.json(await new Ad(req.body).save()));
app.post('/api/contact', async (req, res) => res.json(await new ContactMessage(req.body).save()));

// 4. הגשת האתר (Frontend)
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'client/dist/index.html')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 שרת "צפת בתנופה" (Production) רץ בפורט ${PORT}`));