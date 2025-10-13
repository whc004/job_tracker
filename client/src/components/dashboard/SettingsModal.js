import React, { useState, useEffect } from 'react';

const SettingsModal = ({ open, onClose, noResponseDays, setNoResponseDays }) => {
  const [days, setDays] = useState(noResponseDays ?? 14);

  useEffect(() => setDays(noResponseDays ?? 14), [noResponseDays, open]);

  if (!open) return null;

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Settings</h3>
          <button onClick={onClose} style={styles.iconBtn}>✖</button>
        </div>

        <div style={{ display: 'grid', gap: 14 }}>
          <label style={styles.label}>Auto-mark “No Response” after N days (on load)</label>
          <input
            type="number"
            min={1}
            style={styles.input}
            value={days}
            onChange={(e) => setDays(Number(e.target.value) || 1)}
          />
          <p style={{ color: '#6b7280', margin: 0 }}>
            When you open the dashboard, any “Applied” older than N days becomes “No Response”.
          </p>
        </div>

        <div style={styles.footer}>
          <div />
          <button
            style={styles.primaryBtn}
            onClick={() => {
              setNoResponseDays(days);
              localStorage.setItem('jt_noResponseDays', String(days));
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 },
  modal: { width: 'min(520px, 96vw)', background: '#fff', borderRadius: 16, padding: 20 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  iconBtn: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' },
  label: { fontSize: 12, fontWeight: 700, color: '#6b7280' },
  input: { padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none', width: 140 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  primaryBtn: { padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
};

export default SettingsModal;
