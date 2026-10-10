import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { buyersApi } from '../api/client.js';

const PAGE_SIZE = 10;
const money = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });

export default function Buyers() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(input.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [input]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    buyersApi
      .list({ search: query, page, limit: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query, page]);

  const buyers = data?.buyers || [];
  const pagination = data?.pagination;
  const totals = data?.totals;
  const start = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const end = start + buyers.length - 1;

  return (
    <section>
      <h1>Buyers</h1>

      {totals && (
        <div className="tiles">
          <div className="tile"><span>Buyers</span><b>{pagination.total}</b></div>
          <div className="tile"><span>Total invoiced</span><b>{money.format(totals.invoice)}</b></div>
          <div className="tile"><span>Total paid</span><b>{money.format(totals.paid)}</b></div>
          <div className="tile"><span>Total due</span><b>{money.format(totals.due)}</b></div>
        </div>
      )}

      <div className="searchbar">
        <label htmlFor="search" className="sr-only">Search buyers</label>
        <input
          id="search"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by name, email or mobile"
        />
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {data && buyers.length === 0 && !loading && (
        <div className="card">
          {query ? (
            <p>No buyers match “{query}”.</p>
          ) : (
            <p>No buyers yet. <Link to="/dashboard/upload">Upload a file</Link> to get started.</p>
          )}
        </div>
      )}

      {buyers.length > 0 && (
        <div className={`table-wrap${loading ? ' dim' : ''}`} aria-busy={loading}>
          <table className="buyers-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Address</th>
                <th className="num">Invoice</th>
                <th className="num">Paid</th>
                <th className="num">Due</th>
              </tr>
            </thead>
            <tbody>
              {buyers.map((b) => (
                <tr key={b.id}>
                  <td data-label="Name">{b.name}</td>
                  <td data-label="Email">{b.email}</td>
                  <td data-label="Mobile">{b.mobile}</td>
                  <td data-label="Address">{b.address || '—'}</td>
                  <td data-label="Invoice" className="num">{money.format(b.totalInvoice)}</td>
                  <td data-label="Paid" className="num">{money.format(b.totalPaid)}</td>
                  <td data-label="Due" className="num">{money.format(b.totalDue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.total > 0 && (
        <div className="pagination">
          <span className="muted">Showing {start}–{end} of {pagination.total}</span>
          <div className="row">
            <button className="btn" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.totalPages}</span>
            <button
              className="btn"
              disabled={page >= pagination.totalPages || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </section>
  );
}