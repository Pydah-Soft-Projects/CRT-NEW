import React from 'react';

/**
 * Modern SkeletonLoader component with shimmer effect.
 * Supports multiple layouts via the `type` prop:
 * - 'dashboard' (stat cards, quick actions hub, score dist, bottom tables)
 * - 'tests' (header, 4 metrics, filter bar, table)
 * - 'crt' (header, module carousel cards, topics + questions split view)
 * - 'results' (header, export button, search bar, table)
 * - 'progress' (header, module pills, assessment cards, 5 metrics, student grid)
 * - 'users' (header, 4 metrics, tab row, filters, users table)
 * - 'table' (generic search bar + table rows)
 * - 'card' / 'inline' (compact block for inline section loading)
 */
const SkeletonLoader = ({ type = 'dashboard', count = 5, className = '' }) => {
  // Shimmer pulse base classes
  const pulse = 'animate-pulse bg-slate-200/80 rounded';
  const cardPulse = 'animate-pulse bg-white border border-slate-200/80 shadow-xs rounded-xl';

  if (type === 'tests') {
    return (
      <div className={`min-h-screen bg-slate-50 text-slate-900 p-3 sm:p-4 md:p-5 lg:p-6 w-full space-y-4 ${className}`}>
        {/* Header */}
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <div className={`h-4 w-28 ${pulse}`} />
            <div className={`h-7 w-64 ${pulse}`} />
            <div className={`h-3.5 w-80 max-w-full ${pulse}`} />
          </div>
          <div className={`h-9 w-36 rounded-lg ${pulse}`} />
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg ${pulse} shrink-0`} />
              <div className="space-y-1.5 flex-1">
                <div className={`h-2.5 w-16 ${pulse}`} />
                <div className={`h-5 w-10 ${pulse}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          <div className={`h-8 w-72 max-w-full rounded-md ${pulse}`} />
          <div className="flex gap-2">
            <div className={`h-8 w-32 rounded-md ${pulse}`} />
            <div className={`h-8 w-28 rounded-md ${pulse}`} />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <div className={`h-4 w-32 ${pulse}`} />
            <div className={`h-4 w-20 ${pulse}`} />
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {[1, 2, 3, 4, 5].map((row) => (
              <div key={row} className="py-3 px-3 flex items-center justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className={`h-4 w-56 max-w-full ${pulse}`} />
                  <div className={`h-3 w-40 ${pulse}`} />
                </div>
                <div className={`h-5 w-20 rounded ${pulse}`} />
                <div className={`h-5 w-16 rounded ${pulse}`} />
                <div className={`h-5 w-14 rounded-full ${pulse}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'crt') {
    return (
      <div className={`min-h-screen bg-[#F8FAFC] text-slate-800 p-3 sm:p-4 md:p-5 lg:p-6 space-y-4 ${className}`}>
        {/* Header & Breadcrumb */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className={`h-3.5 w-40 ${pulse}`} />
            <div className={`h-7 w-48 rounded-full ${pulse}`} />
          </div>
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-1.5">
              <div className={`h-7 w-72 ${pulse}`} />
              <div className={`h-3.5 w-96 max-w-full ${pulse}`} />
            </div>
            <div className="flex gap-2">
              <div className={`h-8 w-28 rounded-lg ${pulse}`} />
              <div className={`h-8 w-28 rounded-lg ${pulse}`} />
            </div>
          </div>
        </div>

        {/* 5 Module Horizontal Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((m) => (
            <div key={m} className={`${cardPulse} p-3 space-y-2.5`}>
              <div className="flex items-center justify-between">
                <div className={`w-8 h-8 rounded-lg ${pulse}`} />
                <div className={`h-4 w-10 rounded ${pulse}`} />
              </div>
              <div className={`h-4 w-28 ${pulse}`} />
              <div className={`h-3 w-full ${pulse}`} />
              <div className={`h-3 w-20 ${pulse}`} />
            </div>
          ))}
        </div>

        {/* 2-Column Split View: Topics (left) + Questions (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-xs p-3.5 space-y-3">
            <div className="flex justify-between items-center">
              <div className={`h-4 w-24 ${pulse}`} />
              <div className={`h-6 w-20 rounded-md ${pulse}`} />
            </div>
            <div className={`h-8 w-full rounded-md ${pulse}`} />
            <div className="space-y-2 pt-1">
              {[1, 2, 3, 4].map((t) => (
                <div key={t} className={`h-10 w-full rounded-lg ${pulse}`} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3.5">
            <div className="flex justify-between items-center">
              <div className={`h-6 w-44 ${pulse}`} />
              <div className="flex gap-2">
                <div className={`h-7 w-20 rounded ${pulse}`} />
                <div className={`h-7 w-20 rounded ${pulse}`} />
              </div>
            </div>
            <div className={`h-3 w-72 ${pulse}`} />
            <div className="flex gap-2 pt-1">
              {[1, 2, 3, 4].map((f) => (
                <div key={f} className={`h-7 w-16 rounded-md ${pulse}`} />
              ))}
            </div>
            <div className="space-y-2 pt-2">
              {[1, 2, 3].map((q) => (
                <div key={q} className={`h-16 w-full rounded-lg ${pulse}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'results') {
    return (
      <main className={`px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 md:py-5 space-y-4 ${className}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="space-y-1.5">
            <div className={`h-7 w-60 ${pulse}`} />
            <div className={`h-3.5 w-80 max-w-full ${pulse}`} />
          </div>
          <div className={`h-8 w-40 rounded-lg ${pulse}`} />
        </div>

        {/* Search */}
        <div className={`h-9 w-full max-w-md rounded-md ${pulse}`} />

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 p-3 border-b border-slate-200 flex gap-4">
            {[1, 2, 3, 4, 5, 6, 7].map((col) => (
              <div key={col} className={`h-4 flex-1 ${pulse}`} />
            ))}
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {[1, 2, 3, 4, 5, 6].map((row) => (
              <div key={row} className="py-3 px-3 flex gap-4 items-center">
                <div className={`h-3.5 w-8 ${pulse}`} />
                <div className={`h-4 w-44 ${pulse}`} />
                <div className={`h-3.5 w-24 ${pulse}`} />
                <div className={`h-3.5 w-36 ${pulse}`} />
                <div className={`h-3.5 w-28 ${pulse}`} />
                <div className={`h-4 w-12 rounded ${pulse}`} />
                <div className={`h-4 w-12 rounded ${pulse}`} />
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (type === 'progress') {
    return (
      <div className={`min-h-screen bg-slate-50/60 pb-16 ${className}`}>
        {/* Header */}
        <div className="bg-white border-b border-slate-200/80 shadow-xs">
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg ${pulse}`} />
                <div className="space-y-1.5">
                  <div className={`h-6 w-64 ${pulse}`} />
                  <div className={`h-3 w-80 max-w-full ${pulse}`} />
                </div>
              </div>
              <div className={`h-8 w-20 rounded-lg ${pulse}`} />
            </div>

            {/* Module Pills Row */}
            <div className="flex gap-2 pt-1 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7].map((pill) => (
                <div key={pill} className={`h-8 w-28 rounded-lg shrink-0 ${pulse}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 pt-4 space-y-4">
          {/* Assessment Cards */}
          <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs space-y-3">
            <div className={`h-4 w-44 ${pulse}`} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((ac) => (
                <div key={ac} className={`h-20 rounded-xl ${pulse}`} />
              ))}
            </div>
          </div>

          {/* 5 Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[1, 2, 3, 4, 5].map((st) => (
              <div key={st} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div className="space-y-1.5 flex-1">
                  <div className={`h-2.5 w-16 ${pulse}`} />
                  <div className={`h-6 w-12 ${pulse}`} />
                </div>
                <div className={`w-8 h-8 rounded-lg ${pulse}`} />
              </div>
            ))}
          </div>

          {/* Search & Grid */}
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
            <div className={`h-8 w-64 rounded-md ${pulse}`} />
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((fl) => (
                <div key={fl} className={`h-7 w-20 rounded-md ${pulse}`} />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((card) => (
              <div key={card} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full ${pulse}`} />
                  <div className={`h-4 flex-1 ${pulse}`} />
                </div>
                <div className={`h-3 w-3/4 ${pulse}`} />
                <div className={`h-6 w-full rounded ${pulse}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'users') {
    return (
      <div className={`p-3 sm:p-4 md:p-5 max-w-7xl mx-auto space-y-4 ${className}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <div className="space-y-1.5">
            <div className={`h-4 w-32 rounded-full ${pulse}`} />
            <div className={`h-6 w-60 ${pulse}`} />
            <div className={`h-3 w-80 max-w-full ${pulse}`} />
          </div>
          <div className="flex gap-2">
            <div className={`h-8 w-32 rounded-lg ${pulse}`} />
            <div className={`h-8 w-28 rounded-lg ${pulse}`} />
          </div>
        </div>

        {/* 4 Metrics Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
              <div className="space-y-1.5 flex-1">
                <div className={`h-2.5 w-20 ${pulse}`} />
                <div className={`h-6 w-12 ${pulse}`} />
                <div className={`h-2 w-16 ${pulse}`} />
              </div>
              <div className={`w-9 h-9 rounded-lg ${pulse}`} />
            </div>
          ))}
        </div>

        {/* Tab & Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden space-y-3 p-3">
          <div className="flex gap-4 border-b border-gray-100 pb-2">
            <div className={`h-7 w-28 rounded ${pulse}`} />
            <div className={`h-7 w-40 rounded ${pulse}`} />
            <div className={`h-7 w-36 rounded ${pulse}`} />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 justify-between">
            <div className={`h-8 w-72 max-w-full rounded-md ${pulse}`} />
            <div className="flex gap-2">
              <div className={`h-8 w-24 rounded-md ${pulse}`} />
              <div className={`h-8 w-24 rounded-md ${pulse}`} />
              <div className={`h-8 w-24 rounded-md ${pulse}`} />
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-gray-100 pt-1">
            {[1, 2, 3, 4, 5].map((r) => (
              <div key={r} className="py-2.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-1">
                  <div className={`w-7 h-7 rounded-full ${pulse}`} />
                  <div className="space-y-1 flex-1">
                    <div className={`h-3.5 w-36 ${pulse}`} />
                    <div className={`h-2.5 w-44 ${pulse}`} />
                  </div>
                </div>
                <div className={`h-4 w-20 rounded ${pulse}`} />
                <div className={`h-4 w-24 rounded ${pulse}`} />
                <div className={`h-4 w-14 rounded-full ${pulse}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'table') {
    return (
      <div className={`w-full space-y-3 ${className}`}>
        <div className="flex justify-between items-center py-1">
          <div className={`h-8 w-64 max-w-full rounded-md ${pulse}`} />
          <div className={`h-8 w-24 rounded-md ${pulse}`} />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="bg-slate-50 p-2.5 border-b border-slate-200 flex gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className={`h-3.5 flex-1 ${pulse}`} />
            ))}
          </div>
          <div className="divide-y divide-slate-100 p-2">
            {Array.from({ length: count }).map((_, r) => (
              <div key={r} className="py-2.5 px-2 flex gap-3 items-center">
                <div className={`w-7 h-7 rounded-full ${pulse} shrink-0`} />
                <div className={`h-3.5 w-32 ${pulse}`} />
                <div className={`h-3 w-24 ${pulse}`} />
                <div className={`h-3 w-28 ${pulse}`} />
                <div className={`h-3 w-20 ${pulse}`} />
                <div className={`h-4 w-14 rounded ${pulse}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default: 'dashboard'
  return (
    <div className={`min-h-screen bg-slate-50/50 p-3 sm:p-4 md:p-5 lg:p-6 space-y-4 md:space-y-5 ${className}`}>
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className={`h-7 w-64 max-w-full ${pulse}`} />
            <div className={`h-5 w-20 rounded-full ${pulse}`} />
          </div>
          <div className={`h-4 w-72 max-w-full ${pulse}`} />
        </div>
        <div className={`h-8 w-28 rounded-lg ${pulse}`} />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {[1, 2, 3, 4].map((c) => (
          <div key={c} className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5 flex-1">
                <div className={`h-2.5 w-24 ${pulse}`} />
                <div className={`h-6 w-16 ${pulse}`} />
              </div>
              <div className={`w-8 h-8 rounded-lg ${pulse}`} />
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <div className={`h-2.5 w-32 ${pulse}`} />
              <div className={`w-3.5 h-3.5 rounded ${pulse}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div className={`h-5 w-36 ${pulse}`} />
            <div className={`w-4 h-4 rounded ${pulse}`} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {[1, 2, 3, 4, 5, 6].map((a) => (
              <div key={a} className="p-3 rounded-lg border border-slate-100 bg-slate-50/50 space-y-2">
                <div className={`w-8 h-8 rounded-lg ${pulse}`} />
                <div className={`h-3.5 w-20 ${pulse}`} />
                <div className={`h-2.5 w-32 ${pulse}`} />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <div className={`h-5 w-32 ${pulse}`} />
            <div className={`h-4 w-14 rounded-full ${pulse}`} />
          </div>
          <div className="space-y-3 pt-1">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="space-y-1">
                <div className="flex justify-between">
                  <div className={`h-2.5 w-24 ${pulse}`} />
                  <div className={`h-2.5 w-10 ${pulse}`} />
                </div>
                <div className={`h-1.5 w-full rounded-full ${pulse}`} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[1, 2].map((b) => (
          <div key={b} className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex justify-between items-center">
              <div className={`h-5 w-36 ${pulse}`} />
              <div className={`h-3.5 w-16 ${pulse}`} />
            </div>
            <div className="divide-y divide-slate-100">
              {[1, 2, 3].map((r) => (
                <div key={r} className="py-2.5 flex items-center justify-between">
                  <div className="space-y-1 flex-1">
                    <div className={`h-3.5 w-48 ${pulse}`} />
                    <div className={`h-2.5 w-28 ${pulse}`} />
                  </div>
                  <div className={`h-6 w-16 rounded-lg ${pulse}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkeletonLoader;

