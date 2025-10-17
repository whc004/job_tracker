import React, { useState, useEffect } from 'react';
import { WORK_ARRANGEMENT_OPTIONS , STATUS_OPTIONS, PRIORITY_OPTIONS, JOB_STATUS , STATUS_COLORS } from '../../shared-constants'; 
import { YMD , formatDateInTimezone } from '../helpers/default';

const JobDetailModal = ({ open, job, userTimezone , onClose, onSave, onDelete }) => {
  const [form, setForm] = useState(null);

  useEffect(() => {
    if (open && job) {
      setForm({
        position: job.position || '',
        company: job.company || '',
        location: job.location || '',
        salary: job.salary || '',
        status: job.status || 'Applied',
        workArrangement: job.workArrangement || '',
        priority: job.priority || 'Normal',
        dateApplied: job.dateApplied ? new Date(job.dateApplied).toISOString() : '',
        jobUrl: job.jobUrl || '',
        contactPerson: job.contactPerson || '',
        notes: job.notes || '',
        technicalDetails: Array.isArray(job.technicalDetails) ? job.technicalDetails.join('; ') : (job.technicalDetails || '')
      });
    }
  }, [open, job]);

  if (!open || !job || !form) return null;

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleNextStep = () => {
    const currentStatus = form.status;
    let nextStatus = currentStatus;

    if (currentStatus === JOB_STATUS.APPLIED) {
      nextStatus = JOB_STATUS.INTERVIEW_ROUND_1;
    } else if (currentStatus === JOB_STATUS.INTERVIEW_ROUND_1) {
      nextStatus = JOB_STATUS.INTERVIEW_ROUND_2;
    } else if (currentStatus === JOB_STATUS.INTERVIEW_ROUND_2) {
      nextStatus = JOB_STATUS.INTERVIEW_ROUND_3;
    } else if (currentStatus === JOB_STATUS.INTERVIEW_ROUND_3) {
      nextStatus = JOB_STATUS.INTERVIEW_ROUND_4;
    } else if (currentStatus === JOB_STATUS.INTERVIEW_ROUND_4) {
      nextStatus = JOB_STATUS.INTERVIEW_ROUND_5;
    } else if (currentStatus === JOB_STATUS.INTERVIEW_ROUND_5) {
      nextStatus = JOB_STATUS.OFFER;
    }

    if (nextStatus !== currentStatus) {
      set('status', nextStatus);
    }
  };

  const handleMarkAsOffer = () => {
    set('status', JOB_STATUS.OFFER);
  };

  const handleMarkAsRejected = () => {
    if (window.confirm('Mark this application as Rejected?')) {
      set('status', JOB_STATUS.REJECTED);
    }
  };

  const canMoveNext = ![JOB_STATUS.OFFER, JOB_STATUS.REJECTED, JOB_STATUS.NO_RESPONSE].includes(form.status);

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Edit Application</h3>
          <button onClick={onClose} style={styles.iconBtn}>✖</button>
        </div>

        <div style={styles.grid}>
          <Field label="Position">
            <input style={styles.input} value={form.position} onChange={e => set('position', e.target.value)} />
          </Field>
          <Field label="Company">
            <input style={styles.input} value={form.company} onChange={e => set('company', e.target.value)} />
          </Field>
          <Field label="Location">
            <input style={styles.input} value={form.location} onChange={e => set('location', e.target.value)} />
          </Field>
          <Field label="Salary">
            <input style={styles.input} value={form.salary} onChange={e => set('salary', e.target.value)} />
          </Field>

          <Field label="Status">
            <select style={styles.input} value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(status => (<option key={status} value={status}>{status}</option>))}
            </select>
          </Field>

          <Field label="Priority">
            <select style={styles.input} value={form.priority} onChange={e => set('priority', e.target.value)}>
              {PRIORITY_OPTIONS.map(priority => (<option key={priority} value={priority}>{priority}</option>))}
            </select>
          </Field>

          <Field label="Work Arrangement">
            <select style={styles.input} value={form.workArrangement} onChange={e => set('workArrangement', e.target.value)}>
              {WORK_ARRANGEMENT_OPTIONS.map(priority => (<option key={priority} value={priority}>{priority}</option>))}
            </select>
          </Field>

          <Field label="Job URL">
            <input style={styles.input} value={form.jobUrl} onChange={e => set('jobUrl', e.target.value)} />
          </Field>

          <Field label="Contact Person">
            <input style={styles.input} value={form.contactPerson} onChange={e => set('contactPerson', e.target.value)} />
          </Field>

          <Field label="Skills (semicolon ; separated)">
            <input style={styles.input} value={form.technicalDetails} onChange={e => set('technicalDetails', e.target.value)} />
          </Field>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={styles.label}>Notes</label>
            <textarea rows={5} style={{ ...styles.input, resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} />
          </div>
        </div>

        <div style={styles.footer}>
          <a href={job.jobUrl} target="_blank" rel="noreferrer" style={styles.linkBtn}>🔗 Open Listing</a>
          <div style={{ flex: 1 }} />
          
          <button
            style={{ ...styles.dangerBtn }}
            onClick={() => onDelete(job)}
            title="Delete this job"
          >
            🗑 Delete
          </button>

          <button
            style={{
              ...styles.nextStepBtn,
              ...(canMoveNext ? {} : styles.disabledBtn)
            }}
            onClick={handleNextStep}
            disabled={!canMoveNext}
            title="Move to next step in pipeline"
          >
            ➡️ Next Step
          </button>

          <button
            style={styles.offerBtn}
            onClick={handleMarkAsOffer}
            title="Mark as Offer"
          >
            🎉 Offer
          </button>

          <button
            style={styles.rejectBtn}
            onClick={handleMarkAsRejected}
            title="Mark as Rejected"
          >
            ❌ Reject
          </button>

          <button
            style={{
              ...styles.statusChip,
              background: STATUS_COLORS[form.status] + '20',
              color: STATUS_COLORS[form.status]
            }}
            disabled
          >
            {form.status}{job.dateApplied && ` • Applied ${YMD(formatDateInTimezone(form.dateApplied,userTimezone))}`}
          </button>
          
          <button
            style={styles.primaryBtn}
            onClick={() => {
              const updates = {
                ...form,
                technicalDetails: form.technicalDetails
                  ? form.technicalDetails.split(/;/).map(s => s.trim()).filter(Boolean)
                  : [],
                dateApplied: form.dateApplied ? new Date(form.dateApplied) : null
              };
              onSave(job, updates);
            }}
          >
            💾 Save
          </button>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label style={styles.label}>{label}</label>
    {children}
  </div>
);

const styles = {
  backdrop: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 9999
  },
  modal: {
    width: 'min(920px, 96vw)', background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.35)'
  },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  iconBtn: { background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 8 },
  label: { display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6, fontWeight: 600 },
  input: { width: '100%', padding: '10px 12px', border: '2px solid #e5e7eb', borderRadius: 10, fontSize: 14, outline: 'none' },
  footer: { display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, flexWrap: 'wrap' },
  primaryBtn: { padding: '10px 18px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 700 },
  dangerBtn: { padding: '10px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  linkBtn: { padding: '8px 12px', background: '#f3f4f6', color: '#111827', borderRadius: 10, textDecoration: 'none', fontWeight: 600 },
  statusChip: { padding: '8px 12px', borderRadius: 999, border: 'none', fontSize: 13 },
  nextStepBtn: { padding: '10px 14px', background: '#8b5cf6', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  offerBtn: { padding: '10px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  rejectBtn: { padding: '10px 14px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 },
  disabledBtn: { opacity: 0.5, cursor: 'not-allowed' }
};

export default JobDetailModal;