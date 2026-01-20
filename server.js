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
    .then(() => console.log('✅ מחובר למנגו אטלס'))
    .catch(err => console.log('❌ שגיאת מנגו:', err));

// 2. תבניות נתונים (Models)
const Post = mongoose.model('Post', new mongoose.Schema({
    title: String, content: String, category: String, imageUrl: String,
    views: { type: Number, default: 0 }, likes: { type: Number, default: 0 },
    date: { type: String, default: () => new Date().toLocaleDateString('he-IL') }
}));

const User = mongoose.model('User', new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, default: 'user' }
}));

const Ad = mongoose.model('Ad', new mongoose.Schema({
    area: String, isActive: { type: Boolean, default: true },
    slides: [{ imageUrl: String, linkUrl: String }]
}));

// 3. נתיבי API

// כתבות - מחזיר רק מה שיש במסד (כרגע יהיה ריק)
app.get('/api/posts', async (req, res) => res.json(await Post.find().sort({ _id: -1 })));
app.post('/api/posts', async (req, res) => res.json(await new Post(req.body).save()));

// אימות משתמשים - כאן קורה הקסם של החיבור
app.post('/api/register', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.json({ user });
    } catch (err) { res.status(400).json({ error: "Email exists" }); }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email, password });
    if (user) res.json({ user });
    else res.status(401).json({ error: "Unauthorized" });
});

app.get('/api/ads', async (req, res) => res.json(await Ad.find({ isActive: true })));

// 4. הגשת האתר
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('(.*)', (req, res) => res.sendFile(path.join(__dirname, 'client/dist/index.html')));

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 שרת "חדשות צפת" רץ בפורט ${PORT}`));