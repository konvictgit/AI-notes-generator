// worker/routes/notify-upload.js
const express = require("express");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { generateSummary } = require("../hfClient");

const upload = multer();
const router = express.Router();

// POST /api/notify-upload
// Accepts multipart/form-data with field "file" (PDF).
router.post("/notify-upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("📄 Received PDF upload:", req.file.originalname);

    const pdfData = await pdfParse(req.file.buffer);
    const text = pdfData && pdfData.text ? pdfData.text : "";

    if (!text.trim()) {
      console.warn("⚠️ PDF contained no extractable text.");
      return res.json({ text: "", summary: "⚠️ No text found in PDF." });
    }

    console.log("🔎 Extracted text length:", text.length);

    // Use generateSummary which handles chunking + parameters
    const summary = await generateSummary(text, {
      max_length: 320,
      min_length: 80,
    });

    if (summary?.estimated_time) {
      // If model warm-up is required, forward that info
      return res.json({ estimated_time: summary.estimated_time });
    }

    res.json({ text, summary });
  } catch (err) {
    console.error(
      "❌ PDF upload summarization error:",
      err && err.message ? err.message : err
    );
    res
      .status(500)
      .json({ error: "Failed to process PDF: " + (err.message || err) });
  }
});

module.exports = router;
