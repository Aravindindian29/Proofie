export default function CrushLoader({ text = 'Loading...' }) {
  return (
    <div className="proofie-loader-wrap">
      <div className="proofie-loader">
        <div className="proofie-logo">
          <div className="logo-p">P</div>
          <div className="logo-glow"></div>
        </div>
        <div className="loading-dots">
          <div className="dot dot-1"></div>
          <div className="dot dot-2"></div>
          <div className="dot dot-3"></div>
        </div>
      </div>
      {text && <p className="proofie-loader-text">{text}</p>}
    </div>
  )
}
