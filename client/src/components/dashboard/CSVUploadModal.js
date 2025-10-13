import React, { useState } from 'react';
import Papa from 'papaparse';

const CSVUploadModal = ({ open, onClose, onUpload }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  if (!open) return null;

  const handleFile = (file) => {
    setBusy(true);
    setErr('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          onUpload(results.data); // send raw rows to parent to normalize + POST
          onClose();
        } catch (e) {
          console.error(e);
          setErr('Upload failed. Check file format.');
        } finally {
          setBusy(false);
        }
      },
      error: (e) => {
        console.error(e);
        setErr('Could not parse CSV.');
        setBusy(false);
      }
    });
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Import from CSV</h3>
          <button onClick={onClose} style={styles.iconBtn}>✖</button>
        </div>

        <p style={{ color: '#4b5563' }}>
          Expected headers: <code>company, position, location, status, workArrangement, dateApplied, jobUrl, priority, notes, technicalDetails</code>
        </p>

        <label style={styles.uploadBtn}>
          {busy ? 'Uploading…' : 'Choose CSV file'}
          <input type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} disabled={busy} />
        </label>

        {err && <div style={styles.error}>{err}</div>}
      </div>
    </div>
  );
};

const styles = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 },
  modal: { width: 'min(560px, 96vw)', background: '#fff', borderRadius: 16, padding: 20 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  iconBtn: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' },
  uploadBtn: { display: 'inline-block', padding: '10px 16px', background: '#10b981', color: '#fff', borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
  error: { marginTop: 10, background: '#fee2e2', color: '#b91c1c', padding: 8, borderRadius: 8 }
};

export default CSVUploadModal;
