import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config(); // load .env file
const { Pool } = pkg;

const app = express();

// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:5173",                  // local React (Vite) dev
  "https://login-brown-kappa-37.vercel.app" // deployed frontend on Vercel
];

// ✅ CORS config
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// Check if using Render external DB (needs SSL)
const isExternal = process.env.DATABASE_URL?.includes("render.com");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isExternal ? { rejectUnauthorized: false } : false
});

// ✅ Test DB connection
pool.connect()
  .then(client => {
    console.log("✅ Connected to Postgres!");
    client.release();
  })
  .catch(err => console.error("❌ Database connection failed:", err));

// Simple health route
app.get("/", (req, res) => {
  res.send("✅ Backend is running!");
});

// Login API
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

// ✅ Use PORT from Render
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
