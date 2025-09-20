// frontend/pages/summarize.js
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import SummaryCard from "../components/SummaryCard";

export default function SummarizePage() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  const stopCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const startCountdown = (seconds, onFinish) => {
    setCountdown(seconds);
    stopCountdown();

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === 1) {
          stopCountdown();
          if (onFinish) onFinish();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const fetchSummary = async () => {
    try {
      console.log("📡 Calling backend:", `${apiBase}/api/summarize`);
      const res = await axios.post(
        `${apiBase}/api/summarize`,
        { text },
        { timeout: 120000 }
      );

      console.log("✅ Backend response:", res.data);

      if (res.data?.estimated_time) {
        const waitSec = Math.ceil(res.data.estimated_time);
        setMessage(`⏳ Model is warming up… retrying in ~${waitSec}s`);
        startCountdown(waitSec, fetchSummary);
      } else if (res.data?.summary) {
        setSummary(res.data.summary);
        setMessage("");
      } else {
        setMessage("⚠️ Unexpected response from backend.");
      }
    } catch (err) {
      console.error("❌ Axios error:", err);
      setMessage(
        "❌ Error summarizing: " + (err?.response?.data?.error || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (!text.trim()) return alert("Paste some text to summarize.");
    setLoading(true);
    setSummary("");
    setMessage("⏳ Sending request… Hugging Face may take 30–60s.");
    setCountdown(null);
    stopCountdown();
    await fetchSummary();
  };

  useEffect(() => {
    return () => stopCountdown();
  }, []);

  return (
    <div style={{ padding: 28, fontFamily: "Inter, system-ui, sans-serif" }}>
      <h1>📝 Summarize Text</h1>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={12}
        cols={90}
        placeholder="Paste an article, notes, or lecture transcript..."
        style={{ width: "100%", padding: 12, fontSize: 14 }}
      />
      <div style={{ marginTop: 12 }}>
        <button
          onClick={handleSummarize}
          disabled={loading}
          style={{ padding: "8px 16px" }}
        >
          {loading ? "Summarizing…" : "Summarize"}
        </button>
      </div>

      {message && (
        <p style={{ marginTop: 12, color: "gray", fontStyle: "italic" }}>
          {message}
          {countdown !== null && ` (${countdown}s)`}
        </p>
      )}

      {summary && <SummaryCard summary={summary} />}
    </div>
  );
}
