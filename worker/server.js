// worker/server.js
const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: path.resolve(__dirname, "./.env") });

console.log(
  "🔑 Loaded HF key:",
  process.env.HUGGINGFACE_API_KEY
    ? process.env.HUGGINGFACE_API_KEY.slice(0, 12) + "..."
    : "undefined"
);

const summarizeRoute = require("./routes/summarize");
const notifyUploadRoute = require("./routes/notify-upload");

const app = express();

// Allow the frontend origin (set FRONTEND_ORIGIN in worker/.env), fallback to all origins
const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || "*",
};
app.use(cors(corsOptions));

// Increase JSON body size as users may paste long articles
app.use(express.json({ limit: "20mb" }));

// Extend request timeout to 2 minutes on server side (helpful during HF cold-start)
app.use((req, res, next) => {
  req.setTimeout(120000); // 120s
  res.setTimeout(120000);
  next();
});

// Health
app.get("/health", (req, res) => res.json({ status: "ok" }));

// API routes
app.use("/api", summarizeRoute);
app.use("/api", notifyUploadRoute);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(
    `🚀 Worker API running at http://localhost:${PORT} (PORT=${PORT})`
  );
});
