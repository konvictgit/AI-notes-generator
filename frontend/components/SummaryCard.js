// frontend/components/SummaryCard.js
export default function SummaryCard({ summary }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 16,
        border: "1px solid #e6e6e6",
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 8, color: "#0f172a" }}>
        ✨ Summary
      </div>
      <div style={{ whiteSpace: "pre-wrap", color: "#0b1220" }}>{summary}</div>
    </div>
  );
}
