import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Shield, 
  UserCheck, 
  UserPlus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Key, 
  Building2, 
  Briefcase, 
  FileText, 
  Database, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Check, 
  X, 
  Lock, 
  Unlock, 
  Eye, 
  Sliders, 
  Layers, 
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../../services/api';
import SkeletonLoader from '../../components/common/SkeletonLoader';

const YEAR_OPTIONS = [
  { id: 1, name: '1st Year' },
  { id: 2, name: '2nd Year' },
  { id: 3, name: '3rd Year' },
  { id: 4, name: '4th Year' },
  { id: 5, name: '5th Year' },
  { id: 6, name: '6th Year' }
];

const formatYearBadge = (yr) => {
  if (yr === null || yr === undefined || yr === '' || yr === 'null') return '';
  const n = Number(yr);
  if (!Number.isSafeInteger(n) || n <= 0) return '';
  if (n === 1) return '1st Year';
  if (n === 2) return '2nd Year';
  if (n === 3) return '3rd Year';
  return `${n}th Year`;
};

function MultiSelectDropdown({
  label,
  options = [],
  selectedValues = [],
  onChange,
  placeholder = 'Select...',
  allLabel = 'All Options',
  loading = false,
  error = '',
  disabled = false,
  idKey = 'id',
  nameKey = 'name',
  codeKey = 'code'
}) {
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
    return options.map(opt => {
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
  }, [options, idKey, nameKey, codeKey]);

  // Filter options by search
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return normalizedOptions;
    const term = searchTerm.toLowerCase();
    return normalizedOptions.filter(opt =>
      opt.name.toLowerCase().includes(term) || (opt.code && opt.code.toLowerCase().includes(term))
    );
  }, [normalizedOptions, searchTerm]);

  const toggleOption = (id) => {
    const numId = Number(id);
    const useId = Number.isSafeInteger(numId) ? numId : id;
    const isSelected = selectedValues.some(v => String(v) === String(useId));
    let next;
    if (isSelected) {
      next = selectedValues.filter(v => String(v) !== String(useId));
    } else {
      next = [...selectedValues, useId];
    }
    onChange(next);
  };

  const handleSelectAll = () => {
    onChange([]);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange([]);
  };

  // Label to show on button
  const displayLabel = useMemo(() => {
    if (!selectedValues || selectedValues.length === 0) {
      return allLabel;
    }
    if (selectedValues.length === 1) {
      const match = normalizedOptions.find(o => String(o.id) === String(selectedValues[0]));
      return match ? match.name : `${selectedValues[0]}`;
    }
    if (selectedValues.length === 2) {
      const names = selectedValues
        .map(v => normalizedOptions.find(o => String(o.id) === String(v))?.name || v)
        .join(', ');
      return names;
    }
    return `${selectedValues.length} Selected`;
  }, [selectedValues, normalizedOptions, allLabel]);

  return (
    <div className={`relative ${isOpen ? 'z-40' : 'z-10'}`} ref={dropdownRef}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
          <span>{label}</span>
          {selectedValues && selectedValues.length > 0 && (
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
              {selectedValues.length} selected
            </span>
          )}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-xl flex items-center justify-between gap-2 text-left transition-all ${
          disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 border-slate-200' :
          isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm' :
          selectedValues && selectedValues.length > 0 ? 'border-indigo-300 bg-indigo-50/20' : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <span className={`truncate text-sm ${!selectedValues || selectedValues.length === 0 ? 'text-slate-600 font-medium' : 'text-slate-900 font-semibold'}`}>
            {loading ? 'Loading...' : displayLabel}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedValues && selectedValues.length > 0 && !disabled && (
            <span
              onClick={handleClear}
              title="Reset to All"
              className="p-0.5 rounded-md hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute z-50 w-full min-w-[240px] bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 space-y-1 animate-in fade-in ${
          openUpward ? 'bottom-full mb-1.5 slide-in-from-bottom-1' : 'top-full mt-1.5 slide-in-from-top-1'
        }`}>
          {/* Search box if options > 4 */}
          {normalizedOptions.length > 4 && (
            <div className="px-2 pb-1.5">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={`Search options...`}
                  className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
              Select All ({allLabel})
            </button>
            {selectedValues && selectedValues.length > 0 && (
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-rose-600 hover:text-rose-700 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto px-1 space-y-0.5">
            {/* "All" Option */}
            <div
              onClick={handleSelectAll}
              className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                !selectedValues || selectedValues.length === 0
                  ? 'bg-indigo-50 text-indigo-900 font-semibold'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <input
                type="checkbox"
                checked={!selectedValues || selectedValues.length === 0}
                onChange={handleSelectAll}
                className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 pointer-events-none"
              />
              <span className="flex-1 font-medium">{allLabel}</span>
              {(!selectedValues || selectedValues.length === 0) && (
                <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                  Default
                </span>
              )}
            </div>

            {filteredOptions.length === 0 ? (
              <p className="text-center py-3 text-xs text-slate-400">No matching options</p>
            ) : (
              filteredOptions.map(opt => {
                const isChecked = selectedValues.some(v => String(v) === String(opt.id));
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
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
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

const PORTAL_PAGES = [
  { id: 'dashboard', name: 'Dashboard', path: '/superadmin/dashboard', description: 'Overview statistics and quick system actions' },
  { id: 'students', name: 'Student Management', path: '/superadmin/students', description: 'Student directory and profile management' },
  { id: 'tests', name: 'Test Management', path: '/superadmin/tests', description: 'Module creation and test configuration' },
  { id: 'crt_upload', name: 'CRT Upload', path: '/superadmin/crt-upload', description: 'Dynamic CRT modules, topics, levels, and question upload' },
  { id: 'results', name: 'Results Management', path: '/superadmin/results', description: 'View student scores and test submissions' },
  { id: 'progress_tracking', name: 'Progress Tracking', path: '/superadmin/progress-tracking', description: 'Student module progress tracking' },
  { id: 'user_management', name: 'User Management', path: '/superadmin/user-management', description: 'HRMS users linking, role creation, and permissions' },
];

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'roles', 'hrms_directory'
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userStatusFilter, setUserStatusFilter] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userPagination, setUserPagination] = useState({ total: 0, totalPages: 1 });

  // Roles state
  const [roles, setRoles] = useState([]);
  const [roleSearch, setRoleSearch] = useState('');

  // HRMS live directory state
  const [hrmsEmployees, setHrmsEmployees] = useState([]);
  const [hrmsSearch, setHrmsSearch] = useState('');
  const [hrmsDeptFilter, setHrmsDeptFilter] = useState('');
  const [hrmsDepartments, setHrmsDepartments] = useState([]);
  const [hrmsLoading, setHrmsLoading] = useState(false);
  const [hrmsPage, setHrmsPage] = useState(1);
  const [hrmsPagination, setHrmsPagination] = useState({ total: 0, totalPages: 1 });

  // Modals state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);

  // Link User Modal Form state
  const [selectedHrmsEmp, setSelectedHrmsEmp] = useState(null);
  const [linkSearchQuery, setLinkSearchQuery] = useState('');
  const [linkSearchResults, setLinkSearchResults] = useState([]);
  const [linkSearchLoading, setLinkSearchLoading] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [customPermissions, setCustomPermissions] = useState({});
  const [savingUser, setSavingUser] = useState(false);

  // Role Modal Form state
  const [editingRole, setEditingRole] = useState(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [rolePermissions, setRolePermissions] = useState({});
  const [savingRole, setSavingRole] = useState(false);

  // Edit User Modal Form state
  const [editingUser, setEditingUser] = useState(null);
  const [editUserRoleId, setEditUserRoleId] = useState('');
  const [editUserPermissions, setEditUserPermissions] = useState({});
  const [editUserStatus, setEditUserStatus] = useState('active');
  const [editSdmsCollegeIds, setEditSdmsCollegeIds] = useState([]);
  const [editSdmsCourseIds, setEditSdmsCourseIds] = useState([]);
  const [editSdmsBranchIds, setEditSdmsBranchIds] = useState([]);
  const [editSdmsYears, setEditSdmsYears] = useState([]);

  // Link User Modal SDMS state
  const [linkSdmsCollegeIds, setLinkSdmsCollegeIds] = useState([]);
  const [linkSdmsCourseIds, setLinkSdmsCourseIds] = useState([]);
  const [linkSdmsBranchIds, setLinkSdmsBranchIds] = useState([]);
  const [linkSdmsYears, setLinkSdmsYears] = useState([]);

  // SDMS Institutional catalogs & filters
  const [sdmsColleges, setSdmsColleges] = useState([]);
  const [sdmsCourses, setSdmsCourses] = useState([]);
  const [sdmsBranches, setSdmsBranches] = useState([]);
  const [userCollegeFilter, setUserCollegeFilter] = useState('');
  const [userCourseFilter, setUserCourseFilter] = useState('');

  // Initial data loading
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchSummary(),
        fetchUsers(),
        fetchRoles(),
        fetchHrmsDepartments(),
        fetchSdmsCatalog()
      ]);
    } catch (err) {
      console.error('Initial load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSdmsCatalog = async () => {
    try {
      const [collegesRes, coursesRes, branchesRes] = await Promise.allSettled([
        api.get('/student/sdms/colleges'),
        api.get('/student/sdms/courses'),
        api.get('/student/sdms/branches')
      ]);

      if (collegesRes.status === 'fulfilled' && collegesRes.value?.data?.data) {
        setSdmsColleges(Array.isArray(collegesRes.value.data.data) ? collegesRes.value.data.data : []);
      }
      if (coursesRes.status === 'fulfilled' && coursesRes.value?.data?.data) {
        setSdmsCourses(Array.isArray(coursesRes.value.data.data) ? coursesRes.value.data.data : []);
      }
      if (branchesRes.status === 'fulfilled' && branchesRes.value?.data?.data) {
        setSdmsBranches(Array.isArray(branchesRes.value.data.data) ? branchesRes.value.data.data : []);
      }
    } catch (err) {
      console.error('Error fetching SDMS catalog:', err);
    }
  };

  const fetchSummary = async () => {
    try {
      const res = await api.get('/user-management/summary');
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Summary fetch error:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = {
        search: userSearch,
        role: userRoleFilter,
        status: userStatusFilter,
        page: userPage,
        limit: 15
      };
      const res = await api.get('/user-management/users', { params });
      if (res.data.success) {
        setUsers(res.data.data || []);
        setUserPagination(res.data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      toast.error('Failed to load users');
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get('/user-management/roles');
      if (res.data.success) {
        setRoles(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch roles error:', err);
    }
  };

  const fetchHrmsDepartments = async () => {
    try {
      const res = await api.get('/user-management/hrms/departments');
      if (res.data.success) {
        setHrmsDepartments(res.data.data || []);
      }
    } catch (err) {
      console.error('Fetch departments error:', err);
    }
  };

  // Re-fetch users on filter change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [userSearch, userRoleFilter, userStatusFilter, userPage]);

  // Re-fetch HRMS directory when tab is active or search changes
  useEffect(() => {
    if (activeTab === 'hrms_directory') {
      const timer = setTimeout(() => {
        fetchHrmsDirectory();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab, hrmsSearch, hrmsDeptFilter, hrmsPage]);

  const fetchHrmsDirectory = async () => {
    setHrmsLoading(true);
    try {
      const params = {
        search: hrmsSearch,
        department_id: hrmsDeptFilter,
        page: hrmsPage,
        limit: 20
      };
      const res = await api.get('/user-management/hrms/employees', { params });
      if (res.data.success) {
        setHrmsEmployees(res.data.data || []);
        setHrmsPagination(res.data.pagination || { total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Fetch HRMS employees error:', err);
    } finally {
      setHrmsLoading(false);
    }
  };

  // Live search for linking modal
  useEffect(() => {
    if (!showLinkModal) return;
    if (!linkSearchQuery.trim()) {
      setLinkSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLinkSearchLoading(true);
      try {
        const res = await api.get('/user-management/hrms/employees', {
          params: { search: linkSearchQuery.trim(), limit: 8 }
        });
        if (res.data.success) {
          setLinkSearchResults(res.data.data || []);
        }
      } catch (err) {
        console.error('HRMS search error:', err);
      } finally {
        setLinkSearchLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [linkSearchQuery, showLinkModal]);

  // Cascading options for Link Modal
  const linkAvailableCourses = useMemo(() => {
    if (!linkSdmsCollegeIds || linkSdmsCollegeIds.length === 0) return sdmsCourses;
    const colSet = new Set(linkSdmsCollegeIds.map(Number));
    return sdmsCourses.filter(c => colSet.has(Number(c.college_id)));
  }, [sdmsCourses, linkSdmsCollegeIds]);

  const linkAvailableBranches = useMemo(() => {
    if (!linkSdmsCourseIds || linkSdmsCourseIds.length === 0) {
      if (!linkSdmsCollegeIds || linkSdmsCollegeIds.length === 0) return sdmsBranches;
      const colSet = new Set(linkSdmsCollegeIds.map(Number));
      const validCourseIds = new Set(sdmsCourses.filter(c => colSet.has(Number(c.college_id))).map(c => Number(c.id)));
      return sdmsBranches.filter(b => validCourseIds.has(Number(b.course_id)));
    }
    const courseSet = new Set(linkSdmsCourseIds.map(Number));
    return sdmsBranches.filter(b => courseSet.has(Number(b.course_id)));
  }, [sdmsBranches, sdmsCourses, linkSdmsCourseIds, linkSdmsCollegeIds]);

  // Cascading options for Edit Modal
  const editAvailableCourses = useMemo(() => {
    if (!editSdmsCollegeIds || editSdmsCollegeIds.length === 0) return sdmsCourses;
    const colSet = new Set(editSdmsCollegeIds.map(Number));
    return sdmsCourses.filter(c => colSet.has(Number(c.college_id)));
  }, [sdmsCourses, editSdmsCollegeIds]);

  const editAvailableBranches = useMemo(() => {
    if (!editSdmsCourseIds || editSdmsCourseIds.length === 0) {
      if (!editSdmsCollegeIds || editSdmsCollegeIds.length === 0) return sdmsBranches;
      const colSet = new Set(editSdmsCollegeIds.map(Number));
      const validCourseIds = new Set(sdmsCourses.filter(c => colSet.has(Number(c.college_id))).map(c => Number(c.id)));
      return sdmsBranches.filter(b => validCourseIds.has(Number(b.course_id)));
    }
    const courseSet = new Set(editSdmsCourseIds.map(Number));
    return sdmsBranches.filter(b => courseSet.has(Number(b.course_id)));
  }, [sdmsBranches, sdmsCourses, editSdmsCourseIds, editSdmsCollegeIds]);

  const resetLinkForm = () => {
    setSelectedHrmsEmp(null);
    setLinkSearchQuery('');
    setLinkSearchResults([]);
    setSelectedRoleId('');
    setCustomPermissions({});
    setLinkSdmsCollegeIds([]);
    setLinkSdmsCourseIds([]);
    setLinkSdmsBranchIds([]);
    setLinkSdmsYears([]);
  };

  // When a role is selected in the Link Modal, populate permissions default
  const handleSelectRoleInLinkModal = (roleId) => {
    setSelectedRoleId(roleId);
    const role = roles.find(r => r._id === roleId);
    if (role && role.permissions) {
      setCustomPermissions(JSON.parse(JSON.stringify(role.permissions)));
    }
  };

  // Open Link Modal with pre-selected HRMS employee
  const openLinkModalForEmployee = (emp) => {
    resetLinkForm();
    setSelectedHrmsEmp(emp);
    setLinkSearchQuery(emp.emp_no);
    setLinkSearchResults([]);
    
    // Default to first non-superadmin role or first role
    const defaultRole = roles.find(r => r.key === 'evaluator') || roles[0];
    if (defaultRole) {
      setSelectedRoleId(defaultRole._id);
      setCustomPermissions(JSON.parse(JSON.stringify(defaultRole.permissions || {})));
    }
    setShowLinkModal(true);
  };

  // Submit link HRMS user with scope validations
  const handleSaveLinkUser = async () => {
    if (!selectedHrmsEmp) {
      toast.error('Please select an HRMS employee to link');
      return;
    }
    if (!selectedRoleId) {
      toast.error('Please select a role for this user');
      return;
    }

    const chosenRole = roles.find(r => r._id === selectedRoleId);
    const chosenRoleKey = chosenRole?.key || '';

    // Institutional Scope Validations
    if (chosenRoleKey === 'campus_admin' && linkSdmsCollegeIds.length === 0) {
      toast.error('At least one College selection is required for Campus Admin.');
      return;
    }
    if (chosenRoleKey === 'course_admin' && (linkSdmsCollegeIds.length === 0 || linkSdmsCourseIds.length === 0)) {
      toast.error('Both College and Course selections are required for Course Admin.');
      return;
    }

    setSavingUser(true);
    try {
      const res = await api.post('/user-management/users/link-hrms', {
        emp_no: selectedHrmsEmp.emp_no,
        role_id: selectedRoleId,
        custom_permissions: customPermissions,
        sdms_college_ids: linkSdmsCollegeIds,
        sdms_course_ids: linkSdmsCourseIds,
        sdms_branch_ids: linkSdmsBranchIds,
        sdms_years: linkSdmsYears
      });

      if (res.data.success) {
        toast.success(res.data.message || 'User linked successfully!');
        setShowLinkModal(false);
        resetLinkForm();
        fetchUsers();
        fetchSummary();
        if (activeTab === 'hrms_directory') {
          fetchHrmsDirectory();
        }
      } else {
        toast.error(res.data.message || 'Failed to link user');
      }
    } catch (err) {
      console.error('Link user error:', err);
      toast.error(err.response?.data?.message || 'Error linking user');
    } finally {
      setSavingUser(false);
    }
  };

  // Open Role Modal (Create or Edit)
  const openRoleModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setRoleName(role.name);
      setRoleDescription(role.description || '');
      setRolePermissions(JSON.parse(JSON.stringify(role.permissions || {})));
    } else {
      setEditingRole(null);
      setRoleName('');
      setRoleDescription('');
      const defaultPerms = {};
      PORTAL_PAGES.forEach(p => {
        defaultPerms[p.id] = { read: true, write: false };
      });
      setRolePermissions(defaultPerms);
    }
    setShowRoleModal(true);
  };

  // Save Role (Create or Update)
  const handleSaveRole = async () => {
    if (!roleName.trim()) {
      toast.error('Role name is required');
      return;
    }

    setSavingRole(true);
    try {
      if (editingRole) {
        const res = await api.put(`/user-management/roles/${editingRole._id}`, {
          name: roleName.trim(),
          description: roleDescription,
          permissions: rolePermissions
        });
        if (res.data.success) {
          toast.success('Role updated successfully');
          setShowRoleModal(false);
          fetchRoles();
          fetchUsers();
        }
      } else {
        const res = await api.post('/user-management/roles', {
          name: roleName.trim(),
          description: roleDescription,
          permissions: rolePermissions
        });
        if (res.data.success) {
          toast.success('Role created successfully');
          setShowRoleModal(false);
          fetchRoles();
          fetchSummary();
        }
      }
    } catch (err) {
      console.error('Save role error:', err);
      toast.error(err.response?.data?.message || 'Failed to save role');
    } finally {
      setSavingRole(false);
    }
  };

  // Delete Role
  const handleDeleteRole = async (role) => {
    if (role.is_system) {
      toast.error('System roles cannot be deleted');
      return;
    }

    const confirm = await Swal.fire({
      title: `Delete '${role.name}'?`,
      text: 'Are you sure you want to delete this custom role? This cannot be undone.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete role'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await api.delete(`/user-management/roles/${role._id}`);
        if (res.data.success) {
          toast.success(res.data.message || 'Role deleted');
          fetchRoles();
          fetchSummary();
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete role');
      }
    }
  };

  // Open Edit User Modal
  const openEditUserModal = (user) => {
    setEditingUser(user);
    setEditUserRoleId(user.role_id?._id || user.role_id || '');
    setEditUserPermissions(JSON.parse(JSON.stringify(user.permissions || user.role_id?.permissions || {})));
    setEditUserStatus(user.status || 'active');

    const cleanIds = (arr, single) => {
      let list = [];
      if (Array.isArray(arr)) {
        list = arr.map(Number).filter(n => Number.isSafeInteger(n) && n > 0);
      }
      if (list.length === 0 && single !== null && single !== undefined && single !== '' && single !== 'null') {
        const n = Number(single);
        if (Number.isSafeInteger(n) && n > 0) list = [n];
      }
      return list;
    };

    setEditSdmsCollegeIds(cleanIds(user.sdms_college_ids, user.sdms_college_id));
    setEditSdmsCourseIds(cleanIds(user.sdms_course_ids, user.sdms_course_id));
    setEditSdmsBranchIds(cleanIds(user.sdms_branch_ids, user.sdms_branch_id));
    setEditSdmsYears(cleanIds(user.sdms_years, user.sdms_year));

    setShowEditUserModal(true);
  };

  // Save Edit User with scope validations
  const handleSaveEditUser = async () => {
    if (!editingUser) return;

    const chosenRole = roles.find(r => r._id === editUserRoleId);
    const chosenRoleKey = chosenRole?.key || editingUser.role || '';

    // Institutional Scope Validations
    if (chosenRoleKey === 'campus_admin' && editSdmsCollegeIds.length === 0) {
      toast.error('College selection is required for Campus Admin.');
      return;
    }
    if (chosenRoleKey === 'course_admin' && (editSdmsCollegeIds.length === 0 || editSdmsCourseIds.length === 0)) {
      toast.error('Both College and Course selections are required for Course Admin.');
      return;
    }

    try {
      const res = await api.put(`/user-management/users/${editingUser._id}`, {
        role_id: editUserRoleId,
        permissions: editUserPermissions,
        status: editUserStatus,
        sdms_college_ids: editSdmsCollegeIds,
        sdms_course_ids: editSdmsCourseIds,
        sdms_branch_ids: editSdmsBranchIds,
        sdms_years: editSdmsYears
      });

      if (res.data.success) {
        toast.success('User updated successfully');
        setShowEditUserModal(false);
        fetchUsers();
      }
    } catch (err) {
      console.error('Update user error:', err);
      toast.error(err.response?.data?.message || 'Failed to update user');
    }
  };

  // Toggle User Status quickly
  const handleToggleUserStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      const res = await api.put(`/user-management/users/${user._id}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`User marked as ${newStatus}`);
        setUsers(users.map(u => u._id === user._id ? { ...u, status: newStatus } : u));
      }
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  // Delete User access
  const handleDeleteUser = async (user) => {
    if (user.role === 'superadmin') {
      toast.error('Cannot remove primary Super Admin account');
      return;
    }

    const confirm = await Swal.fire({
      title: `Remove ${user.name || user.username}?`,
      text: `This will remove this user's portal access and role permissions. Their HRMS employee record will remain safe.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, revoke access'
    });

    if (confirm.isConfirmed) {
      try {
        const res = await api.delete(`/user-management/users/${user._id}`);
        if (res.data.success) {
          toast.success('User access revoked from portal');
          fetchUsers();
          fetchSummary();
          if (activeTab === 'hrms_directory') {
            fetchHrmsDirectory();
          }
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  // Helper toggle permission for a page
  const togglePagePermission = (permState, setPermState, pageId, type) => {
    setPermState(prev => {
      const current = prev[pageId] || { read: false, write: false };
      const next = { ...current };

      if (type === 'read') {
        next.read = !current.read;
        // If read is disabled, write must be disabled too
        if (!next.read) next.write = false;
      } else if (type === 'write') {
        next.write = !current.write;
        // If write is enabled, read must be enabled too
        if (next.write) next.read = true;
      }

      return {
        ...prev,
        [pageId]: next
      };
    });
  };

  // Quick permission helpers
  const setAllPermissions = (setPermState, readVal, writeVal) => {
    const next = {};
    PORTAL_PAGES.forEach(p => {
      next[p.id] = { read: readVal, write: writeVal };
    });
    setPermState(next);
  };

  if (loading) {
    return <SkeletonLoader type="users" />;
  }

  return (
    <div className="p-3 sm:p-4 md:p-5 w-full space-y-4 sm:space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1 bg-blue-100 text-blue-700 rounded-lg">
              <Users className="h-4 w-4" />
            </span>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
              User & Access Administration
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">User & Role Management</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Manage portal users, custom roles, permissions, and SDMS organizational assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              resetLinkForm();
              const defaultRole = roles.find(r => r.key === 'evaluator') || roles[0];
              if (defaultRole) {
                setSelectedRoleId(defaultRole._id);
                setCustomPermissions(JSON.parse(JSON.stringify(defaultRole.permissions || {})));
              }
              setShowLinkModal(true);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3.5 py-2 rounded-lg shadow-sm transition text-xs active:scale-95"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Link HRMS User
          </button>
          <button
            onClick={() => openRoleModal(null)}
            className="flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-semibold px-3.5 py-2 rounded-lg shadow-sm transition text-xs active:scale-95"
          >
            <Shield className="h-3.5 w-3.5 text-gray-500" />
            Create Role
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Portal Users</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{summary?.totalPortalUsers || users.length}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Active Accounts</p>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <UserCheck className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">HRMS Linked</p>
            <p className="text-xl font-bold text-indigo-600 mt-0.5">{summary?.hrmsLinkedUsers || 0}</p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">Via Employee Number</p>
          </div>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Key className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Configured Roles</p>
            <p className="text-xl font-bold text-purple-600 mt-0.5">{roles.length}</p>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">System & Custom</p>
          </div>
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
            <Shield className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">HRMS Active Staff</p>
            <p className="text-xl font-bold text-gray-900 mt-0.5">{summary?.hrmsTotalEmployees || 618}</p>
            <p className="text-[11px] text-blue-600 font-medium mt-0.5">Available in Live HRMS DB</p>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
            <Database className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 space-x-2 bg-white px-4 pt-2 rounded-t-2xl border-t border-x">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 py-2 px-3 font-semibold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'users'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Users className="h-4 w-4" />
          Portal Users
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">
            {userPagination.total || users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 py-2 px-3 font-semibold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'roles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Shield className="h-4 w-4" />
          Roles & Permissions Matrix
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-medium">
            {roles.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('hrms_directory')}
          className={`flex items-center gap-2 py-2 px-3 font-semibold text-xs sm:text-sm border-b-2 transition ${
            activeTab === 'hrms_directory'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Database className="h-4 w-4" />
          HRMS Employee Directory
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
            Live
          </span>
        </button>
      </div>

      {/* Tab 1: Portal Users */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-b-2xl border-b border-x border-gray-200 shadow-sm p-6 space-y-4 -mt-6">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full md:w-80">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search user, emp_no, email..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                value={userRoleFilter}
                onChange={(e) => { setUserRoleFilter(e.target.value); setUserPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">All Roles</option>
                {roles.map(r => (
                  <option key={r._id} value={r.key}>{r.name}</option>
                ))}
              </select>

              <select
                value={userCollegeFilter}
                onChange={(e) => { setUserCollegeFilter(e.target.value); setUserCourseFilter(''); }}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">All Colleges</option>
                {sdmsColleges.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>

              {userCollegeFilter && (
                <select
                  value={userCourseFilter}
                  onChange={(e) => setUserCourseFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="">All Courses</option>
                  {sdmsCourses.filter(c => Number(c.college_id) === Number(userCollegeFilter)).map(c => (
                    <option key={c.id} value={String(c.id)}>{c.name}</option>
                  ))}
                </select>
              )}

              <select
                value={userStatusFilter}
                onChange={(e) => { setUserStatusFilter(e.target.value); setUserPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <button
                onClick={fetchUsers}
                className="p-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                title="Refresh user list"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">User</th>
                  <th className="py-2.5 px-3">Employee No</th>
                  <th className="py-2.5 px-3">Department & Role</th>
                  <th className="py-2.5 px-3">Institutional Scope</th>
                  <th className="py-2.5 px-3">Page Permissions</th>
                  <th className="py-2.5 px-3">Auth Source</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users
                  .filter(u => {
                    if (userCollegeFilter) {
                      const userColIds = (u.sdms_college_ids && u.sdms_college_ids.length > 0)
                        ? u.sdms_college_ids.map(String)
                        : (u.sdms_college_id ? [String(u.sdms_college_id)] : []);
                      if (userColIds.length > 0 && !userColIds.includes(String(userCollegeFilter))) return false;
                    }
                    if (userCourseFilter) {
                      const userCoIds = (u.sdms_course_ids && u.sdms_course_ids.length > 0)
                        ? u.sdms_course_ids.map(String)
                        : (u.sdms_course_id ? [String(u.sdms_course_id)] : []);
                      if (userCoIds.length > 0 && !userCoIds.includes(String(userCourseFilter))) return false;
                    }
                    return true;
                  })
                  .length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-gray-500">
                      <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="font-medium text-gray-700">No portal users found</p>
                      <p className="text-xs text-gray-400 mt-1">Try clearing filters or link an employee from HRMS</p>
                    </td>
                  </tr>
                ) : (
                  users
                    .filter(u => {
                      if (userCollegeFilter) {
                        const userColIds = (u.sdms_college_ids && u.sdms_college_ids.length > 0)
                          ? u.sdms_college_ids.map(String)
                          : (u.sdms_college_id ? [String(u.sdms_college_id)] : []);
                        if (userColIds.length > 0 && !userColIds.includes(String(userCollegeFilter))) return false;
                      }
                      if (userCourseFilter) {
                        const userCoIds = (u.sdms_course_ids && u.sdms_course_ids.length > 0)
                          ? u.sdms_course_ids.map(String)
                          : (u.sdms_course_id ? [String(u.sdms_course_id)] : []);
                        if (userCoIds.length > 0 && !userCoIds.includes(String(userCourseFilter))) return false;
                      }
                      return true;
                    })
                    .map((u) => {
                    // Count granted pages
                    const effectivePerms = u.permissions || u.role_id?.permissions || {};
                    const readCount = PORTAL_PAGES.filter(p => effectivePerms[p.id]?.read || effectivePerms[p.id] === 'read' || effectivePerms[p.id] === 'write').length;
                    const writeCount = PORTAL_PAGES.filter(p => effectivePerms[p.id]?.write || effectivePerms[p.id] === 'write').length;

                    return (
                      <tr key={u._id} className="hover:bg-blue-50/40 transition">
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm flex-shrink-0">
                              {u.name?.charAt(0)?.toUpperCase() || u.username?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{u.name || u.username}</p>
                              <p className="text-xs text-gray-500 truncate">{u.email || `@${u.username}`}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          {u.emp_no ? (
                            <span className="font-mono bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded text-xs font-semibold">
                              {u.emp_no}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400 italic">None (Local)</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                              {u.role_id?.name || u.role}
                            </span>
                            {(u.department_name || u.designation_name) && (
                              <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[200px]">
                                {u.department_name} {u.designation_name ? `• ${u.designation_name}` : ''}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3">
                          {u.role === 'superadmin' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                              <Building2 className="h-3 w-3" />
                              All Colleges (Global)
                            </span>
                          ) : (() => {
                            const collegeNames = (u.sdms_college_names || (u.sdms_college_name ? [u.sdms_college_name] : []))
                              .filter(name => name && !String(name).toLowerCase().includes('null'));
                            const courseNames = (u.sdms_course_names || (u.sdms_course_name ? [u.sdms_course_name] : []))
                              .filter(name => name && !String(name).toLowerCase().includes('null'));
                            const branchNames = (u.sdms_branch_names || (u.sdms_branch_name ? [u.sdms_branch_name] : []))
                              .filter(name => name && !String(name).toLowerCase().includes('null'));
                            const validYears = (u.sdms_years || (u.sdms_year ? [u.sdms_year] : []))
                              .map(Number)
                              .filter(y => Number.isSafeInteger(y) && y > 0);

                            const hasAnyScope = collegeNames.length > 0 || courseNames.length > 0 || branchNames.length > 0 || validYears.length > 0;

                            if (!hasAnyScope) {
                              return <span className="text-xs text-gray-400 italic">Unassigned (Global)</span>;
                            }

                            return (
                              <div className="text-xs space-y-1 max-w-[240px]">
                                {collegeNames.length > 0 ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <Building2 className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                                    {collegeNames.length <= 2 ? (
                                      collegeNames.map((cn, i) => (
                                        <span key={i} className="font-semibold text-gray-900 bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded text-[11px] truncate max-w-[190px]" title={cn}>
                                          {cn}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded text-[11px]" title={collegeNames.join(', ')}>
                                        {collegeNames[0]} +{collegeNames.length - 1} more
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-slate-500 font-medium text-[11px]">
                                    <Building2 className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                    <span>All Colleges</span>
                                  </div>
                                )}

                                {(courseNames.length > 0 || branchNames.length > 0) && (
                                  <div className="text-[11px] text-gray-600 flex items-center gap-1 flex-wrap pl-5">
                                    {courseNames.length > 0 && (
                                      <span className="font-medium text-gray-700">
                                        {courseNames.join(', ')}
                                      </span>
                                    )}
                                    {branchNames.length > 0 && (
                                      <span className="text-gray-400">• {branchNames.join(', ')}</span>
                                    )}
                                  </div>
                                )}

                                {validYears.length > 0 && (
                                  <div className="flex items-center gap-1 flex-wrap pl-5 pt-0.5">
                                    {validYears.map((yr, idx) => (
                                      <span key={idx} className="bg-indigo-50 text-indigo-700 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                                        {formatYearBadge(yr)}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>

                        <td className="py-2.5 px-3">
                          {u.role === 'superadmin' ? (
                            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Full Access (All Pages)
                            </span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium">
                                {readCount} Read
                              </span>
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-medium">
                                {writeCount} Write
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          {u.auth_source === 'hrms' ? (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 font-medium">
                              <Database className="h-3 w-3 text-blue-500" />
                              HRMS DB
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-600 font-medium">
                              <Key className="h-3 w-3 text-gray-400" />
                              Local
                            </span>
                          )}
                        </td>

                        <td className="py-2.5 px-3">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                              u.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${u.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {u.status === 'active' ? 'Active' : 'Inactive'}
                          </button>
                        </td>

                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditUserModal(u)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Edit Permissions & Role"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            {u.role !== 'superadmin' && (
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Revoke Portal Access"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {userPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                Showing page {userPagination.page} of {userPagination.totalPages} ({userPagination.total} total users)
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={userPage <= 1}
                  onClick={() => setUserPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={userPage >= userPagination.totalPages}
                  onClick={() => setUserPage(p => p + 1)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Roles & Permissions Matrix */}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-b-2xl border-b border-x border-gray-200 shadow-sm p-6 space-y-6 -mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Configured Portal Roles</h2>
              <p className="text-xs text-gray-500">Define role templates with default read & write permissions for each portal page.</p>
            </div>
            <button
              onClick={() => openRoleModal(null)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow hover:from-blue-700 hover:to-indigo-700 transition"
            >
              <Shield className="h-4 w-4" />
              Create Custom Role
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {roles.map((role) => {
              const perms = role.permissions || {};
              const readCount = PORTAL_PAGES.filter(p => perms[p.id]?.read).length;
              const writeCount = PORTAL_PAGES.filter(p => perms[p.id]?.write).length;

              return (
                <div key={role._id} className="border border-gray-200 rounded-2xl p-5 hover:border-blue-300 hover:shadow-md transition bg-gradient-to-br from-white to-gray-50/50 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                          <Shield className="h-5 w-5" />
                        </span>
                        <div>
                          <h3 className="font-bold text-gray-900 text-base">{role.name}</h3>
                          <span className="text-[11px] font-mono text-gray-400">key: {role.key}</span>
                        </div>
                      </div>

                      {role.is_system ? (
                        <span className="text-[11px] font-semibold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                          System Role
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                          Custom Role
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-600 mt-2 line-clamp-2 min-h-[32px]">
                      {role.description || 'No description provided.'}
                    </p>

                    {/* Permissions Preview Pills */}
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>Page Permissions Breakdown</span>
                        <span className="font-semibold text-gray-700">{readCount} Read / {writeCount} Write</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {PORTAL_PAGES.map(page => {
                          const p = perms[page.id] || {};
                          const canR = Boolean(p.read);
                          const canW = Boolean(p.write);

                          return (
                            <div key={page.id} className="flex items-center justify-between px-2 py-1 bg-white border border-gray-100 rounded text-[11px]">
                              <span className="text-gray-700 truncate mr-1">{page.name}</span>
                              <div className="flex gap-1 flex-shrink-0">
                                <span className={`px-1 rounded text-[10px] font-mono ${canR ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-400'}`}>
                                  R
                                </span>
                                <span className={`px-1 rounded text-[10px] font-mono ${canW ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'}`}>
                                  W
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-medium">
                      Assigned Users: <strong className="text-gray-900">{role.user_count || 0}</strong>
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openRoleModal(role)}
                        className="px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        Edit Permissions
                      </button>
                      {!role.is_system && (
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: HRMS Directory */}
      {activeTab === 'hrms_directory' && (
        <div className="bg-white rounded-b-2xl border-b border-x border-gray-200 shadow-sm p-6 space-y-4 -mt-6">
          <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
            <div className="relative w-full md:w-96">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search HRMS staff by emp_no or name..."
                value={hrmsSearch}
                onChange={(e) => { setHrmsSearch(e.target.value); setHrmsPage(1); }}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={hrmsDeptFilter}
                onChange={(e) => { setHrmsDeptFilter(e.target.value); setHrmsPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white max-w-xs"
              >
                <option value="">All Departments</option>
                {hrmsDepartments.map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>

              <button
                onClick={fetchHrmsDirectory}
                className="p-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition"
                title="Refresh HRMS directory"
              >
                <RefreshCw className={`h-4 w-4 ${hrmsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {hrmsLoading ? (
            <div className="p-4">
              <SkeletonLoader type="table" count={5} />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Emp No</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Portal Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {hrmsEmployees.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-12 text-center text-gray-500">
                        <Database className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                        <p className="font-medium text-gray-700">No HRMS employees found</p>
                      </td>
                    </tr>
                  ) : (
                    hrmsEmployees.map(emp => (
                      <tr key={emp.emp_no} className="hover:bg-blue-50/30 transition">
                        <td className="py-3 px-4">
                          <p className="font-semibold text-gray-900">{emp.employee_name}</p>
                          <p className="text-xs text-gray-400">{emp.email || emp.phone_number || 'No contact specified'}</p>
                        </td>

                        <td className="py-3 px-4 font-mono font-semibold text-xs text-blue-700">
                          {emp.emp_no}
                        </td>

                        <td className="py-3 px-4 text-xs font-medium text-gray-700">
                          {emp.department_name}
                        </td>

                        <td className="py-3 px-4 text-xs text-gray-600">
                          {emp.designation_name}
                        </td>

                        <td className="py-3 px-4">
                          {emp.is_linked ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="h-3 w-3" />
                              Linked ({emp.portal_user?.role})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              Not Linked
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openLinkModalForEmployee(emp)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-sm ${
                              emp.is_linked
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {emp.is_linked ? 'Edit Access' : 'Link as User'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {hrmsPagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-gray-500">
                Page {hrmsPagination.page} of {hrmsPagination.totalPages} ({hrmsPagination.total} HRMS records)
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={hrmsPage <= 1}
                  onClick={() => setHrmsPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  disabled={hrmsPage >= hrmsPagination.totalPages}
                  onClick={() => setHrmsPage(p => p + 1)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-xs disabled:opacity-40 hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: LINK HRMS USER MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showLinkModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Link HRMS Employee to Portal</h3>
                  <p className="text-xs text-gray-500">Employee will login using their Employee Number and HRMS database password.</p>
                </div>
                <button onClick={() => setShowLinkModal(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Step 1: Select Employee */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  1. Search HRMS Employee by Number or Name
                </label>
                <div className="relative">
                  <Search className="h-4 w-4 text-gray-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Type emp_no (e.g. 1482) or employee name..."
                    value={linkSearchQuery}
                    onChange={(e) => {
                      setLinkSearchQuery(e.target.value);
                      if (selectedHrmsEmp && e.target.value !== selectedHrmsEmp.emp_no) {
                        setSelectedHrmsEmp(null);
                      }
                    }}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {linkSearchLoading && (
                    <div className="absolute right-3 top-3">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    </div>
                  )}
                </div>

                {/* Dropdown search results */}
                {linkSearchResults.length > 0 && !selectedHrmsEmp && (
                  <div className="mt-2 border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100 bg-white">
                    {linkSearchResults.map(emp => (
                      <div
                        key={emp.emp_no}
                        onClick={() => {
                          setSelectedHrmsEmp(emp);
                          setLinkSearchQuery(`${emp.employee_name} (${emp.emp_no})`);
                          setLinkSearchResults([]);
                        }}
                        className="p-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition text-sm"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{emp.employee_name}</p>
                          <p className="text-xs text-gray-500">{emp.department_name} • {emp.designation_name}</p>
                        </div>
                        <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold">
                          {emp.emp_no}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Employee Card */}
                {selectedHrmsEmp && (
                  <div className="mt-3 p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                        {selectedHrmsEmp.employee_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{selectedHrmsEmp.employee_name}</p>
                        <p className="text-xs text-gray-600">
                          Emp No: <strong className="font-mono">{selectedHrmsEmp.emp_no}</strong> • {selectedHrmsEmp.department_name} ({selectedHrmsEmp.designation_name})
                        </p>
                      </div>
                    </div>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-1 rounded-full">
                      Verified HRMS Staff
                    </span>
                  </div>
                )}
              </div>

              {/* Step 2: Select Role */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  2. Assign Role Template
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => handleSelectRoleInLinkModal(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium"
                >
                  <option value="">-- Select a Role --</option>
                  {roles.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.name} {r.is_system ? '(System)' : '(Custom)'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 3: SDMS Institutional Scope & Assignment */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-700" />
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      3. SDMS Institutional Assignment & Scope
                    </span>
                  </div>
                  <span className="text-[11px] font-medium">
                    {selectedRoleId && roles.find(r => r._id === selectedRoleId)?.key === 'campus_admin' ? (
                      <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">College required for Campus Admin</span>
                    ) : selectedRoleId && roles.find(r => r._id === selectedRoleId)?.key === 'course_admin' ? (
                      <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">College & Course required for Course Admin</span>
                    ) : (
                      <span className="text-blue-700">Optional for Faculty / Evaluator</span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MultiSelectDropdown
                    label={`College / Campus ${roles.find(r => r._id === selectedRoleId)?.key === 'campus_admin' || roles.find(r => r._id === selectedRoleId)?.key === 'course_admin' ? '*' : ''}`}
                    options={sdmsColleges}
                    selectedValues={linkSdmsCollegeIds}
                    onChange={(next) => setLinkSdmsCollegeIds(next)}
                    placeholder="Select Colleges..."
                    allLabel="All Colleges (Unrestricted)"
                  />

                  <MultiSelectDropdown
                    label={`Course ${roles.find(r => r._id === selectedRoleId)?.key === 'course_admin' ? '*' : ''}`}
                    options={linkAvailableCourses}
                    selectedValues={linkSdmsCourseIds}
                    onChange={(next) => setLinkSdmsCourseIds(next)}
                    placeholder="Select Courses..."
                    allLabel="All Courses"
                  />

                  <MultiSelectDropdown
                    label="Branch / Specialization"
                    options={linkAvailableBranches}
                    selectedValues={linkSdmsBranchIds}
                    onChange={(next) => setLinkSdmsBranchIds(next)}
                    placeholder="Select Branches..."
                    allLabel="All Branches"
                  />

                  <MultiSelectDropdown
                    label="Year Wise Access"
                    options={YEAR_OPTIONS}
                    selectedValues={linkSdmsYears}
                    onChange={(next) => setLinkSdmsYears(next)}
                    placeholder="Select Years..."
                    allLabel="All Years (1st to 6th Year)"
                  />
                </div>
              </div>

              {/* Step 4: Granular Page Permissions Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    4. Page Read & Write Permissions
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setAllPermissions(setCustomPermissions, true, true)}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Grant Full
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setAllPermissions(setCustomPermissions, true, false)}
                      className="text-gray-600 hover:underline font-semibold"
                    >
                      Read Only
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setAllPermissions(setCustomPermissions, false, false)}
                      className="text-red-500 hover:underline font-semibold"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {PORTAL_PAGES.map(page => {
                    const p = customPermissions[page.id] || {};
                    const canRead = Boolean(p.read);
                    const canWrite = Boolean(p.write);

                    return (
                      <div key={page.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition text-sm">
                        <div className="max-w-xs">
                          <p className="font-semibold text-gray-900">{page.name}</p>
                          <p className="text-[11px] text-gray-500">{page.description}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={canRead}
                              onChange={() => togglePagePermission(customPermissions, setCustomPermissions, page.id, 'read')}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            Read
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={canWrite}
                              onChange={() => togglePagePermission(customPermissions, setCustomPermissions, page.id, 'write')}
                              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            Write
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Callout */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  The user can immediately log in on the CRT login screen using their <strong>Employee Number</strong> and their <strong>HRMS database password</strong>.
                </p>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingUser || !selectedHrmsEmp}
                  onClick={handleSaveLinkUser}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50"
                >
                  {savingUser ? 'Linking...' : 'Link User & Grant Access'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 2: CREATE / EDIT ROLE MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showRoleModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {editingRole ? `Edit Role: ${editingRole.name}` : 'Create New Custom Role'}
                  </h3>
                  <p className="text-xs text-gray-500">Define role details and granular read & write access for each portal page.</p>
                </div>
                <button onClick={() => setShowRoleModal(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Placement Evaluator, Department Coordinator"
                    value={roleName}
                    disabled={editingRole?.is_system}
                    onChange={(e) => setRoleName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the role responsibilities..."
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    rows="2"
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Permissions Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Page Permissions (Read & Write)
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setAllPermissions(setRolePermissions, true, true)}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Grant Full
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setAllPermissions(setRolePermissions, true, false)}
                      className="text-gray-600 hover:underline font-semibold"
                    >
                      Read Only
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setAllPermissions(setRolePermissions, false, false)}
                      className="text-red-500 hover:underline font-semibold"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {PORTAL_PAGES.map(page => {
                    const p = rolePermissions[page.id] || {};
                    const canRead = Boolean(p.read);
                    const canWrite = Boolean(p.write);

                    return (
                      <div key={page.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition text-sm">
                        <div className="max-w-xs">
                          <p className="font-semibold text-gray-900">{page.name}</p>
                          <p className="text-[11px] text-gray-500">{page.description}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={canRead}
                              onChange={() => togglePagePermission(rolePermissions, setRolePermissions, page.id, 'read')}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            Read
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={canWrite}
                              onChange={() => togglePagePermission(rolePermissions, setRolePermissions, page.id, 'write')}
                              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            Write
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingRole || !roleName.trim()}
                  onClick={handleSaveRole}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md disabled:opacity-50"
                >
                  {savingRole ? 'Saving...' : editingRole ? 'Update Role' : 'Create Role'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================ */}
      {/* MODAL 3: EDIT USER PERMISSIONS MODAL */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showEditUserModal && editingUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    Edit User: {editingUser.name || editingUser.username}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {editingUser.emp_no ? `HRMS Emp No: ${editingUser.emp_no}` : `Username: ${editingUser.username}`}
                  </p>
                </div>
                <button onClick={() => setShowEditUserModal(false)} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Assign Role Template
                  </label>
                  <select
                    value={editUserRoleId}
                    onChange={(e) => {
                      setEditUserRoleId(e.target.value);
                      const r = roles.find(item => item._id === e.target.value);
                      if (r && r.permissions) {
                        setEditUserPermissions(JSON.parse(JSON.stringify(r.permissions)));
                      }
                    }}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">-- Custom Role --</option>
                    {roles.map(r => (
                      <option key={r._id} value={r._id}>{r.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Portal Status
                  </label>
                  <select
                    value={editUserStatus}
                    onChange={(e) => setEditUserStatus(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="active">Active (Permitted)</option>
                    <option value="inactive">Inactive (Suspended)</option>
                  </select>
                </div>
              </div>

              {/* SDMS Institutional Assignment & Scope */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-700" />
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      SDMS Institutional Assignment & Scope
                    </span>
                  </div>
                  <span className="text-[11px] font-medium">
                    {(() => {
                      const curRole = roles.find(r => r._id === editUserRoleId)?.key || editingUser?.role;
                      if (curRole === 'campus_admin') {
                        return <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">College required for Campus Admin</span>;
                      }
                      if (curRole === 'course_admin') {
                        return <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full">College & Course required for Course Admin</span>;
                      }
                      return <span className="text-blue-700">Optional for Faculty / Evaluator</span>;
                    })()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <MultiSelectDropdown
                    label={`College / Campus ${(() => {
                      const curRole = roles.find(r => r._id === editUserRoleId)?.key || editingUser?.role;
                      return curRole === 'campus_admin' || curRole === 'course_admin' ? '*' : '';
                    })()}`}
                    options={sdmsColleges}
                    selectedValues={editSdmsCollegeIds}
                    onChange={(next) => setEditSdmsCollegeIds(next)}
                    placeholder="Select Colleges..."
                    allLabel="All Colleges (Unrestricted)"
                  />

                  <MultiSelectDropdown
                    label={`Course ${(() => {
                      const curRole = roles.find(r => r._id === editUserRoleId)?.key || editingUser?.role;
                      return curRole === 'course_admin' ? '*' : '';
                    })()}`}
                    options={editAvailableCourses}
                    selectedValues={editSdmsCourseIds}
                    onChange={(next) => setEditSdmsCourseIds(next)}
                    placeholder="Select Courses..."
                    allLabel="All Courses"
                  />

                  <MultiSelectDropdown
                    label="Branch / Specialization"
                    options={editAvailableBranches}
                    selectedValues={editSdmsBranchIds}
                    onChange={(next) => setEditSdmsBranchIds(next)}
                    placeholder="Select Branches..."
                    allLabel="All Branches"
                  />

                  <MultiSelectDropdown
                    label="Year Wise Access"
                    options={YEAR_OPTIONS}
                    selectedValues={editSdmsYears}
                    onChange={(next) => setEditSdmsYears(next)}
                    placeholder="Select Years..."
                    allLabel="All Years (1st to 6th Year)"
                  />
                </div>
              </div>

              {/* Permissions Matrix */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Custom Page Permissions Overrides
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setAllPermissions(setEditUserPermissions, true, true)}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Grant Full
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setAllPermissions(setEditUserPermissions, true, false)}
                      className="text-gray-600 hover:underline font-semibold"
                    >
                      Read Only
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => setAllPermissions(setEditUserPermissions, false, false)}
                      className="text-red-500 hover:underline font-semibold"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                  {PORTAL_PAGES.map(page => {
                    const p = editUserPermissions[page.id] || {};
                    const canRead = Boolean(p.read);
                    const canWrite = Boolean(p.write);

                    return (
                      <div key={page.id} className="p-3 flex items-center justify-between hover:bg-gray-50 transition text-sm">
                        <div className="max-w-xs">
                          <p className="font-semibold text-gray-900">{page.name}</p>
                          <p className="text-[11px] text-gray-500">{page.description}</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={canRead}
                              onChange={() => togglePagePermission(editUserPermissions, setEditUserPermissions, page.id, 'read')}
                              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                            />
                            Read
                          </label>

                          <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                            <input
                              type="checkbox"
                              checked={canWrite}
                              onChange={() => togglePagePermission(editUserPermissions, setEditUserPermissions, page.id, 'write')}
                              className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                            />
                            Write
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditUser}
                  className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-md"
                >
                  Save User Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserManagement;
