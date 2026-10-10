import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/client.js';
import AuthShell from '../components/AuthShell.jsx';
import Field from '../components/Field.jsx';
import PasswordInput from '../components/PasswordInput.jsx';
import { passwordScore, validateSignUp } from '../utils/validators.js';

export default function SignUp() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', mobile: '', password: '' });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => {
    const value = key === 'mobile' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');

    const found = validateSignUp(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    setBusy(true);
    try {
      await authApi.register({
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile,
        password: form.password,
      });
      navigate('/signin', { replace: true, state: { registered: form.email.trim() } });
    } catch (err) {

        if (err.fields && Object.keys(err.fields).length) setErrors(err.fields);
      else setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const score = passwordScore(form.password);

  return (
       <AuthShell
      label="Buyer Ledger signup"
      heading="Get started."
      lead="Create your account, then upload a CSV or Excel file and search buyers right away."
      footer={
        <>
          <strong>Sign up in 4 simple steps.</strong>
          <span>Takes about 30 seconds.</span>
        </>
      }
    >
      <h2 className="form-title">Create your account</h2>
      <p className="form-sub">Enter your details to sign up.</p>
      {formError && <div className="notice bad" role="alert">{formError}</div>}

      <form onSubmit={submit} noValidate>
        <Field id="name" label="Full name*" error={errors.name}>
          <input
            id="name"
            className="inp"
            value={form.name}
            onChange={set('name')}
            autoComplete="name"
            autoFocus
            placeholder="Enter your full name"
            aria-invalid={errors.name ? 'true' : 'false'}
          />
        </Field>

        <Field id="email" label="Email*" error={errors.email}>
          <input
            id="email"
            type="email"
            className="inp"
            value={form.email}
            onChange={set('email')}
            autoComplete="email"
            placeholder="Enter your email"
            aria-invalid={errors.email ? 'true' : 'false'}
          />
        </Field>

        <Field id="mobile" label="Mobile Number*" error={errors.mobile}>
          <input
            id="mobile"
            inputMode="numeric"
            className="inp"
            value={form.mobile}
            onChange={set('mobile')}
            autoComplete="tel"
            placeholder="Enter your mobile number"
            aria-invalid={errors.mobile ? 'true' : 'false'}
          />
        </Field>

        <Field
          id="password"
          label="Password*"
          error={errors.password}
          hint="8 to 72 characters. Mix letters, numbers and symbols for a stronger password."
        >
          <PasswordInput
            id="password"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            invalid={!!errors.password}
            placeholder="At least 8 characters"
          />
          <div className="meter" data-score={score} aria-hidden="true"><span /><span /><span /><span /></div>
        </Field>

        <button type="submit" className="btn-lg btn-yellow" disabled={busy}>
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <hr className="rule" />
      <p className="swap">Already have an account? <Link to="/signin" className="textlink">Sign in</Link></p>
    </AuthShell>
  );
}