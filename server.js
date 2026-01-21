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

// --- 1. הגדרות ליבה ואבטחה ---
app.set('trust proxy', 1); 

app.use(helmet({
    contentSecurityPolicy: false, 
    crossOriginEmbedderPolicy: false,
}));

app.use(cors());
app.use(express.json());

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
    isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
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

// --- 4. Middleware לאימות ---
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

// --- 5. נתיבי API (Routes) ---

app.get('/api/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const category = req.query.category;
        let query = {};
        if (category) query.category = category;

        const posts = await Post.find(query).sort({ _id: -1 }).skip((page - 1) * limit).limit(limit);
        const total = await Post.countDocuments(query);
        res.json({ posts, totalPages: Math.ceil(total / limit), currentPage: page });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

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
app.get('/api/ads', async (req, res) => res.json(await Ad.find({ isActive: true })));
app.post('/api/ads', authMiddleware, async (req, res) => res.json(await new Ad(req.body).save()));
app.get('/api/alerts', async (req, res) => res.json(await Alert.find({ active: true }).sort({ _id: -1 })));
app.get('/api/contact', authMiddleware, async (req, res) => res.json(await ContactMessage.find().sort({ _id: -1 })));
app.post('/api/contact', async (req, res) => res.json(await new ContactMessage(req.body).save()));

app.post('/api/newsletter/subscribe', async (req, res) => {
    try {
        const { email } = req.body;
        const existing = await Subscriber.findOne({ email });
        if (existing) return res.status(400).json({ msg: 'כבר רשום לניוזלטר' });
        await new Subscriber({ email }).save();
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- 6. הגשת האתר (Frontend) ---
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) { 
        return res.status(404).json({ error: 'API route not found' }); 
    }
    if (req.path.includes('.')) { 
        return res.status(404).send('Resource not found'); 
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

// --- 7. הרצת השרת ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => { 
    console.log(`🚀 שרת "צפת בתנופה" באוויר בפורט ${PORT}`); 
});