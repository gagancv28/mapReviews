// =============================================================================
// server.js — Express entry point
// =============================================================================

import "dotenv/config";
import express from "express";
import cors from "cors";
import fetchReviewsRouter from "./routes/fetchReviews.js";

const app  = express();
const PORT = process.env.PORT ?? 3001;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/fetch-reviews", fetchReviewsRouter);

// ── 404 fallback ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("[server] Unhandled error:", err);
  res.status(500).json({ error: "Internal server error.", details: err.message });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Server running on http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/fetch-reviews`);
  console.log(`   GET  http://localhost:${PORT}/health`);
});
