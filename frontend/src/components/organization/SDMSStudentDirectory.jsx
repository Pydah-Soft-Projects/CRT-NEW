import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Search, Users } from 'lucide-react';
import api from '../../services/api';

const PAGE_SIZE = 25;

const SDMSStudentDirectory = ({ title }) => {
  const [students, setStudents] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const response = await api.get('/student/sdms/students', {
        params: { page, limit: PAGE_SIZE, search: search || undefined, include_photo: false }
      });
      setStudents(response.data.data || []);
      setPagination(response.data.pagination || { total: 0, pages: 1 });
    } catch (error) {
      setLoadError(error.response?.data?.message || 'Unable to load students from SDMS.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-[var(--background,#F4FAFD)] min-h-screen">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary,#183040)]">{title}</h1>
          <p className="mt-1 text-sm text-[var(--text-secondary,#486273)]">
            Student identities and academic records are read directly from SDMS. This directory cannot create, edit, or delete student records.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[var(--primary-50,#E8F4FA)] border border-[var(--border,#DCEBF2)] px-4 py-3 text-sm font-medium text-[var(--primary-900,#082B3D)]">
          <Users className="h-5 w-5 text-[var(--primary)]" />
          {pagination.total.toLocaleString()} students
        </div>
      </div>

      <form onSubmit={submitSearch} className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted,#7D96A4)]" />
          <input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, roll number, admission number, or email"
            className="w-full rounded-xl border border-[var(--border,#DCEBF2)] bg-[var(--surface,#FFFFFF)] py-2.5 pl-10 pr-3 text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-100)] text-[var(--text-primary,#183040)] placeholder-[var(--text-muted,#7D96A4)]"
          />
        </label>
        <button 
          type="submit" 
          style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
        >
          Search
        </button>
        <button
          type="button"
          onClick={loadStudents}
          disabled={loading}
          aria-label="Refresh student directory"
          className="inline-flex items-center justify-center rounded-xl border border-[var(--border,#DCEBF2)] bg-[var(--surface,#FFFFFF)] px-4 py-2.5 text-[var(--text-primary,#183040)] hover:bg-[var(--background,#F4FAFD)] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </form>

      {loadError && (
        <div role="alert" className="rounded-xl border border-[var(--danger,#C94C4C)]/30 bg-[var(--danger-light,rgba(201,76,76,0.12))] px-4 py-3 text-sm text-[var(--danger,#C94C4C)]">
          {loadError}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[var(--border,#DCEBF2)] bg-[var(--surface,#FFFFFF)] shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--border,#DCEBF2)] text-sm">
            <thead className="bg-[var(--background,#F4FAFD)] text-left text-xs font-semibold uppercase tracking-wide text-[var(--text-secondary,#486273)]">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Roll / Admission</th>
                <th className="px-4 py-3">College</th>
                <th className="px-4 py-3">Course / Branch</th>
                <th className="px-4 py-3">Year / Semester</th>
                <th className="px-4 py-3">Section</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border,#DCEBF2)]">
              {loading ? (
                <tr><td colSpan="7" className="px-4 py-10 text-center text-[var(--text-muted,#7D96A4)]">Loading SDMS students...</td></tr>
              ) : students.length === 0 ? (
                <tr><td colSpan="7" className="px-4 py-10 text-center text-[var(--text-muted,#7D96A4)]">No students found.</td></tr>
              ) : students.map((student) => (
                <tr key={student.sdms_student_id || student.id} className="hover:bg-[var(--background,#F4FAFD)] transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-[var(--text-primary,#183040)]">{student.name || '—'}</div>
                    <div className="text-xs text-[var(--text-muted,#7D96A4)]">{student.email || 'No email'}</div>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary,#486273)]">
                    <div>{student.roll_number || student.pin_no || '—'}</div>
                    <div className="text-xs text-[var(--text-muted,#7D96A4)]">{student.admission_number || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{student.college_name || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">
                    <div>{student.course_name || '—'}</div>
                    <div className="text-xs text-gray-500">{student.branch_name || ''}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {student.year || '—'} / {student.semester || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{student.section || '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{student.status || 'Active'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
          <span className="text-xs text-gray-500">Page {page} of {Math.max(pagination.pages || 1, 1)}</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={loading || page <= 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pagination.pages || 1, current + 1))}
              disabled={loading || page >= (pagination.pages || 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SDMSStudentDirectory;
