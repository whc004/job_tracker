import React, { useEffect, useState } from 'react';
import { TIMEZONE_OPTIONS } from '../../shared-constants';

const SettingsModal = ({
  open,
  onClose,
  noResponseDays,
  setNoResponseDays,
  userTimezone,
  setUserTimezone,
}) => {
  const [days, setDays] = useState(noResponseDays ?? 14);
  const [timezone, setTimezone] = useState(
    userTimezone || localStorage.getItem('jt_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone
  );

  useEffect(() => {
    setDays(noResponseDays ?? 14);
  }, [noResponseDays, open]);

  useEffect(() => {
    setTimezone(userTimezone || localStorage.getItem('jt_timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, [userTimezone, open]);

  if (!open) return null;

  const handleSave = () => {
    // persist “No Response after N days”
    setNoResponseDays(days);
    localStorage.setItem('jt_noResponseDays', String(days));

    // persist timezone
    setUserTimezone(timezone);
    localStorage.setItem('jt_timezone', timezone);

    onClose();
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Settings</h3>
          <button onClick={onClose} style={styles.iconBtn}>✖</button>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          {/* Auto-mark No Response */}
          <div>
            <label style={styles.label}>Auto-mark "No Response" after N days (on load)</label>
            <input
              type="number"
              min={1}
              style={styles.input}
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 1)}
            />
            <p style={styles.hint}>
              When you open the dashboard, any "Applied" older than N days becomes "No Response".
            </p>
          </div>

          {/* Timezone */}
          <div>
            <label style={styles.label}>Your Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              style={{ ...styles.input, width: '100%' }}
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label} ({tz.offset})
                </option>
              ))}
            </select>
            <p style={styles.hint}>
              Dates are stored in UTC on the server and shown here in your timezone.
            </p>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.primaryBtn} onClick={handleSave}>💾 Save</button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999 },
  modal: { width: 'min(560px, 96vw)', background: '#fff', borderRadius: 16, padding: 24 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  iconBtn: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' },
  label: { display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 },
  input: { padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none' },
  hint: { color: '#6b7280', margin: '6px 0 0', fontSize: 12, lineHeight: 1.5 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginTop: 24 },
  cancelBtn: { padding: '10px 18px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  primaryBtn: { padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
};

export default SettingsModal;
