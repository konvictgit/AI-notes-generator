const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function saveNotes({ fileKey, summary, flashcards, quizzes, full_text }) {
  const { data, error } = await supabase
    .from("notes")
    .insert([
      {
        file_key: fileKey,
        summary,
        flashcards,
        quizzes,
        full_text, // ✅ storing raw PDF text for Q&A
      },
    ])
    .select(); // return inserted row

  if (error) {
    console.error("❌ Supabase insert error:", error.message);
    throw error;
  }
  return data;
}

module.exports = { saveNotes, supabase };
