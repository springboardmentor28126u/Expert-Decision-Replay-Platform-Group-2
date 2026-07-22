import "./landing.css";

function Landing({ onLogin, onSignup }) {
  return (
    <div className="landing-wrapper">
      <nav className="landing-nav">
        <span className="landing-logo">EDRP</span>
        <div className="landing-nav-actions">
          <button className="landing-nav-btn" onClick={onLogin}>Sign In</button>
          <button className="landing-nav-btn-solid" onClick={onSignup}>Sign Up</button>
        </div>
      </nav>

      <main className="landing-hero">
        <div className="landing-hero-text">
          <p className="landing-eyebrow">Expert Decision Replay Platform</p>
          <h1 className="landing-title">
            Every decision has a story.<br />Stop losing it.
          </h1>
          <p className="landing-subtitle">
            Record the reasoning, alternatives, and outcomes behind every major
            decision — so your organization never has to ask "why did we do this?" twice.
          </p>
          <button className="landing-cta" onClick={onSignup}>Get Started</button>
        </div>

        <div className="landing-hero-visual" aria-hidden="true">
          <svg className="flow-svg" viewBox="0 0 360 420" fill="none">
            <path className="flow-path flow-path-1" d="M 180 50 L 180 150" />
            <path className="flow-path flow-path-2" d="M 180 150 L 100 240" />
            <path className="flow-path flow-path-3" d="M 180 150 L 260 240" />
            <path className="flow-path flow-path-4" d="M 100 240 L 100 330" />
          </svg>

          <div className="flow-node flow-node-draft" style={{ top: '20px', left: '145px' }}>
            <span className="flow-dot"></span>Draft
          </div>
          <div className="flow-node flow-node-review" style={{ top: '128px', left: '112px' }}>
            <span className="flow-dot"></span>Under Review
          </div>
          <div className="flow-node flow-node-alt" style={{ top: '218px', left: '38px' }}>
            <span className="flow-dot"></span>Rejected
          </div>
          <div className="flow-node flow-node-approved" style={{ top: '218px', left: '210px' }}>
            <span className="flow-dot"></span>Approved
          </div>
          <div className="flow-node flow-node-archived" style={{ top: '308px', left: '38px' }}>
            <span className="flow-dot"></span>Archived
          </div>
        </div>
      </main>

      <section className="landing-features">
        <div className="landing-feature-card">
          <span className="landing-feature-mark">01</span>
          <h3>Decision Management</h3>
          <p>Create, track, and move decisions through a structured approval workflow.</p>
        </div>
        <div className="landing-feature-card">
          <span className="landing-feature-mark">02</span>
          <h3>Alternative Comparison</h3>
          <p>Weigh options side-by-side with pros, cons, cost, and feasibility.</p>
        </div>
        <div className="landing-feature-card">
          <span className="landing-feature-mark">03</span>
          <h3>Discussion &amp; Rationale</h3>
          <p>Capture comments, meeting notes, and reasoning tied to every decision.</p>
        </div>
      </section>
    </div>
  );
}

export default Landing;