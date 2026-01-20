const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. חיבור למסד הנתונים
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ מחובר למנגו - המערכת מוכנה לעבודה'))
    .catch(err => console.log('❌ שגיאת מנגו:', err));

// 2. תבניות נתונים (Models)
const Post = mongoose.model('Post', new mongoose.Schema({
    title: String, content: String, category: String, imageUrl: String, excerpt: String,
    author: String, tags: [String], isFeatured: { type: Boolean, default: false },
    views: { type: Number, default: 0 }, likes: { type: Number, default: 0 },
    date: { type: String, default: () => new Date().toLocaleDateString('he-IL') }
}));

const User = mongoose.model('User', new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, default: 'user' },
    joinedDate: { type: String, default: () => new Date().toISOString().split('T')[0] }
}));

const Ad = mongoose.model('Ad', new mongoose.Schema({
    area: String, title: String, isActive: { type: Boolean, default: true },
    slides: [{ imageUrl: String, linkUrl: String, videoUrl: String }]
}));

const Alert = mongoose.model('Alert', new mongoose.Schema({
    content: String, active: { type: Boolean, default: true },
    title: String, date: { type: String, default: () => new Date().toLocaleTimeString('he-IL', {hour:'2-digit', minute:'2-digit'}) }
}));

const ContactMessage = mongoose.model('ContactMessage', new mongoose.Schema({
    name: String, email: String, phone: String, subject: String, message: String,
    date: { type: String, default: () => new Date().toLocaleString('he-IL') },
    read: { type: Boolean, default: false }
}));

// 3. נתיבי API

// --- כתבות (Posts) ---
app.get('/api/posts', async (req, res) => res.json(await Post.find().sort({ _id: -1 })));
app.post('/api/posts', async (req, res) => res.json(await new Post(req.body).save()));
app.delete('/api/posts/:id', async (req, res) => {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// --- מבזקים (Alerts) ---
app.get('/api/alerts', async (req, res) => res.json(await Alert.find({ active: true }).sort({ _id: -1 })));
app.post('/api/alerts', async (req, res) => res.json(await new Alert(req.body).save()));
app.delete('/api/alerts/:id', async (req, res) => {
    await Alert.findByIdAndDelete(req.params.id);
    res.json({ success: true });
});

// --- אימות משתמשים (Auth) ---
app.post('/api/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.json({ user });
    } catch (err) { res.status(400).json({ error: "Email already exists" }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) res.json({ user });
    else res.status(401).json({ error: "Unauthorized" });
});

app.get('/api/users', async (req, res) => res.json(await User.find().select('-password')));

// --- פרסומות (Ads) ---
app.get('/api/ads', async (req, res) => res.json(await Ad.find({ isActive: true })));
app.post('/api/ads', async (req, res) => res.json(await new Ad(req.body).save()));

// --- הודעות צור קשר ---
app.get('/api/contact', async (req, res) => res.json(await ContactMessage.find().sort({ _id: -1 })));
app.post('/api/contact', async (req, res) => res.json(await new ContactMessage(req.body).save()));

// 4. הגשת האתר (Frontend)
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('(.*)', (req, res) => res.sendFile(path.join(__dirname, 'client/dist/index.html')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 שרת "צפת בתנופה" רץ בפורט ${PORT}`));