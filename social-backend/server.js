// server.js
 
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
 
const app = express();
dotenv.config();


const PORT = process.env.PORT
const URL = process.env.MONGOURL 

mongoose.connect(URL).then(() => {
  console.log("DB connected successfully");

  app.listen(PORT, () => {
    console.log(`server is running on port: ${PORT}`);
  });
}).catch((error) => console.log(error));
 
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
 
const upload = multer({ storage: storage });
 
 
const postSchema = new mongoose.Schema({
    title: String,
    content: String,
    file: String,
    likes: { type: Number, default: 0 },
    comments: [{ text: String }],
});
 
const Post = mongoose.model('Post', postSchema);
 
app.use(bodyParser.json());
 
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
app.post('/api/posts', upload.single('file'), async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title || !content) {
            return res.status(400).json({ error: 'Title and content are required fields' });
        }

        const file = req.file ? req.file.filename : undefined;

        const post = await Post.create({ title, content, file });
        res.status(201).json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

 
app.post('/api/posts/like/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const post = await Post.findById(postId);
 
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
 
        post.likes += 1;
        await post.save();
 
        res.json(post);
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
 
app.post('/api/posts/comment/:postId', async (req, res) => {
    try {
        const postId = req.params.postId;
        const { text } = req.body;
        const post = await Post.findById(postId);
 
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
 
        post.comments.push({ text });
        await post.save();
 
        res.json(post);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
 