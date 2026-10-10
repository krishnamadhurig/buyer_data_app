import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthShell from '../components/AuthShell.jsx';
import Field from '../components/Field.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { isValidIdentifier, normalizeIdentifier } from '../utils/identifier.js';

export default function SignIn() {
  const { login, notice } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const registered = location.state?.registered;
  const goBackTo = location.state?.from || '/dashboard';

  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState(registered || '');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const toPassword = (e) => {
    e.preventDefault();
    if (!identifier.trim()) return setErrors({ identifier: 'Enter your email or mobile number.' });
    if (!isValidIdentifier(identifier)) {
      return setErrors({ identifier: 'Enter a valid email or a 10 digit mobile number.' });
    }
    setErrors({});
    setFormError('');
    setStep(2);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!password) return setErrors({ password: 'Enter your password.' });
    setErrors({});
    setFormError('');
    setBusy(true);
    try {
      await login(normalizeIdentifier(identifier), password);
      navigate(goBackTo, { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  let banner = null;
  if (registered) banner = <div className="notice">Account created. Sign in to continue.</div>;
  else if (notice) banner = <div className="notice warn" role="status">{notice}</div>;
  else if (location.state?.from) banner = <div className="notice warn" role="status">Please sign in to open that page.</div>;

  return (
    <AuthShell
      label="Buyer Ledger sign in"
      heading="Welcome back."
      lead="Your uploads and buyer records are right where you left them."
    >
      {banner}
      {formError && <div className="notice bad" role="alert">{formError}</div>}

      {step === 1 ? (
        <form onSubmit={toPassword} noValidate>
          <Field id="identifier" label="Email ID / Mobile Number" error={errors.identifier}>
            <input
              id="identifier"
              className="inp"
              value={identifier}
              autoComplete="username"
              autoFocus
              placeholder="Enter email or mobile number"
              onChange={(e) => { setIdentifier(e.target.value); setErrors({}); }}
              aria-invalid={errors.identifier ? 'true' : 'false'}
            />
          </Field>
          <button type="submit" className={`btn-lg btn-blue${identifier.trim() ? '' : ' idle'}`}>
            Enter Password
          </button>
        </form>
      ) : (
        <form onSubmit={submit} noValidate>
          <div className="who-row">
            <span className="who-chip" title={identifier}>{identifier}</span>
            <button
              type="button"
              className="textlink"
              onClick={() => { setStep(1); setPassword(''); setFormError(''); }}
            >
              Change
            </button>
          </div>
          <Field id="password" label="Password" error={errors.password}>
            <PasswordInput
              id="password"
              value={password}
              autoFocus
              autoComplete="current-password"
              invalid={!!errors.password}
              onChange={(e) => { setPassword(e.target.value); setErrors({}); }}
            />
          </Field>
          <button type="submit" className="btn-lg btn-blue" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      )}

      <div className="or"><span>OR</span></div>
      <p className="swap">Don’t have an account? <Link to="/signup" className="textlink">Sign Up</Link></p>
    </AuthShell>
  );
}