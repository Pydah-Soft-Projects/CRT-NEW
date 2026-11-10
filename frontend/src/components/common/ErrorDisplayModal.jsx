import React from 'react';
import { X, AlertCircle, AlertTriangle } from 'lucide-react';

const ErrorDisplayModal = ({ isOpen, onClose, errors, title = "Upload Errors" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--surface,#FFFFFF)] border border-[var(--border,#DCEBF2)] rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-[var(--warning,#C18120)]" />
            <h2 className="text-xl font-bold text-[var(--text-primary,#183040)]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted,#7D96A4)] hover:text-[var(--text-primary,#183040)] text-xl"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-[var(--text-secondary,#486273)]">
            The following errors were encountered during the upload process:
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-[var(--danger-light,rgba(201,76,76,0.12))] border border-[var(--danger,#C94C4C)]/30 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-[var(--danger,#C94C4C)] mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-[var(--danger,#C94C4C)] font-medium">{error}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplayModal; 