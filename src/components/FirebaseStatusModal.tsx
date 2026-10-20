import React, { useState, useEffect } from 'react';
import { testFirestoreConnection } from '../services/firebaseService';
import { Button } from './Button';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEntId?: string;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({
  isOpen,
  onClose,
  currentEntId,
}) => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [projectId, setProjectId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStatus('idle');
      setStatusMsg('');
      handleTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    setStatus('testing');
    setStatusMsg('Testing connection to Firebase Firestore...');
    const res = await testFirestoreConnection();
    setProjectId(res.projectId);
    if (res.success) {
      setStatus('success');
      setStatusMsg(res.message);
    } else {
      setStatus('error');
      setStatusMsg(res.message);
    }
  };

  return (
    <div className="ts-qr-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="ts-qr-modal-content"
        style={{ maxWidth: '520px', textAlign: 'left' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--ts-text-primary, #fff)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🔥 Firebase Firestore Database
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--ts-text-muted, #94a3b8)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--ts-text-muted, #94a3b8)', marginBottom: '1rem', lineHeight: '1.5' }}>
          All summit attendee registrations, quiz scores, and passport statuses are stored exclusively in Firebase Firestore.
        </p>

        <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.04)', padding: '0.85rem 1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--ts-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Connected Firebase Project
          </div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#38bdf8', marginTop: '0.25rem', wordBreak: 'break-all' }}>
            {projectId || 'tech-summit-2026-c9d17'}
          </div>

          <div style={{ marginTop: '0.75rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.8rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
              <span style={{ color: 'var(--ts-text-muted, #94a3b8)' }}>Collection 1:</span>
              <div style={{ color: '#a78bfa', fontWeight: 600 }}>participants/{'{entId}'}</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '4px' }}>
              <span style={{ color: 'var(--ts-text-muted, #94a3b8)' }}>Collection 2:</span>
              <div style={{ color: '#a78bfa', fontWeight: 600 }}>submissions/{'{subId}'}</div>
            </div>
          </div>

          {currentEntId && (
            <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.75rem' }}>
              Active Attendee Document: <code>participants/{currentEntId.toUpperCase()}</code>
            </div>
          )}
        </div>

        {status !== 'idle' && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              marginBottom: '1rem',
              background:
                status === 'testing'
                  ? 'rgba(56, 189, 248, 0.1)'
                  : status === 'success'
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${
                status === 'testing'
                  ? '#38bdf8'
                  : status === 'success'
                  ? '#22c55e'
                  : '#ef4444'
              }`,
              color:
                status === 'testing'
                  ? '#38bdf8'
                  : status === 'success'
                  ? '#22c55e'
                  : '#ef4444',
            }}
          >
            {status === 'testing' && '⏳ '}
            {status === 'success' && '✓ '}
            {status === 'error' && '✕ '}
            {statusMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            onClick={handleTest}
            disabled={status === 'testing'}
          >
            {status === 'testing' ? 'Testing...' : 'Test Database Connection'}
          </Button>
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
