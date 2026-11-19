import React from 'react';
import { X, AlertTriangle, CheckCircle } from 'lucide-react';

const UploadPreviewModal = ({ isOpen, onClose, previewData, onConfirm, fileName }) => {
  if (!isOpen) return null;

  const validStudents = previewData.filter(student => student.errors.length === 0);
  const invalidStudents = previewData.filter(student => student.errors.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-[var(--surface,#FFFFFF)] border border-[var(--border,#DCEBF2)] rounded-2xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-[var(--border,#DCEBF2)] pb-3">
          <h2 className="text-xl font-semibold text-[var(--text-primary,#183040)]">Upload Preview for <span className="font-bold">{fileName}</span></h2>
          <button onClick={onClose} className="text-[var(--text-muted,#7D96A4)] hover:text-[var(--text-primary,#183040)]">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto flex-grow">
          {invalidStudents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[var(--danger,#C94C4C)] mb-2">Students with Errors ({invalidStudents.length})</h3>
              <div className="overflow-x-auto border border-[var(--border,#DCEBF2)] rounded-xl">
                <table className="min-w-full divide-y divide-[var(--border,#DCEBF2)]">
                  <thead className="bg-[var(--background,#F4FAFD)]">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Name</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Roll Number</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Course</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Errors</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--surface,#FFFFFF)] divide-y divide-[var(--border,#DCEBF2)]">
                    {invalidStudents.map((student, index) => (
                      <tr key={index} className="bg-[var(--danger-light,rgba(201,76,76,0.12))]">
                        <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.student_name}</td>
                        <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.roll_number}</td>
                        <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.email}</td>
                        <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.course_name}</td>
                        <td className="px-4 py-2 text-sm text-[var(--danger,#C94C4C)] font-medium">
                          {student.errors.join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <h3 className="text-lg font-semibold text-[var(--success,#258265)] mb-2">Ready to Upload ({validStudents.length})</h3>
          {validStudents.length > 0 ? (
            <div className="overflow-x-auto border border-[var(--border,#DCEBF2)] rounded-xl">
              <table className="min-w-full divide-y divide-[var(--border,#DCEBF2)]">
                <thead className="bg-[var(--background,#F4FAFD)]">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Name</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Roll Number</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Mobile</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--text-secondary,#486273)]">Course</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--surface,#FFFFFF)] divide-y divide-[var(--border,#DCEBF2)]">
                  {validStudents.map((student, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.student_name}</td>
                      <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.roll_number}</td>
                      <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.email}</td>
                      <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.mobile_number}</td>
                      <td className="px-4 py-2 text-sm text-[var(--text-primary,#183040)]">{student.course_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-[var(--text-muted,#7D96A4)]">No valid students to upload.</p>
          )}
        </div>

        <div className="flex justify-end space-x-3 pt-4 mt-auto border-t border-[var(--border,#DCEBF2)]">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-[var(--border,#DCEBF2)] rounded-lg text-sm font-medium text-[var(--text-primary,#183040)] bg-[var(--surface,#FFFFFF)] hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(validStudents)}
            disabled={validStudents.length === 0}
            style={validStudents.length > 0 ? { background: 'linear-gradient(135deg, var(--primary), var(--secondary))' } : {}}
            className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-slate-400 disabled:opacity-50"
          >
            <CheckCircle className="h-4 w-4 mr-2 inline" />
            Confirm & Upload {validStudents.length} Students
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPreviewModal; 