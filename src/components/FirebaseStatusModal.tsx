import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { testFirestoreConnection } from '../services/firebaseService';
import { Button } from './Button';
import { ServerIcon, CloseIcon, ZapIcon } from './Icons';

interface FirebaseStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentParticipantEmail?: string;
}

export const FirebaseStatusModal: React.FC<FirebaseStatusModalProps> = ({
  isOpen,
  onClose,
  currentParticipantEmail,
}) => {
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

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

  const modalContent = (
    <div className="ts-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ts-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ts-modal-header">
          <div className="ts-modal-header__brand">
            <div className="ts-modal-header__icon-badge" aria-hidden="true">
              <ServerIcon size={18} />
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
            <CloseIcon size={18} />
          </button>
        </div>

        <div className="ts-modal-body">
          <p className="ts-modal-desc">
            Registration is saved as one participant document, and each completed booth is saved as one booth document. Registration and booth progress are also cached on this device.
          </p>

          <div className="ts-sync-destination-card">
            <div className="ts-sync-dest-row">
              <span className="ts-sync-dest-label">Connected Project:</span>
              <span className="ts-sync-dest-value ts-sync-dest-repo">{projectId || 'tech-summit-2026-c9d17'}</span>
            </div>

            <div className="ts-sync-dest-summary">
              <span className="ts-sync-summary-title">Active Firestore Collections:</span>
              <div className="ts-sync-chips">
                <span className="ts-chip">📁 participants/{'{email}'} + booths/{'{boothNum}'}</span>
              </div>
            </div>

            {currentParticipantEmail && (
              <div style={{ marginTop: '8px', fontSize: '12.5px', color: 'var(--success)' }}>
                Active Passport Records: <strong>participants/{currentParticipantEmail.toLowerCase()}/booths/*</strong>
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
              {status === 'testing' ? 'Pinging Firestore...' : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <ZapIcon size={16} /> Test Connection
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
};
