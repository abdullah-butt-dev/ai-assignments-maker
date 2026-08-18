export default function Logo({ compact = false }) {
  return <div className={`brand-logo ${compact ? "brand-logo-compact" : ""}`} aria-label="AI Assignment Maker">
    <span className="brand-logo-ai">AI</span><span className="brand-logo-name">Assignment Maker</span>
  </div>
}
