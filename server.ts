import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "entangled-minds-secret-key-123";
const db = new Database("entangled.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    bio TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS tutorials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category_id INTEGER,
    author_id INTEGER,
    parent_id INTEGER DEFAULT NULL,
    order_index INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id),
    FOREIGN KEY (author_id) REFERENCES users(id),
    FOREIGN KEY (parent_id) REFERENCES tutorials(id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER,
    tutorial_id INTEGER,
    PRIMARY KEY (user_id, tutorial_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tutorial_id) REFERENCES tutorials(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    user_id INTEGER,
    tutorial_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (tutorial_id) REFERENCES tutorials(id)
  );

  CREATE TABLE IF NOT EXISTS contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const userCount = db.prepare("SELECT count(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)").run("admin@entangledminds.edu", hashedPassword, "Admin", "admin");
  
  db.prepare("INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)").run("Algorithms", "algorithms", "Master the efficiency of computing.");
  db.prepare("INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)").run("Data Structures", "data-structures", "How computers organize information.");
  
  const cat = db.prepare("SELECT id FROM categories WHERE slug = 'algorithms'").get() as { id: number };
  db.prepare("INSERT INTO tutorials (title, slug, content, excerpt, category_id, author_id) VALUES (?, ?, ?, ?, ?, ?)").run(
    "Big O Notation", 
    "big-o-notation", 
    "# Understanding Big O\n\nBig O notation is used to describe the efficiency of an algorithm...", 
    "Learn how to measure performance in computing.", 
    cat.id, 
    1
  );
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/register", (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = db.prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)").run(email, hashedPassword, name);
      const user = { id: result.lastInsertRowid, email, name, role: 'user' };
      const token = jwt.sign(user, JWT_SECRET);
      res.json({ token, user });
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (user && bcrypt.compareSync(password, user.password || "")) {
      const payload = { id: user.id, email: user.email, name: user.name, role: user.role };
      const token = jwt.sign(payload, JWT_SECRET);
      res.json({ token, user: payload });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Tutorials
  app.get("/api/tutorials", (req, res) => {
    const { search, category } = req.query;
    let query = `
      SELECT t.*, c.name as category_name 
      FROM tutorials t 
      LEFT JOIN categories c ON t.category_id = c.id
    `;
    const params: any[] = [];
    
    if (search || category) {
      query += " WHERE ";
      const conditions = [];
      if (search) {
        conditions.push("(t.title LIKE ? OR t.content LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
      }
      if (category) {
        conditions.push("c.slug = ?");
        params.push(category);
      }
      query += conditions.join(" AND ");
    }
    
    query += " ORDER BY t.order_index ASC, t.created_at DESC";
    const tutorials = db.prepare(query).all(...params);
    res.json(tutorials);
  });

  app.get("/api/tutorials/:slug", (req, res) => {
    const tutorial = db.prepare(`
      SELECT t.*, c.name as category_name, u.name as author_name
      FROM tutorials t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN users u ON t.author_id = u.id
      WHERE t.slug = ?
    `).get(req.params.slug);
    
    if (tutorial) {
      const t = tutorial as any;
      const comments = db.prepare(`
        SELECT c.*, u.name as user_name, u.avatar as user_avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.tutorial_id = ?
        ORDER BY c.created_at DESC
      `).all(t.id);
      res.json({ ...t, comments });
    } else {
      res.status(404).json({ error: "Not found" });
    }
  });

  app.post("/api/tutorials", authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, slug, content, excerpt, category_id, parent_id, order_index } = req.body;
    try {
      const result = db.prepare(`
        INSERT INTO tutorials (title, slug, content, excerpt, category_id, author_id, parent_id, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(title, slug, content, excerpt, category_id, req.user.id, parent_id, order_index || 0);
      res.json({ id: result.lastInsertRowid });
    } catch (e) {
      res.status(400).json({ error: "Slug must be unique" });
    }
  });

  // Comments
  app.post("/api/comments", authenticateToken, (req: any, res) => {
    const { content, tutorial_id } = req.body;
    const result = db.prepare("INSERT INTO comments (content, user_id, tutorial_id) VALUES (?, ?, ?)").run(content, req.user.id, tutorial_id);
    const comment = db.prepare("SELECT c.*, u.name as user_name FROM comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?").get(result.lastInsertRowid);
    res.json(comment);
  });

  // Favorites
  app.post("/api/favorites/:id", authenticateToken, (req: any, res) => {
    try {
      db.prepare("INSERT INTO favorites (user_id, tutorial_id) VALUES (?, ?)").run(req.user.id, req.params.id);
      res.json({ status: "favorited" });
    } catch (e) {
      db.prepare("DELETE FROM favorites WHERE user_id = ? AND tutorial_id = ?").run(req.user.id, req.params.id);
      res.json({ status: "unfavorited" });
    }
  });

  app.get("/api/profile", authenticateToken, (req: any, res) => {
    const user = db.prepare("SELECT id, email, name, role, bio, avatar, created_at FROM users WHERE id = ?").get(req.user.id) as any;
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const favorites = db.prepare(`
      SELECT t.* 
      FROM tutorials t
      JOIN favorites f ON t.id = f.tutorial_id
      WHERE f.user_id = ?
    `).all(req.user.id);
    const comments = db.prepare(`
      SELECT c.*, t.title as tutorial_title, t.slug as tutorial_slug
      FROM comments c
      JOIN tutorials t ON c.tutorial_id = t.id
      WHERE c.user_id = ?
      ORDER BY c.created_at DESC
    `).all(req.user.id);
    res.json({ ...user, favorites, comments });
  });

  app.put("/api/profile", authenticateToken, (req: any, res) => {
    const { name, bio, avatar } = req.body;
    try {
      db.prepare("UPDATE users SET name = ?, bio = ?, avatar = ? WHERE id = ?").run(name, bio, avatar, req.user.id);
      const user = db.prepare("SELECT id, email, name, role, bio, avatar FROM users WHERE id = ?").get(req.user.id);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Failed to update profile" });
    }
  });

  // Categories
  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories").all();
    res.json(categories);
  });

  // Contact
  app.post("/api/contact", (req, res) => {
    const { name, email, subject, message } = req.body;
    db.prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)").run(name, email, subject, message);
    res.json({ success: true });
  });

  // --- Vite / Production Serving ---

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
