import React from 'react';

function ConfirmModal({ open, title, message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel }) {
  if (!open) return null;
  return (
    <div className="confirm-overlay" style={{position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1050}}>
      <div className="confirm-modal" style={{background:'#fff', width:'92%', maxWidth:520, borderRadius:12, boxShadow:'0 10px 30px rgba(0,0,0,0.2)'}}>
        <div style={{padding:'16px 20px', borderBottom:'1px solid #eee'}}>
          <h5 style={{margin:0}}>{title}</h5>
        </div>
        <div style={{padding:'16px 20px'}}>
          <p style={{margin:0, whiteSpace:'pre-wrap'}}>{message}</p>
        </div>
        <div style={{padding:'12px 20px', display:'flex', justifyContent:'flex-end', gap:8, borderTop:'1px solid #eee'}}>
          <button type="button" className="btn btn-light" onClick={onCancel}>{cancelText}</button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
