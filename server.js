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

const Ad = mongoose.model('Ad', new mongoose.Schema({
    area: String, isActive: { type: Boolean, default: true },
    slides: [{ imageUrl: String, linkUrl: String }]
}));

const Alert = mongoose.model('Alert', new mongoose.Schema({
    content: String, active: { type: Boolean, default: true }
}));

// 3. נתיבי API
app.get('/api/posts', async (req, res) => res.json(await Post.find().sort({ _id: -1 })));
app.post('/api/posts', async (req, res) => res.json(await new Post(req.body).save()));
app.get('/api/alerts', async (req, res) => res.json(await Alert.find({ active: true })));
app.get('/api/ads', async (req, res) => res.json(await Ad.find({ isActive: true })));

// 4. הגשת האתר (Frontend)
app.use(express.static(path.join(__dirname, 'client/dist')));

// תיקון קריטי ל-PathError בגרסאות Node חדשות
app.get('(.*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 שרת "חדשות צפת" רץ בפורט ${PORT}`));