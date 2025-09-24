import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config(); // load .env
const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json());

// Check if URL is Render's external (needs SSL)
const isExternal = process.env.DATABASE_URL?.includes("render.com");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isExternal ? { rejectUnauthorized: false } : false,
});

// ✅ Test DB connection at startup
pool.connect()
  .then(client => {
    console.log("✅ Connected to Postgres!");
    client.release();
  })
  .catch(err => console.error("❌ Database connection failed:", err));

// Health check route
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// Login route
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE username=$1 AND password=$2",
      [username, password]
    );

    if (result.rows.length > 0) {
      res.json({ success: true, message: "Login successful!" });
    } else {
      res.status(401).json({ success: false, message: "Incorrect username or password" });
    }
  } catch (err) {
    console.error("❌ Query error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Use process.env.PORT for Render
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
