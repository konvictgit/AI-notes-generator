// worker/routes/summarize.js
const express = require("express");
const { generateSummary } = require("../hfClient");

const router = express.Router();

// POST /api/summarize
// body: { text: "...", max_length?: number, min_length?: number, do_sample?: boolean }
router.post("/summarize", async (req, res) => {
  try {
    const { text, max_length, min_length, do_sample } = req.body;
    if (!text || typeof text !== "string" || !text.trim()) {
      return res
        .status(400)
        .json({ error: "Text is required (non-empty string)" });
    }

    const options = {};
    if (max_length) options.max_length = Number(max_length);
    if (min_length) options.min_length = Number(min_length);
    if (typeof do_sample !== "undefined") options.do_sample = !!do_sample;

    const result = await generateSummary(text, options);

    if (result?.estimated_time) {
      console.log("➡️ Forwarding estimated_time:", result.estimated_time);
      return res.json({ estimated_time: result.estimated_time });
    }

    res.json({ summary: result });
  } catch (err) {
    console.error(
      "❌ Summarization error:",
      err && err.message ? err.message : err
    );
    res
      .status(500)
      .json({ error: "Failed to summarize: " + (err.message || err) });
  }
});

module.exports = router;
