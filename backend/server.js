import express from "express";
import cors from "cors";
import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const app = express();
const allowedOrigins = [
  "http://localhost:5173",                  
  "https://login-brown-kappa-37.vercel.app" 
];
app.use(cors({
  origin: (origin, callback) => {
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
const isExternal = process.env.DATABASE_URL?.includes("render.com");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isExternal ? { rejectUnauthorized: false } : false
});
pool.connect()
  .then(client => {
    console.log("Connected to Postgres!");
    client.release();
  })
  .catch(err => console.error("Database connection failed:", err));
app.get("/", (req, res) => {
  res.send("Backend is running!");
});
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
    console.error("Query error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
