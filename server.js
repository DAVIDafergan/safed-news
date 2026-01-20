const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. חיבור למסד הנתונים (MongoDB)
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ מחובר למנגו אטלס - מסד הנתונים מוכן'))
    .catch(err => console.log('❌ שגיאת מנגו:', err));

// 2. תבניות נתונים (Models) - הוספנו משתמשים ותגובות כדי שיישמרו
const Post = mongoose.model('Post', new mongoose.Schema({
    title: String, content: String, category: String, imageUrl: String,
    views: { type: Number, default: 0 }, likes: { type: Number, default: 0 },
    date: { type: String, default: () => new Date().toLocaleDateString('he-IL') }
}));

const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' }
}));

const Ad = mongoose.model('Ad', new mongoose.Schema({
    area: String, isActive: { type: Boolean, default: true },
    slides: [{ imageUrl: String, linkUrl: String }]
}));

const Alert = mongoose.model('Alert', new mongoose.Schema({
    content: String, active: { type: Boolean, default: true },
    date: { type: String, default: () => new Date().toLocaleDateString('he-IL') }
}));

const ContactMessage = mongoose.model('ContactMessage', new mongoose.Schema({
    name: String, email: String, message: String,
    date: { type: String, default: () => new Date().toLocaleString('he-IL') }
}));

// 3. נתיבי API (Routes)

// --- כתבות, מבזקים ופרסומות ---
app.get('/api/posts', async (req, res) => res.json(await Post.find().sort({ _id: -1 })));
app.post('/api/posts', async (req, res) => {
    const newPost = new Post(req.body);
    await newPost.save();
    res.json(newPost);
});
app.get('/api/alerts', async (req, res) => res.json(await Alert.find({ active: true }).sort({ _id: -1 })));
app.get('/api/ads', async (req, res) => res.json(await Ad.find({ isActive: true })));

// --- אימות משתמשים (Login/Register) - זה מה שהיה חסר כדי שהמשתמש יישמר ---
app.post('/api/register', async (req, res) => {
    try {
        const newUser = new User(req.body);
        await newUser.save();
        res.json({ user: newUser });
    } catch (err) {
        res.status(400).json({ error: "אימייל כבר קיים במערכת" });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) {
        res.json({ user });
    } else {
        res.status(401).json({ error: "פרטי התחברות שגויים" });
    }
});

// --- הודעות צור קשר ---
app.post('/api/contact', async (req, res) => {
    const msg = new ContactMessage(req.body);
    await msg.save();
    res.json({ success: true });
});

// 4. הגשת האתר (Frontend)
app.use(express.static(path.join(__dirname, 'client/dist')));

// תיקון קריטי ל-PathError עבור ה-React Router
app.get('(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 שרת "חדשות צפת" רץ בפורט ${PORT}`));