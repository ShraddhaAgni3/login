import express from "express";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;

const app = express();
app.use(cors()); // or app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const pool = new Pool({
  user: "postgres",      // change to your values
  host: "localhost",
  database: "login",
  password: "123456",
  port: 5432,
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
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(4000, () => console.log("server running on http://localhost:4000"));
