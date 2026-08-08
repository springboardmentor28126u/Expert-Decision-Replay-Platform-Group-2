import {
  FileText,
  Scale,
  MessageSquare,
  ClipboardCheck,
  History,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  Archive,
  ArrowRight,
} from "lucide-react";
import Button from "../components/ui/Button";
import "../styles/landing.css";

const CAPABILITIES = [
  {
    icon: FileText,
    title: "Decision Management",
    description: "Create, track, and move decisions through a structured approval workflow, with supporting documents attached where needed.",
  },
  {
    icon: Scale,
    title: "Alternative Comparison",
    description: "Weigh options side-by-side with pros, cons, cost, and feasibility before committing.",
  },
  {
    icon: MessageSquare,
    title: "Discussion & Rationale",
    description: "Capture comments, meeting notes, file attachments, and reasoning tied to every decision.",
  },
  {
    icon: ClipboardCheck,
    title: "Approval Workflow",
    description: "Route decisions through multi-level approvals with clear accountability at every stage.",
  },
  {
    icon: History,
    title: "Version History",
    description: "Every edit is preserved — see exactly how a decision evolved, and who changed what.",
  },
  {
    icon: BarChart3,
    title: "Audit & Reports",
    description: "Full audit trails and organization-wide reporting for accountability and compliance.",
  },
];

const LIFECYCLE_STEPS = [
  {
    icon: FileText,
    label: "Draft",
    tone: "muted",
    description: "Capture the problem, context, and initial reasoning.",
  },
  {
    icon: Clock,
    label: "Under Review",
    tone: "warning",
    description: "Reviewers and stakeholders discuss, comment, and compare alternatives.",
  },
  {
    icon: CheckCircle2,
    secondaryIcon: XCircle,
    label: "Approved / Rejected",
    tone: "success",
    description: "A recorded outcome, either way, with the full rationale attached.",
  },
  {
    icon: Archive,
    label: "Archived",
    tone: "muted",
    description: "The complete record — decision, discussion, and history — preserved for later.",
  },
];

function Landing({ onLogin, onSignup }) {
  return (
    <div className="landing-wrapper">
      <nav className="landing-nav">
        <div className="landing-logo">
          <span className="landing-logo-mark" aria-hidden="true">E</span>
          <span className="landing-logo-name">EDRP</span>
        </div>
        <div className="landing-nav-actions">
          <Button variant="secondary" onClick={onLogin}>Sign In</Button>
          <Button variant="primary" onClick={onSignup}>Sign Up</Button>
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
          <div className="landing-hero-ctas">
            <Button variant="primary" size="md" className="landing-cta-btn" onClick={onSignup}>
              Get Started
              <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
            </Button>
            <Button variant="secondary" size="md" className="landing-cta-btn" onClick={onLogin}>
              Sign In
            </Button>
          </div>
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

      <section className="landing-section">
        <div className="landing-section-header">
          <p className="landing-section-eyebrow">Core Capabilities</p>
          <h2 className="landing-section-title">Everything a decision needs to stay accountable</h2>
        </div>
        <div className="landing-capabilities-grid">
          {CAPABILITIES.map((cap) => {
            const Icon = cap.icon;
            return (
              <div className="landing-capability-card" key={cap.title}>
                <div className="landing-capability-icon">
                  <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                </div>
                <h3>{cap.title}</h3>
                <p>{cap.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="landing-section landing-lifecycle">
        <div className="landing-section-header">
          <p className="landing-section-eyebrow">Why EDRP?</p>
          <h2 className="landing-section-title">Every decision moves through the same accountable lifecycle</h2>
          <p className="landing-section-subtitle">
            From the first draft to the final archived record, EDRP tracks who did what, when, and why —
            automatically.
          </p>
        </div>

        <div className="landing-lifecycle-row">
          {LIFECYCLE_STEPS.map((step, i) => {
            const Icon = step.icon;
            const SecondaryIcon = step.secondaryIcon;
            return (
              <div className="landing-lifecycle-step" key={step.label}>
                <div className={`landing-lifecycle-icon tone-${step.tone}`}>
                  <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
                  {SecondaryIcon && <SecondaryIcon size={20} strokeWidth={1.75} aria-hidden="true" className="landing-lifecycle-icon-secondary" />}
                </div>
                <p className="landing-lifecycle-label">{step.label}</p>
                <p className="landing-lifecycle-description">{step.description}</p>
                {i < LIFECYCLE_STEPS.length - 1 && <span className="landing-lifecycle-connector" aria-hidden="true" />}
              </div>
            );
          })}
        </div>
      </section>

      <section className="landing-final-cta">
        <h2>Ready to stop losing decisions?</h2>
        <p>Start capturing the reasoning behind every decision your team makes.</p>
        <Button variant="primary" size="md" className="landing-cta-btn" onClick={onSignup}>
          Get Started
          <ArrowRight size={16} strokeWidth={2.25} aria-hidden="true" />
        </Button>
      </section>

      <footer className="landing-footer">
        <span>EDRP — Expert Decision Replay Platform</span>
      </footer>
    </div>
  );
}

export default Landing;
