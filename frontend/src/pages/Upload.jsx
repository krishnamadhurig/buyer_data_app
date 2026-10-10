import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { buyersApi } from '../api/client.js';

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ['.csv', '.xls', '.xlsx'];

function checkFile(file) {
  const dot = file.name.lastIndexOf('.');
  const ext = dot === -1 ? '' : file.name.slice(dot).toLowerCase();
  if (!ALLOWED.includes(ext)) return 'Only .csv, .xls and .xlsx files are allowed.';
  if (file.size === 0) return 'The file is empty.';
  if (file.size > MAX_SIZE) return 'File is too large. The maximum size is 5 MB.';
  return '';
}

function formatSize(bytes) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export default function Upload() {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);

  const clearInput = () => {
    if (inputRef.current) inputRef.current.value = '';
  };

  const choose = (picked) => {
    setResult(null);
    if (!picked) return;
    const problem = checkFile(picked);
    if (problem) {
      setFile(null);
      setError(problem);
      clearInput();
      return;
    }
    setError('');
    setFile(picked);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!file) return setError('Choose a file first.');

    setBusy(true);
    setError('');
    setResult(null);
    try {
      const data = await buyersApi.upload(file);
      setResult(data);
      setFile(null);
      clearInput();
    } catch (err) {
      setError(err.message);
      if (err.data?.errors) setResult({ skipped: err.data.skipped, errors: err.data.errors });
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    choose(e.dataTransfer.files[0]);
  };

  return (
    <section>
      <h1>Upload buyer data</h1>
      <p className="muted">Add buyers from a CSV or Excel file. Existing buyers (same email) are updated.</p>

      <form onSubmit={submit}>
        <label
          className={`dropzone${dragging ? ' drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xls,.xlsx"
            className="sr-only"
            onChange={(e) => choose(e.target.files[0])}
          />
          <strong>{file ? file.name : 'Choose a file or drop it here'}</strong>
          <span className="muted">{file ? formatSize(file.size) : '.csv, .xls or .xlsx, up to 5 MB'}</span>
        </label>

        {error && <p className="error" role="alert">{error}</p>}

        <button type="submit" className="btn primary" disabled={busy || !file}>
          {busy ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      <div className="card">
        <strong>Expected columns</strong>
        <p className="muted">
              Columns needed: Name, Email, Mobile, Total Invoice Amount, Total Amount Paid. Optional: Address, Total Amount Due.

        </p>
      </div>

      {result && (
        <div className="card" role="status">
          {result.saved !== undefined ? (
            <>
              <strong>Upload complete</strong>
              <div className="tiles">
                <div className="tile"><span>Rows in file</span><b>{result.totalRows}</b></div>
                <div className="tile"><span>Saved</span><b>{result.saved}</b></div>
                <div className="tile"><span>Skipped</span><b>{result.skipped}</b></div>
              </div>
              <Link to="/dashboard/buyers" className="btn primary">View buyers</Link>
            </>
          ) : (
            <strong>Nothing was saved</strong>
          )}

          {result.errors?.length > 0 && (
            <>
              <p className="muted">
                {result.skipped > result.errors.length
                  ? `Showing the first ${result.errors.length} of ${result.skipped} skipped rows.`
                  : 'These rows were skipped:'}
              </p>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Row</th><th>Problem</th></tr></thead>
                  <tbody>
                    {result.errors.map((item) => (
                      <tr key={item.row}>
                        <td>{item.row}</td>
                        <td>{item.messages.join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}