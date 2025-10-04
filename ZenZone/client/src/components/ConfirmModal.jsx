import React from 'react';
import './ConfirmModal.css';

function ConfirmModal({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="confirm-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div className="confirm-modal">
        <div className="confirm-header">
          <h5 id="confirm-modal-title" className="confirm-title">{title}</h5>
        </div>
        <div className="confirm-body">
          <p>{message}</p>
        </div>
        <div className="confirm-actions">
          <button type="button" className="btn-cancel" onClick={onCancel}>{cancelText}</button>
          <button type="button" className="btn-confirm" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
