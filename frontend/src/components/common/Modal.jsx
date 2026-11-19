import React from 'react';

const Modal = ({ title, children, onClose, isOpen = true, size = 'lg' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-5xl',
    '2xl': 'max-w-6xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className={`bg-[var(--surface,#FFFFFF)] border border-[var(--border,#DCEBF2)] rounded-2xl shadow-2xl ${sizeClasses[size] || sizeClasses.lg} w-full max-h-[90vh] mx-4 relative animate-fade-in flex flex-col`}>
        <div className="flex justify-between items-center border-b border-[var(--border,#DCEBF2)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--text-primary,#183040)]">{title}</h2>
          <button onClick={onClose} className="text-[var(--text-muted,#7D96A4)] hover:text-[var(--text-primary,#183040)] text-2xl font-bold focus:outline-none">&times;</button>
        </div>
        <div className="px-6 py-4 overflow-y-auto text-[var(--text-primary,#183040)]" style={{maxHeight: 'calc(90vh - 64px)'}}>{children}</div>
      </div>
    </div>
  );
};

export default Modal; 