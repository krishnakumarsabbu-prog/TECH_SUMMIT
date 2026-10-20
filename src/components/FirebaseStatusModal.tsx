import React, { useState } from 'react';
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
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setStatus('testing');
    setStatusMsg('Testing read/write connectivity to Firestore collection `_connection_test`...');
    try {
      const res = await testFirestoreConnection();
      if (res.success) {
        setStatus('success');
        setStatusMsg(res.message);
      } else {
        setStatus('error');
        setStatusMsg(res.message);
      }
    } catch (err: any) {
      setStatus('error');
      setStatusMsg(err.message || 'Error executing ping test.');
    }
  };

  return (
    <div className="ts-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ts-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ts-modal-header">
          <div className="ts-modal-header__brand">
            <div className="ts-modal-header__icon-badge" aria-hidden="true">
              🔥
            </div>
            <div>
              <div className="ts-modal-eyebrow">DATABASE DIAGNOSTICS</div>
              <h2 className="ts-modal-title">Firebase Firestore</h2>
            </div>
          </div>
          <button
            type="button"
            className="ts-modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div className="ts-modal-body">
          <p className="ts-modal-desc">
            All summit attendee registrations, quiz scores, and passport milestones are saved directly to Firebase Firestore collections.
          </p>

          <div className="ts-sync-destination-card">
            <div className="ts-sync-dest-row">
              <span className="ts-sync-dest-label">Connected Project:</span>
              <span className="ts-sync-dest-value ts-sync-dest-repo">{projectId || 'tech-summit-2026-c9d17'}</span>
            </div>

            <div className="ts-sync-dest-summary">
              <span className="ts-sync-summary-title">Active Firestore Collections:</span>
              <div className="ts-sync-chips">
                <span className="ts-chip">📁 participants/{'{entId}'}</span>
                <span className="ts-chip">📁 participants/{'{entId}'}/booths/{'{boothNum}'}</span>
                <span className="ts-chip">📁 submissions/{'{submissionId}'}</span>
              </div>
            </div>

            {currentEntId && (
              <div style={{ marginTop: '8px', fontSize: '12.5px', color: 'var(--success)' }}>
                Active Session Document: <strong>participants/{currentEntId.toUpperCase()}</strong>
              </div>
            )}
          </div>

          {status !== 'idle' && (
            <div className={`ts-modal-alert ts-modal-alert--${status === 'success' ? 'success' : status === 'error' ? 'error' : 'info'}`}>
              <div className="ts-modal-alert-header">
                <span className="ts-alert-icon">
                  {status === 'testing' ? '⏳' : status === 'success' ? '✓' : '✕'}
                </span>
                <strong>
                  {status === 'testing' ? 'Testing Connection...' : status === 'success' ? 'Connection Successful!' : 'Connection Warning'}
                </strong>
              </div>
              <div className="ts-modal-alert-msg">{statusMsg}</div>
            </div>
          )}

          <div className="ts-modal-actions">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleTestConnection}
              disabled={status === 'testing'}
            >
              {status === 'testing' ? 'Pinging Firestore...' : '⚡ Test Connection'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
