interface LandingProps {
  onBlank: () => void
  onChildVaccination: () => void
  onAttendance: () => void
  onSiteApproval: () => void
}

export function Landing({
  onBlank,
  onChildVaccination,
  onAttendance,
  onSiteApproval,
}: LandingProps) {
  return (
    <div className="landing">
      <header className="landing-brand">
        <div className="brand-mark">AIBA</div>
        <p className="brand-promise">Business Understanding Engine</p>
      </header>

      <section className="landing-hero">
        <h1>Before you build software, confirm what the business actually needs.</h1>
        <p className="landing-lead">
          Describe how work happens. AIBA interprets it into a functional model you can see,
          challenge, correct, and confirm — Flow and Functional Preview stay in sync.
        </p>
        <p className="landing-not">
          Not an app generator. Not a questionnaire. Not a Figma clone.
        </p>
      </section>

      <section className="landing-actions">
        <button type="button" className="btn-primary" onClick={onBlank}>
          Start a new process
        </button>
        <button type="button" className="btn-secondary" onClick={onChildVaccination}>
          Open Child Vaccination example
        </button>
      </section>

      <section className="landing-domains">
        <h2>Same model, different domains</h2>
        <div className="domain-row">
          <button type="button" className="domain-card" onClick={onAttendance}>
            <strong>Attendance</strong>
            <span>Employee → Regularisation → context-based approver</span>
          </button>
          <button type="button" className="domain-card" onClick={onSiteApproval}>
            <strong>SAP → DAP</strong>
            <span>Handoff, exceptions, unresolved reject destinations</span>
          </button>
          <button type="button" className="domain-card" onClick={onChildVaccination}>
            <strong>Child Healthcare</strong>
            <span>Search → Workspace → Schedule → Administer</span>
          </button>
        </div>
      </section>

      <section className="landing-loop">
        <ol>
          <li>SAY</li>
          <li>SEE</li>
          <li>CHALLENGE</li>
          <li>CORRECT</li>
          <li>CONFIRM</li>
          <li>FREEZE</li>
        </ol>
      </section>
    </div>
  )
}
