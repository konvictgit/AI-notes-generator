// pages/api/ask.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { fileKey, question } = req.body;
  if (!fileKey || !question) {
    return res
      .status(400)
      .json({ error: "Both fileKey and question are required." });
  }

  try {
    // 🔹 Get notes for this file
    const { data, error } = await supabase
      .from("notes")
      .select("summary, flashcards, full_text")
      .eq("file_key", fileKey)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "No notes found for this file." });
    }

    // 🔹 Use full_text if available, else fallback to summary + flashcards
    const context = data.full_text
      ? data.full_text.slice(0, 3000) // safe limit for free-tier models
      : `
Summary: ${data.summary || ""}
Flashcards: ${JSON.stringify(data.flashcards || [])}
    `;

    // 🔹 Hugging Face API call
    const hfRes = await fetch(
      "https://api-inference.huggingface.co/models/deepset/roberta-base-squad2",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inputs: { question, context },
        }),
      }
    );

    if (!hfRes.ok) {
      const errText = await hfRes.text();
      return res
        .status(500)
        .json({ error: `HF API error ${hfRes.status}: ${errText}` });
    }

    const result = await hfRes.json();

    // HF sometimes returns an array of answers
    const answer =
      result?.answer ||
      (Array.isArray(result) ? result[0]?.answer : null) ||
      "No clear answer found in the document.";

    return res.status(200).json({ answer });
  } catch (err) {
    console.error("❌ Ask API error:", err);
    return res.status(500).json({ error: err.message });
  }
}
