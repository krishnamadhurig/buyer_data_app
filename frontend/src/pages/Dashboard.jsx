import { useState } from 'react';
import { authApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [result, setResult] = useState('');

  const check = async () => {
    try {
      const data = await authApi.me();
      setResult(JSON.stringify(data.user));
    } catch (err) {
      setResult(err.message);
    }
  };

  return (
    <main className="container">
      <h1>Welcome, {user.name}</h1>
      <div className="row">
        <button className="btn" onClick={check}>Call /me</button>
        <button className="btn primary" onClick={logout}>Log out</button>
      </div>
      <p>{result}</p>
    </main>
  );
}