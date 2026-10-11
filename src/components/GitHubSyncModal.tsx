import React, { useState, useEffect } from 'react';
import {
  getResultRepo,
  getGitHubToken,
  saveGitHubToken,
  testGitHubConnection,
} from '../services/resultRepoService';
import { Button } from './Button';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEntId?: string;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  currentEntId,
}) => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setToken(getGitHubToken());
      setStatus('idle');
      setStatusMsg('');
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const repo = getResultRepo();

  const handleSave = () => {
    saveGitHubToken(token);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleTest = async () => {
    handleSave();
    setStatus('testing');
    setStatusMsg('Testing connection to GitHub repository...');
    const res = await testGitHubConnection();
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
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--ts-text-primary, #fff)' }}>
            GitHub Results Repository Sync
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
          Registration records and booth test scores automatically synchronize to the target repository as a verified database.
        </p>

        <div style={{ marginBottom: '1rem', background: 'rgba(255,255,255,0.04)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--ts-text-muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Target Repository
          </div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#38bdf8', marginTop: '0.25rem', wordBreak: 'break-all' }}>
            {repo}
          </div>
          {currentEntId && (
            <div style={{ fontSize: '0.8rem', color: '#a78bfa', marginTop: '0.35rem' }}>
              Current Folder: <code>results/{currentEntId.toUpperCase()}/</code>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem', color: 'var(--ts-text-primary, #fff)' }}>
            GitHub Personal Access Token (PAT)
          </label>
          <input
            type="password"
            placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(0,0,0,0.3)',
              color: '#fff',
              fontSize: '0.9rem',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--ts-text-muted, #94a3b8)', marginTop: '0.35rem' }}>
            Token requires <code>repo</code> or <code>contents:write</code> permission to push files to <code>results/{currentEntId || '<EntID>'}/</code>.
          </div>
        </div>

        {statusMsg && (
          <div
            style={{
              padding: '0.65rem 0.85rem',
              borderRadius: '6px',
              fontSize: '0.825rem',
              marginBottom: '1rem',
              background:
                status === 'success'
                  ? 'rgba(34, 197, 94, 0.15)'
                  : status === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'rgba(56, 189, 248, 0.15)',
              color:
                status === 'success'
                  ? '#4ade80'
                  : status === 'error'
                  ? '#f87171'
                  : '#38bdf8',
              border:
                status === 'success'
                  ? '1px solid rgba(34, 197, 94, 0.3)'
                  : status === 'error'
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            {statusMsg}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <Button variant="ghost" onClick={handleSave}>
            {saved ? '✓ Saved!' : 'Save Token'}
          </Button>
          <Button variant="primary" onClick={handleTest} disabled={status === 'testing'}>
            {status === 'testing' ? 'Testing...' : 'Test Connection'}
          </Button>
        </div>
      </div>
    </div>
  );
};
