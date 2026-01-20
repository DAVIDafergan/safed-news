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

// --- 1. הגדרות ליבה (קריטי ל-Railway) ---
app.set('trust proxy', 1); // מאפשר לזהות IP אמיתי מאחורי הפרוקסי

// --- 2. אבטחה ו-Middleware ---
app.use(helmet({
    contentSecurityPolicy: false, // פתרון לשגיאת ReactDOM is not defined - מאפשר טעינת סקריפטים של React
    crossOriginEmbedderPolicy: false,
}));

app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 200, 
    message: { msg: 'יותר מדי בקשות, נא לנסות שוב בעוד כמה דקות' }
});
app.use('/api/', limiter);

// --- 3. חיבור למסד הנתונים ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ מחובר למנגו אטלס - המערכת מוכנה'))
    .catch(err => {
        console.error('❌ שגיאת חיבור למנגו:', err);
        process.exit(1);
    });

// --- Middleware לאימות מנהלים ---
const authMiddleware = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'גישה נדחתה, חסר טוקן' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (e) {
        res.status(401).json({ msg: 'הטוקן אינו תקין' });
    }
};

// --- 4. תבניות נתונים (Models) ---

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
    shortLinkCode: String,
    date: { type: String, default: () => new Date().toLocaleDateString('he-IL') }
});
PostSchema.set('toJSON', { virtuals: true });
const Post = mongoose.model('Post', PostSchema);

const UserSchema = new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, default: 'user', enum: ['user', 'admin', 'editor'] },
    joinedDate: { type: String, default: () => new Date().toLocaleDateString('he-IL') }
});
const User = mongoose.model('User', UserSchema);

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

// --- 5. נתיבי API ---

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

app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await Post.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }, { new: true });
        if (!post) return res.status(404).json({ msg: 'הכתבה לא נמצאה' });
        res.json(post);
    } catch (err) { res.status(404).json({ error: "Invalid ID format" }); }
});

app.post('/api/posts', authMiddleware, async (req, res) => {
    try {
        const newPost = new Post(req.body);
        await newPost.save();
        res.json(newPost);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/alerts', async (req, res) => res.json(await Alert.find({ active: true }).sort({ _id: -1 })));
app.post('/api/alerts', authMiddleware, async (req, res) => res.json(await new Alert(req.body).save()));
app.delete('/api/alerts/:id', authMiddleware, async (req, res) => {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

app.post('/api/register', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'המשתמש כבר קיים' });
        user = new User({ email, password, name });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
        });
    } catch (err) { res.status(500).send('שגיאת שרת ברישום'); }
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
    } catch (err) { res.status(500).send('שגיאת שרת בהתחברות'); }
});

app.get('/api/users', authMiddleware, async (req, res) => { res.json(await User.find().select('-password')); });
app.get('/api/ads', async (req, res) => res.json(await Ad.find({ isActive: true })));
app.post('/api/ads', authMiddleware, async (req, res) => res.json(await new Ad(req.body).save()));
app.get('/api/contact', authMiddleware, async (req, res) => res.json(await ContactMessage.find().sort({ _id: -1 })));
app.post('/api/contact', async (req, res) => res.json(await new ContactMessage(req.body).save()));

// --- 6. הגשת האתר (Frontend) ---
// שינוי נתיב ה-dist לשורש הפרויקט (ללא תיקיית client)
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

// פתרון למסך לבן: מפריד בין קריאות API לבין קריאות לקבצים חסרים
app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) { 
        return res.status(404).json({ error: 'API route not found' }); 
    }
    // אם הבקשה היא לקובץ (מכיל נקודה) והוא לא נמצא ב-static, זו שגיאה אמיתית
    if (req.path.includes('.')) { 
        return res.status(404).send('Resource not found'); 
    }
    res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, "0.0.0.0", () => { 
    console.log(`🚀 שרת "צפת בתנופה" באוויר בפורט ${PORT}`); 
});