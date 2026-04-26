import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import todoRoutes from "./routes/todoRoutes.js";
import { connectDB } from "./config/db.js";

// Loads environment variables from `.env` into `process.env`.
// This must run before we read values like PORT, MONGO_URI, CLIENT_URL.
dotenv.config();

// Create one Express application instance.
// Think of `app` as the central pipeline where every request passes through:
// request -> middleware chain -> route handler -> response.
const app = express();

// Prefer deployment-provided PORT (Render/other platforms inject it),
// otherwise fallback to local dev port 5001.
const PORT = process.env.PORT || 5001;

// CORS allow-list:
// CLIENT_URL can be one domain or multiple domains separated by commas.
// Example:
// CLIENT_URL=https://myapp.netlify.app,http://localhost:5173
//
// We convert that string into a clean array so origin checks are reliable.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS middleware controls which browser origins can call this API.
// Important concept:
// - Browsers enforce CORS (servers/tools like Postman do not in the same way).
// - `origin` is the domain where frontend is running.
// - If origin is in allow-list, request proceeds.
// - If origin is blocked, browser call fails before frontend gets data.
//
// `!origin` is allowed for non-browser clients and some same-origin scenarios.
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Pass an error to CORS so disallowed origins are rejected explicitly.
      return callback(new Error("CORS: Origin not allowed"));
    }
  })
);

// Parse incoming JSON request bodies.
// Without this, `req.body` would be undefined for JSON payloads.
app.use(express.json());

// Lightweight health endpoint:
// used by deployment platforms, uptime checks, and quick diagnostics.
// If this endpoint responds, process is alive and routing works.
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Mount todo routes under a shared API prefix.
// Final route examples:
// GET    /api/todos
// POST   /api/todos
// PUT    /api/todos/:id
// DELETE /api/todos/:id
app.use("/api/todos", todoRoutes);

// Central error handler (Express error-handling middleware has 4 args).
// Any middleware/route that calls `next(error)` lands here.
// We log server-side details but send a generic message to client to avoid
// leaking internal implementation info.
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Something went wrong." });
});

// Boot sequence:
// 1) Connect to MongoDB first
// 2) Start HTTP server only after DB is ready
//
// Why this order?
// Starting server before DB can accept requests that immediately fail.
// This pattern ensures app is actually ready to serve traffic.
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    // Fail fast on startup errors.
    // In production, process managers/platforms can restart the app.
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

// Entry point invocation.
startServer();
