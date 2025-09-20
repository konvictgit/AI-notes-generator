// frontend/pages/index.js
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import { FaLinkedin, FaGithub, FaTwitter, FaEnvelope } from "react-icons/fa";

export default function Home() {
  const [tab, setTab] = useState("upload"); // upload | text

  // upload state
  const [file, setFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadSummary, setUploadSummary] = useState("");
  const [uploadText, setUploadText] = useState("");
  const [uploadLoading, setUploadLoading] = useState(false);

  // text summary state
  const [text, setText] = useState("");
  const [textSummary, setTextSummary] = useState("");
  const [textLoading, setTextLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [countdown, setCountdown] = useState(null);
  const countdownRef = useRef(null);

  const apiBase =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  // --- Upload handler ---
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Choose a PDF first.");
    setUploadLoading(true);
    setUploadStatus("📤 Uploading and processing...");

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await axios.post(`${apiBase}/api/notify-upload`, form, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });

      if (res.data?.estimated_time) {
        const waitSec = Math.ceil(res.data.estimated_time);
        setUploadStatus(`⏳ Model warming up — try again in ~${waitSec}s`);
      } else {
        setUploadText(res.data.text || "");
        setUploadSummary(res.data.summary || "No summary returned");
        setUploadStatus("✅ Done");
      }
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus(
        "❌ Upload failed: " + (err?.response?.data?.error || err.message)
      );
    } finally {
      setUploadLoading(false);
    }
  };

  // PDF Download
  const downloadSummaryPDF = (summary, filename = "summary.pdf") => {
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("AI Generated Summary", 14, 20);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(summary, 180);
    doc.text(lines, 14, 34);
    doc.save(filename);
  };

  // --- Text summarization handlers ---
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

  const fetchTextSummary = async () => {
    try {
      const res = await axios.post(
        `${apiBase}/api/summarize`,
        { text },
        { timeout: 120000 }
      );
      if (res.data?.estimated_time) {
        const waitSec = Math.ceil(res.data.estimated_time);
        setMessage(`⏳ Model is warming up… retrying in ~${waitSec}s`);
        startCountdown(waitSec, fetchTextSummary);
      } else if (res.data?.summary) {
        setTextSummary(res.data.summary);
        setMessage("");
      } else {
        setMessage("⚠️ Unexpected response from backend.");
      }
    } catch (err) {
      console.error("Text summarization error:", err);
      setMessage(
        "❌ Error summarizing: " + (err?.response?.data?.error || err.message)
      );
    } finally {
      setTextLoading(false);
    }
  };

  const handleTextSummarize = async () => {
    if (!text.trim()) return alert("Paste some text to summarize.");
    setTextLoading(true);
    setTextSummary("");
    setMessage("⏳ Sending request… Hugging Face may take 30–60s.");
    stopCountdown();
    await fetchTextSummary();
  };

  useEffect(() => {
    return () => stopCountdown();
  }, []);

  // Copy-to-clipboard
  const copySummary = (summary) => {
    navigator.clipboard.writeText(summary);
    alert("✅ Summary copied!");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-[Inter] text-gray-900 relative overflow-hidden bg-gradient-to-br from-pink-200 via-pink-100 to-blue-200 animate-gradient">
      {/* Background floating blobs */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-pink-400/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
      <div className="absolute top-40 -right-20 w-72 h-72 bg-blue-400/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-purple-400/40 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>

      <style jsx global>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 15s ease infinite;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Hero Section */}
      <div className="relative text-center py-16 z-10">
        <h1 className="text-6xl font-extrabold drop-shadow-xl text-pink-600">
          Summara
        </h1>
        <p className="italic text-xl text-gray-700 mt-2">
          “Turn pages into clarity.”
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 justify-center mb-6 z-10">
        <button
          onClick={() => setTab("upload")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            tab === "upload"
              ? "bg-gradient-to-r from-pink-500 to-blue-400 text-white shadow-md"
              : "bg-white/70 text-gray-700 hover:bg-white"
          }`}
        >
          📤 Upload PDF
        </button>
        <button
          onClick={() => setTab("text")}
          className={`px-6 py-2 rounded-lg font-semibold transition-all ${
            tab === "text"
              ? "bg-gradient-to-r from-pink-500 to-blue-400 text-white shadow-md"
              : "bg-white/70 text-gray-700 hover:bg-white"
          }`}
        >
          📝 Paste Text
        </button>
      </div>

      {/* Upload Tab */}
      {tab === "upload" && (
        <div className="relative z-10 bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg w-full max-w-2xl mx-auto mb-10">
          <form onSubmit={handleUpload}>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setFile(e.target.files[0])}
              className="mb-4 block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-pink-500 file:text-white hover:file:bg-pink-600 cursor-pointer"
            />
            <button
              type="submit"
              disabled={uploadLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-blue-400 text-white font-semibold shadow-lg hover:opacity-90 transition-all"
            >
              {uploadLoading ? "⏳ Processing..." : "🚀 Upload & Summarize"}
            </button>
          </form>

          <p className="mt-4 text-sm text-gray-700">{uploadStatus}</p>

          {uploadSummary && (
            <div className="relative mt-6 bg-white rounded-xl shadow-lg p-6 text-gray-800 leading-relaxed">
              <h2 className="text-lg font-semibold mb-2">✨ Summary</h2>
              <pre className="whitespace-pre-wrap text-sm">{uploadSummary}</pre>

              {/* Floating copy button */}
              <button
                onClick={() => copySummary(uploadSummary)}
                className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full shadow-md text-xs"
              >
                📋 Copy
              </button>

              <div className="mt-4">
                <button
                  onClick={() => downloadSummaryPDF(uploadSummary)}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md text-sm"
                >
                  📥 Download PDF
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Tab */}
      {tab === "text" && (
        <div className="relative z-10 bg-white/70 backdrop-blur-md p-6 rounded-2xl shadow-lg w-full max-w-2xl mx-auto mb-10">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full p-3 border rounded-lg text-sm"
            placeholder="Paste article, lecture transcript or notes..."
          />
          <button
            onClick={handleTextSummarize}
            disabled={textLoading}
            className="mt-4 w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-blue-400 text-white font-semibold shadow-lg hover:opacity-90 transition-all"
          >
            {textLoading ? "⏳ Summarizing..." : "Summarize"}
          </button>
          {message && (
            <p className="mt-2 text-sm text-gray-600">
              {message}
              {countdown !== null && ` (${countdown}s)`}
            </p>
          )}

          {textSummary && (
            <div className="relative mt-6 bg-white rounded-xl shadow-lg p-6 text-gray-800 leading-relaxed">
              <h2 className="text-lg font-semibold mb-2">✨ Summary</h2>
              <pre className="whitespace-pre-wrap text-sm">{textSummary}</pre>

              {/* Floating copy button */}
              <button
                onClick={() => copySummary(textSummary)}
                className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full shadow-md text-xs"
              >
                📋 Copy
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 w-full py-6 bg-white/70 backdrop-blur-sm border-t border-gray-200 flex flex-col items-center text-sm text-gray-700">
        <span className="text-lg font-bold text-pink-500">✨ Summara</span>
        <p className="mb-3 italic text-gray-600">“Turn pages into clarity.”</p>
        <div className="flex space-x-6">
          <a
            href="https://www.linkedin.com/in/abhishekyadavwork"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-600 transition-colors"
          >
            <FaLinkedin size={20} />
          </a>
          <a
            href="https://github.com/konvictgit"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-600 transition-colors"
          >
            <FaGithub size={20} />
          </a>
          <a
            href="mailto:abhishek_yadav_work@outlook.com"
            className="hover:text-pink-600 transition-colors"
          >
            <FaEnvelope size={20} />
          </a>
          <a
            href="https://x.com/Abhishek__devop"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-pink-600 transition-colors"
          >
            <FaTwitter size={20} />
          </a>
        </div>
        <p className="mt-4 text-xs text-gray-400">
          © {new Date().getFullYear()} Summara. Built by Abhishek Yadav.
        </p>
      </footer>
    </div>
  );
}
