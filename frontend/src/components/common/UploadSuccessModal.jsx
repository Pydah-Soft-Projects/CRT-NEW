import React from 'react';
import { X, CheckCircle, Clipboard } from 'lucide-react';

const UploadSuccessModal = ({ isOpen, onClose, results, onCopyToClipboard }) => {
  if (!isOpen) return null;

  const { created_students, errors } = results;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--surface,#FFFFFF)] border border-[var(--border,#DCEBF2)] rounded-2xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-[var(--border,#DCEBF2)] pb-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary,#183040)]">Upload Results</h2>
          <button onClick={onClose} className="text-[var(--text-muted,#7D96A4)] hover:text-[var(--text-primary,#183040)]">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          {created_students && created_students.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[var(--success,#258265)] mb-2">
                <CheckCircle className="inline-block mr-2 h-5 w-5" />
                Successfully Created Students ({created_students.length})
              </h3>
              <p className="text-sm text-[var(--text-secondary,#486273)] mb-2">
                The following students have been created with their initial login credentials.
              </p>
              <div className="overflow-x-auto border border-[var(--border,#DCEBF2)] rounded-xl">
                <table className="min-w-full divide-y divide-[var(--border,#DCEBF2)]">
                  <thead className="bg-[var(--background,#F4FAFD)]">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Roll Number</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Username</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Password</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--surface,#FFFFFF)] divide-y divide-[var(--border,#DCEBF2)]">
                    {created_students.map((student, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.student_name}</td>
                        <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.roll_number}</td>
                        <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.username}</td>
                        <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.password}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {errors && errors.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--danger,#C94C4C)] mb-2">Upload Errors ({errors.length})</h3>
              <ul className="list-disc list-inside bg-[var(--danger-light,rgba(201,76,76,0.12))] border border-[var(--danger,#C94C4C)]/30 p-4 rounded-xl text-[var(--danger,#C94C4C)] text-sm">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 mt-auto border-t border-[var(--border,#DCEBF2)]">
          <button
            onClick={() => onCopyToClipboard(created_students)}
            style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            className="flex items-center px-4 py-2 rounded-lg shadow-sm text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            <Clipboard className="h-4 w-4 mr-2" />
            Copy Credentials to Clipboard
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border,#DCEBF2)] rounded-lg text-sm font-medium text-[var(--text-primary,#183040)] bg-[var(--surface,#FFFFFF)] hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadSuccessModal; 