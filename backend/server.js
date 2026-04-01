require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./database");
const fs = require("fs");
const path = require("path");

const coursesFile = path.join(__dirname, "courses.json");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
console.log("Reading from:", coursesFile);
// --- Auth Routes ---
app.post("/api/auth/register", (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const query = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
  db.run(query, [name, email, password, role], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Email already exists." });
      }
      return res.status(500).json({ error: err.message });
    }
    // Return the newly created user without password
    res.status(201).json({ user: { id: this.lastID, name, email, role } });
  });
});

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body;

  const query = `SELECT id, name, email, role FROM users WHERE email = ? AND password = ?`;
  db.get(query, [email, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    if (row) {
      res.json({ user: row });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  });
});

// --- Course Routes ---
app.get("/api/courses", (req, res) => {
  fs.readFile(coursesFile, "utf8", (err, data) => {
    console.log("RAW FILE DATA:", data);
    if (err) {
      // Если файл ещё не создан, возвращаем пустой массив
      if (err.code === "ENOENT") {
        return res.json({ courses: [] });
      }
      return res.status(500).json({ error: "Failed to read courses." });
    }

    try {
      const courses = JSON.parse(data);
      res.json({ courses });
    } catch (e) {
      console.error("JSON parse error:", e);
      res.status(500).json({ error: "Invalid JSON format." });
    }
  });
});

app.get("/api/teacher/courses/:teacherId", (req, res) => {
  const teacherId = req.params.teacherId;
  const query = `SELECT * FROM courses WHERE teacher_id = ? ORDER BY created_at DESC`;

  db.all(query, [teacherId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const courses = rows.map((r) => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : [],
    }));
    res.json({ courses });
  });
});

app.post("/api/courses", (req, res) => {
  const { teacher_id, title, description, tags } = req.body;
  if (!teacher_id || !title || !description) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const tagsString = JSON.stringify(tags || []);
  const query = `INSERT INTO courses (teacher_id, title, description, tags) VALUES (?, ?, ?, ?)`;

  db.run(query, [teacher_id, title, description, tagsString], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ courseId: this.lastID });
  });
});

// --- Enrollment Routes ---
app.post("/api/enroll", (req, res) => {
  const { student_id, course_id } = req.body;

  const query = `INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)`;
  db.run(query, [student_id, course_id], function (err) {
    if (err) {
      if (err.message.includes("UNIQUE constraint failed")) {
        return res.status(400).json({ error: "Already enrolled." });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ message: "Successfully enrolled." });
  });
});

app.get("/api/student/courses/:studentId", (req, res) => {
  const studentId = req.params.studentId;
  const query = `
    SELECT c.id, c.title, c.description, c.tags, e.enrolled_at, u.name as teacher_name
    FROM courses c
    JOIN enrollments e ON c.id = e.course_id
    JOIN users u ON c.teacher_id = u.id
    WHERE e.student_id = ?
  `;

  db.all(query, [studentId], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });

    const courses = rows.map((r) => ({
      ...r,
      tags: r.tags ? JSON.parse(r.tags) : [],
    }));
    res.json({ courses });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
