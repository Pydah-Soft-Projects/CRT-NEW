import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, X, Check } from 'lucide-react';

export default function MultiSelectDropdown({
  label,
  options = [],
  selectedValues = [],
  onChange,
  placeholder = 'Select...',
  allLabel = 'All Colleges (Global)',
  loading = false,
  error = '',
  disabled = false,
  idKey = 'id',
  nameKey = 'name',
  codeKey = 'code',
  compact = false
}) {
  const safeOptions = Array.isArray(options) ? options : [];
  const safeSelected = Array.isArray(selectedValues) ? selectedValues : [];
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Determine whether to open upward or downward
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 280 && rect.top > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }
  }, [isOpen]);

  // Normalize options to { id, name, code }
  const normalizedOptions = useMemo(() => {
    return safeOptions.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          id: opt[idKey] ?? opt.id ?? opt.value ?? opt.name,
          name: opt[nameKey] ?? opt.name ?? opt.label ?? String(opt[idKey]),
          code: opt[codeKey] ?? opt.code ?? ''
        };
      }
      return {
        id: opt,
        name: String(opt),
        code: ''
      };
    });
  }, [safeOptions, idKey, nameKey, codeKey]);

  // Filter options by search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const term = searchTerm.toLowerCase();
    return normalizedOptions.filter((opt) =>
      opt.name.toLowerCase().includes(term) || (opt.code && opt.code.toLowerCase().includes(term))
    );
  }, [normalizedOptions, searchTerm]);

  const toggleOption = (id) => {
    const isSelected = safeSelected.some((v) => String(v) === String(id));
    let next;
    if (isSelected) {
      next = safeSelected.filter((v) => String(v) !== String(id));
    } else {
      next = [...safeSelected, id];
    }
    if (typeof onChange === 'function') {
      onChange(next);
    }
  };

  const handleSelectAll = () => {
    if (typeof onChange === 'function') {
      onChange([]);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    if (typeof onChange === 'function') {
      onChange([]);
    }
  };

  // Label to show on button
  const displayLabel = useMemo(() => {
    if (safeSelected.length === 0) {
      return allLabel;
    }
    if (safeSelected.length === 1) {
      const match = normalizedOptions.find((o) => String(o.id) === String(safeSelected[0]));
      return match ? (match.code ? `[${match.code}] ${match.name}` : match.name) : `${safeSelected[0]}`;
    }
    if (safeSelected.length === 2) {
      return safeSelected
        .map((v) => {
          const match = normalizedOptions.find((o) => String(o.id) === String(v));
          return match ? (match.code || match.name) : v;
        })
        .join(', ');
    }
    return `${safeSelected.length} Colleges Selected`;
  }, [safeSelected, normalizedOptions, allLabel]);

  return (
    <div className={`relative ${isOpen ? 'z-40' : 'z-10'}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
          <span>{label}</span>
          {safeSelected.length > 0 && (
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
              {safeSelected.length} selected
            </span>
          )}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left transition-all flex items-center justify-between gap-2 ${
          compact
            ? 'px-2.5 py-1.5 text-xs bg-white border rounded-lg shadow-2xs'
            : 'px-3 py-2 text-xs bg-white border rounded-xl shadow-2xs'
        } ${
          disabled
            ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200'
            : isOpen
            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
            : safeSelected.length > 0
            ? 'border-indigo-300 bg-indigo-50/20 text-slate-900 font-semibold'
            : 'border-slate-200 hover:border-slate-300 text-slate-700'
        }`}
      >
        <span className={`truncate ${safeSelected.length === 0 ? 'text-slate-600 font-medium' : 'text-slate-900 font-semibold'}`}>
          {loading ? 'Loading...' : displayLabel}
        </span>

        <div className="flex items-center gap-1 shrink-0">
          {safeSelected.length > 0 && !disabled && (
            <span
              onClick={handleClear}
              title="Reset to All"
              className="p-0.5 rounded hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 w-full min-w-[260px] max-w-sm bg-white rounded-xl shadow-2xl border border-slate-200 py-2 space-y-1 animate-in fade-in ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
        >
          {/* Search box */}
          {normalizedOptions.length > 3 && (
            <div className="px-2 pb-1.5 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${label || 'colleges'}...`}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 placeholder-slate-400"
                />
              </div>
            </div>
          )}

          {/* Quick Select Buttons */}
          <div className="flex items-center justify-between px-3 py-1 border-b border-slate-100 text-[11px] font-semibold text-slate-500">
            <button
              type="button"
              onClick={handleSelectAll}
              className="hover:text-indigo-600 transition-colors"
            >
              Select All (Global)
            </button>
            {safeSelected.length > 0 && (
              <button
                type="button"
                onClick={() => onChange && onChange([])}
                className="text-rose-600 hover:text-rose-700 transition-colors"
              >
                Clear Selection
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto px-1 space-y-0.5">
            {/* "All" Option */}
            <div
              onClick={handleSelectAll}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                safeSelected.length === 0
                  ? 'bg-indigo-50 text-indigo-900 font-semibold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={safeSelected.length === 0}
                onChange={handleSelectAll}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 pointer-events-none"
              />
              <span className="flex-1">{allLabel}</span>
              {safeSelected.length === 0 && (
                <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                  Active
                </span>
              )}
            </div>

            {filteredOptions.length === 0 ? (
              <p className="text-center py-3 text-xs text-slate-400">No matching colleges</p>
            ) : (
              filteredOptions.map((opt) => {
                const isChecked = safeSelected.some((v) => String(v) === String(opt.id));
                return (
                  <div
                    key={opt.id}
                    onClick={() => toggleOption(opt.id)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isChecked
                        ? 'bg-indigo-50 text-indigo-900 font-semibold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleOption(opt.id)}
                      className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 pointer-events-none"
                    />
                    <span className="flex-1 truncate">{opt.name}</span>
                    {opt.code && (
                      <span className="text-[10px] text-slate-500 font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                        {opt.code}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

