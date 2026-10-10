export default function AuthShell({ label, heading, lead, footer, children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <section className="auth-left">
          <span className="auth-pill">{label}</span>
          <div className="auth-copy">
            <h1>{heading}</h1>
            <p>{lead}</p>
          </div>
          {footer && <div className="auth-foot">{footer}</div>}
        </section>
        <section className="auth-right">
          <div className="auth-form">{children}</div>
        </section>
      </div>
    </div>
  );
}