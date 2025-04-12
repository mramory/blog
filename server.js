const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(express.static('public'));

const db = new sqlite3.Database('blog.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the blog database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id INTEGER,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts (id)
    )`);
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/posts', (req, res) => {
    db.all(`SELECT * FROM posts ORDER BY created_at DESC`, [], (err, posts) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        
        const postsWithComments = posts.map(post => {
            return new Promise((resolve, reject) => {
                db.all(`SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC`, [post.id], (err, comments) => {
                    if (err) reject(err);
                    resolve({ ...post, comments });
                });
            });
        });

        Promise.all(postsWithComments)
            .then(posts => res.json(posts))
            .catch(err => res.status(500).json({ error: err.message }));
    });
});

app.post('/api/posts', (req, res) => {
    const { title, content } = req.body;
    db.run(`INSERT INTO posts (title, content) VALUES (?, ?)`,
        [title, content],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                id: this.lastID,
                title,
                content,
                created_at: new Date().toISOString(),
                comments: []
            });
        });
});

app.post('/api/posts/:postId/comments', (req, res) => {
    const { content } = req.body;
    const postId = req.params.postId;

    db.run(`INSERT INTO comments (post_id, content) VALUES (?, ?)`,
        [postId, content],
        function(err) {
            if (err) {
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({
                id: this.lastID,
                post_id: postId,
                content,
                created_at: new Date().toISOString()
            });
        });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 