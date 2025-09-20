require("dotenv").config({ path: "../.env.example" }); // load env
const { createKafkaClient } = require("./kafkaClient");
const { downloadFile } = require("./s3Client");
const { extractText } = require("./pdfExtractor");
const { generateSummary, generateFlashcards } = require("./hfClient");
const { setCache, getCache } = require("./redisClient");
const { saveNotes } = require("./supabaseClient");
const crypto = require("crypto");

const kafka = createKafkaClient();
const consumer = kafka.consumer({
  groupId: process.env.WORKER_GROUP_ID || "ai-study-notes-worker",
});
const topic = process.env.KAFKA_TOPIC_UPLOADS || "pdf_uploaded";

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: false });
  console.log("✅ Worker subscribed to", topic);

  await consumer.run({
    eachMessage: async ({ message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        console.log("📂 Processing file:", payload.fileKey);

        // 🔹 Cache key
        const cacheKey =
          "notes:" +
          crypto.createHash("md5").update(payload.fileKey).digest("hex");

        const cached = await getCache(cacheKey);
        if (cached) {
          console.log("⚡ Found cached results for", payload.fileKey);
          return;
        }

        // 🔹 Download from S3
        const buffer = await downloadFile(
          process.env.S3_BUCKET_NAME,
          payload.fileKey
        );
        const text = await extractText(buffer);

        if (!text || text.trim().length === 0) {
          throw new Error("❌ Extracted text is empty");
        }

        // 🔹 Generate notes
        const summary = await generateSummary(text);
        const flashcards = await generateFlashcards(text);
        const quizzes = []; // skipped for now

        // 🔹 Cache results
        await setCache(
          cacheKey,
          { summary, flashcards, quizzes, full_text: text },
          60 * 60 * 24
        ); // 24h

        // 🔹 Save to Supabase
        const saved = await saveNotes({
          fileKey: payload.fileKey,
          summary,
          flashcards,
          quizzes,
          full_text: text,
        });
        console.log("✅ Saved to Supabase:", saved);
      } catch (err) {
        console.error("🚨 Processing error:", err.message || err);
      }
    },
  });
}

run().catch((err) => {
  console.error("💀 Fatal error:", err.message || err);
  process.exit(1);
});
