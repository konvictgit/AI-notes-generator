// worker/hfClient.js
const fetch = require("node-fetch");

const HF_API_BASE = "https://api-inference.huggingface.co/models/";

/**
 * Generic Hugging Face API request with raw-response logging and cold-start handling.
 * Returns parsed JSON, or { estimated_time } if model is warming up.
 */
async function query(model, payload) {
  const url = HF_API_BASE + model;
  console.log("🔗 HF request →", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  // Read raw response text first (some HF errors return HTML)
  const raw = await res.text();
  // Log the first chunk for debugging
  if (raw && raw.length) {
    console.log(
      "📩 HF raw response (first 300 chars):",
      raw.slice(0, 300).replace(/\n/g, " ")
    );
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    // If HF returned non-JSON (HTML or other), expose that so we can debug
    console.error(
      "❌ HF returned non-JSON (likely an HTML error page or wrong endpoint). Raw start:",
      raw.slice(0, 300)
    );
    throw new Error("Invalid JSON response from Hugging Face");
  }

  // Cold start case (HF returns { estimated_time })
  if (data?.estimated_time) {
    console.log(`⏳ Hugging Face model cold start: ~${data.estimated_time}s`);
    return { estimated_time: data.estimated_time };
  }

  if (!res.ok) {
    const errMsg =
      data?.error || `Hugging Face API error (status ${res.status})`;
    throw new Error(errMsg);
  }

  return data;
}

/**
 * Split text into smaller chunks (character-based).
 */
function chunkText(text, maxChars = 1500) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks;
}

/**
 * Generate a summary for input text.
 * Returns either { estimated_time } or a bullet-point summary string.
 *
 * Options:
 *  - model: string (HF model)
 *  - chunkSize: number
 *  - max_length / min_length / do_sample: HF generation parameters
 */
async function generateSummary(text, options = {}) {
  const model =
    options.model ||
    process.env.HUGGINGFACE_MODEL_SUMMARY ||
    "facebook/bart-large-cnn";
  const chunkSize = options.chunkSize || 1500;

  const chunks = chunkText(text, chunkSize);
  const allSummaries = [];

  for (const chunk of chunks) {
    try {
      const payload = { inputs: chunk };
      const parameters = {};
      if (typeof options.max_length !== "undefined")
        parameters.max_length = options.max_length;
      if (typeof options.min_length !== "undefined")
        parameters.min_length = options.min_length;
      if (typeof options.do_sample !== "undefined")
        parameters.do_sample = options.do_sample;
      if (Object.keys(parameters).length) payload.parameters = parameters;

      const output = await query(model, payload);

      // If HF indicates model is warming up, forward that
      if (output?.estimated_time) {
        return { estimated_time: output.estimated_time };
      }

      // Hugging Face summarization commonly returns an array with summary_text
      let summary = null;
      if (Array.isArray(output)) {
        summary = output[0]?.summary_text || output[0]?.generated_text || null;
      } else if (typeof output === "object") {
        summary = output.summary_text || output.generated_text || null;
      }

      if (summary) {
        // Turn into bullet-style (prefix each line with bullet)
        const bulletified = summary
          .trim()
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => `• ${s}`)
          .join("\n");
        allSummaries.push(bulletified);
      } else {
        console.error(
          "⚠️ Unexpected HF output shape:",
          JSON.stringify(output).slice(0, 400)
        );
      }
    } catch (err) {
      console.error("HF summary error:", err.message || err);
      allSummaries.push(`• Error: ${err.message || String(err)}`);
    }
  }

  if (!allSummaries.length) return "No summary generated.";
  // join bullet groups with newline between chunks
  return allSummaries.join("\n");
}

module.exports = { generateSummary };
