import { useState } from 'react';

export default function PasswordInput({ id, value, onChange, invalid, ...rest }) {
  const [show, setShow] = useState(false);

  return (
    <div className="pw">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        className="inp"
        value={value}
        onChange={onChange}
        aria-invalid={invalid ? 'true' : 'false'}
        {...rest}
      />
      <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
        {show ? 'Hide' : 'Show'}
      </button>
    </div>
  );
}