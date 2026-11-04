import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  BrainCircuit, 
  Headphones, 
  Mic, 
  Calculator, 
  Lightbulb,
  Users,
  BarChart3,
  TrendingUp,
  Eye,
  Search,
  Filter,
  X,
  Target,
  Clock,
  Award,
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Activity,
  Zap,
  Brain,
  Star,
  Trophy,
  RefreshCw,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronLeft,
  ArrowUpRight,
  FilePlus,
  Sparkles,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import TestProgressChart from '../../components/student/TestProgressChart';
import SuperAdminAttemptDetailsModal from '../../components/superadmin/SuperAdminAttemptDetailsModal';
import api from '../../services/api';

const ProgressTracking = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentProgress, setShowStudentProgress] = useState(false);
  const [showAttemptDetails, setShowAttemptDetails] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  
  const [practiceTests, setPracticeTests] = useState({});
  const [testStudents, setTestStudents] = useState({ attempted: [], unattempted: [] });
  const [studentProgress, setStudentProgress] = useState(null);
  
  // UI filter & layout states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, attempted, unattempted, high, low
  const [sortBy, setSortBy] = useState('score_desc'); // score_desc, score_asc, name_asc, roll_asc, attempts_desc
  const [viewMode, setViewMode] = useState('grid'); // grid, table
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  
  const { success, error } = useNotification();
  const location = useLocation();

  const basePath = location.pathname.startsWith('/campus-admin')
    ? '/campus-admin'
    : location.pathname.startsWith('/course-admin')
    ? '/course-admin'
    : '/superadmin';

  // Base module definitions with vibrant gradients and themed icons
  const baseModules = [
    { id: 'CRT', name: 'CRT Modules', icon: Target, color: 'text-indigo-600', bgColor: 'bg-indigo-50', gradient: 'from-indigo-500 to-purple-600', activeRing: 'ring-indigo-500' },
    { id: 'APTITUDE', name: 'Aptitude', icon: Calculator, color: 'text-rose-600', bgColor: 'bg-rose-50', gradient: 'from-rose-500 to-pink-600', activeRing: 'ring-rose-500' },
    { id: 'REASONING', name: 'Reasoning', icon: Lightbulb, color: 'text-amber-600', bgColor: 'bg-amber-50', gradient: 'from-amber-500 to-yellow-600', activeRing: 'ring-amber-500' },
    { id: 'GRAMMAR', name: 'Grammar', icon: BookOpen, color: 'text-blue-600', bgColor: 'bg-blue-50', gradient: 'from-blue-500 to-cyan-600', activeRing: 'ring-blue-500' },
    { id: 'VOCABULARY', name: 'Vocabulary', icon: BrainCircuit, color: 'text-emerald-600', bgColor: 'bg-emerald-50', gradient: 'from-emerald-500 to-teal-600', activeRing: 'ring-emerald-500' },
    { id: 'READING', name: 'Reading', icon: BookOpen, color: 'text-teal-600', bgColor: 'bg-teal-50', gradient: 'from-teal-500 to-emerald-600', activeRing: 'ring-teal-500' },
    { id: 'WRITING', name: 'Writing', icon: FilePlus, color: 'text-violet-600', bgColor: 'bg-violet-50', gradient: 'from-violet-500 to-purple-600', activeRing: 'ring-violet-500' },
    { id: 'LISTENING', name: 'Listening', icon: Headphones, color: 'text-purple-600', bgColor: 'bg-purple-50', gradient: 'from-purple-500 to-indigo-600', activeRing: 'ring-purple-500' },
    { id: 'SPEAKING', name: 'Speaking', icon: Mic, color: 'text-orange-600', bgColor: 'bg-orange-50', gradient: 'from-orange-500 to-amber-600', activeRing: 'ring-orange-500' },
  ];

  // Merge dynamic custom CRT modules from backend
  const modules = useMemo(() => {
    const knownIds = new Set(baseModules.map(m => m.id));
    const extraModules = Object.keys(practiceTests || {})
      .filter(key => !knownIds.has(key) && Array.isArray(practiceTests[key]) && practiceTests[key].length > 0)
      .map(key => ({
        id: key,
        name: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
        icon: Brain,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        gradient: 'from-indigo-600 to-blue-600',
        activeRing: 'ring-indigo-500'
      }));
    return [...baseModules, ...extraModules];
  }, [practiceTests]);

  useEffect(() => {
    fetchPracticeTests();
  }, []);

  const fetchPracticeTests = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const response = await api.get(`${basePath}/practice-tests-by-module`);
      if (response.data.success) {
        const testsData = response.data.data || {};
        setPracticeTests(testsData);

        // Auto-select first module that has tests if none selected
        if (!selectedModule) {
          const modWithTests = modules.find(m => (testsData[m.id] || []).length > 0) || modules[0];
          if (modWithTests) {
            setSelectedModule(modWithTests);
            const firstTest = (testsData[modWithTests.id] || [])[0];
            if (firstTest) {
              setSelectedTest(firstTest);
              fetchTestStudents(firstTest.test_id);
            }
          }
        } else if (selectedTest) {
          // Re-fetch current test students quietly
          fetchTestStudents(selectedTest.test_id, true);
        }
      } else {
        error('Failed to fetch practice tests');
      }
    } catch (err) {
      console.error('Error fetching practice tests:', err);
      error('Failed to fetch practice tests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchTestStudents = async (testId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get(`${basePath}/test-assigned-students/${testId}`);
      if (response.data.success) {
        setTestStudents({
          attempted: response.data.data.attempted_students || [],
          unattempted: response.data.data.unattempted_students || [],
          test: response.data.data.test,
          summary: response.data.data.summary
        });
        setCurrentPage(1);
      } else {
        error('Failed to fetch test students');
      }
    } catch (err) {
      console.error('Error fetching test students:', err);
      error('Failed to fetch test students');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchStudentProgress = async (studentId, testId) => {
    try {
      setLoading(true);
      const response = await api.get(`${basePath}/student-test-progress/${studentId}/${testId}`);
      if (response.data.success) {
        setStudentProgress(response.data.data);
      } else {
        error('Failed to fetch student progress');
      }
    } catch (err) {
      console.error('Error fetching student progress:', err);
      error('Failed to fetch student progress');
    } finally {
      setLoading(false);
    }
  };

  const handleModuleSelect = (module) => {
    setSelectedModule(module);
    const tests = practiceTests[module.id] || [];
    if (tests.length > 0) {
      setSelectedTest(tests[0]);
      fetchTestStudents(tests[0].test_id);
    } else {
      setSelectedTest(null);
      setTestStudents({ attempted: [], unattempted: [] });
    }
    setShowStudentProgress(false);
  };

  const handleTestSelect = (test) => {
    setSelectedTest(test);
    fetchTestStudents(test.test_id);
    setShowStudentProgress(false);
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    if (selectedTest) {
      fetchStudentProgress(student.student_id, selectedTest.test_id);
      setShowStudentProgress(true);
    }
  };

  const handleAttemptClick = (attempt) => {
    setSelectedAttempt(attempt);
    setShowAttemptDetails(true);
  };

  const handleCloseStudentProgress = () => {
    setShowStudentProgress(false);
    setSelectedStudent(null);
    setStudentProgress(null);
  };

  const handleCloseAttemptDetails = () => {
    setShowAttemptDetails(false);
    setSelectedAttempt(null);
  };

  const getScoreColor = (score) => {
    if (typeof score !== 'number' || isNaN(score)) return 'text-slate-400';
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreBgColor = (score) => {
    if (typeof score !== 'number' || isNaN(score)) return 'bg-slate-100 text-slate-700';
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (score >= 40) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  // Behavioral insights
  const getStudentBehaviorInsights = (student) => {
    if (student.latest_score === null || student.latest_score === undefined) return null;
    
    const insights = {
      performance: 'average',
      trend: 'stable',
      consistency: 'medium',
      engagement: 'low'
    };

    if (student.latest_score >= 85) insights.performance = 'excellent';
    else if (student.latest_score >= 70) insights.performance = 'good';
    else if (student.latest_score >= 50) insights.performance = 'average';
    else insights.performance = 'needs-improvement';

    if (student.total_attempts > 1) {
      if (student.latest_score > (student.highest_score || 0) * 0.95) insights.trend = 'improving';
      else if (student.latest_score < (student.highest_score || 0) * 0.75) insights.trend = 'declining';
    }

    if (student.total_attempts >= 4) insights.engagement = 'high';
    else if (student.total_attempts >= 2) insights.engagement = 'medium';
    else insights.engagement = 'low';

    return insights;
  };

  const getPerformanceBadge = (insights) => {
    if (!insights) return null;
    
    const badges = {
      excellent: { icon: Trophy, color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300', text: 'Top Performer' },
      good: { icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300', text: 'Proficient' },
      average: { icon: Target, color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300', text: 'Developing' },
      'needs-improvement': { icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-100 border-rose-300', text: 'Needs Help' }
    };

    const badge = badges[insights.performance];
    if (!badge) return null;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap flex-shrink-0 ${badge.bg} ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getTrendIndicator = (insights) => {
    if (!insights || insights.trend === 'stable') return null;
    
    const trends = {
      improving: { icon: ArrowUp, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', text: 'Trending Up' },
      declining: { icon: ArrowDown, color: 'text-rose-600 bg-rose-50 border-rose-200', text: 'Declining' }
    };

    const trend = trends[insights.trend];
    if (!trend) return null;
    const Icon = trend.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap flex-shrink-0 ${trend.color}`}>
        <Icon className="w-3 h-3" />
        {trend.text}
      </span>
    );
  };

  // Filter & Sort Students
  const filteredAndSortedStudents = useMemo(() => {
    let list = [];
    const attemptedList = testStudents.attempted || [];
    const unattemptedList = testStudents.unattempted || [];

    if (filterType === 'attempted') {
      list = [...attemptedList];
    } else if (filterType === 'unattempted') {
      list = [...unattemptedList];
    } else if (filterType === 'high') {
      list = attemptedList.filter(s => typeof s.latest_score === 'number' && s.latest_score >= 80);
    } else if (filterType === 'low') {
      list = attemptedList.filter(s => typeof s.latest_score === 'number' && s.latest_score < 60);
    } else {
      list = [...attemptedList, ...unattemptedList];
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(s => 
        (s.name && s.name.toLowerCase().includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.roll_number && s.roll_number.toLowerCase().includes(q))
      );
    }

    list.sort((a, b) => {
      const aScore = typeof a.latest_score === 'number' ? a.latest_score : -1;
      const bScore = typeof b.latest_score === 'number' ? b.latest_score : -1;

      switch (sortBy) {
        case 'score_desc':
          return bScore - aScore;
        case 'score_asc':
          return aScore - bScore;
        case 'name_asc':
          return (a.name || '').localeCompare(b.name || '');
        case 'roll_asc':
          return (a.roll_number || '').localeCompare(b.roll_number || '');
        case 'attempts_desc':
          return (b.total_attempts || 0) - (a.total_attempts || 0);
        default:
          return 0;
      }
    });

    return list;
  }, [testStudents, filterType, searchTerm, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedStudents.slice(start, start + pageSize);
  }, [filteredAndSortedStudents, currentPage, pageSize]);

  // Counts for filter pills
  const counts = useMemo(() => {
    const attemptedCount = (testStudents.attempted || []).length;
    const unattemptedCount = (testStudents.unattempted || []).length;
    const highCount = (testStudents.attempted || []).filter(s => typeof s.latest_score === 'number' && s.latest_score >= 80).length;
    const lowCount = (testStudents.attempted || []).filter(s => typeof s.latest_score === 'number' && s.latest_score < 60).length;
    return {
      all: attemptedCount + unattemptedCount,
      attempted: attemptedCount,
      unattempted: unattemptedCount,
      high: highCount,
      low: lowCount
    };
  }, [testStudents]);

  if (loading && !selectedTest) {
    return (
      <div className="flex flex-col justify-center items-center h-full min-h-[60vh] space-y-4">
        <LoadingSpinner size="lg" />
        <p className="text-slate-500 font-medium">Loading Progress Analytics...</p>
      </div>
    );
  }

  const selectedModuleTests = (selectedModule && practiceTests[selectedModule.id]) || [];

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {/* Top Header Banner */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl shadow-md text-white">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Progress & Performance Analytics
                  </h1>
                  <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    Live SDMS Sync
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Track student cohort mastery, attempt histories, and performance distributions
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => fetchPracticeTests(true)}
                disabled={refreshing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition border border-slate-200 disabled:opacity-60"
                title="Refresh Analytics Data"
              >
                <RefreshCw className={`w-4 h-4 text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Horizontal Module Selector Tabs */}
          <div className="mt-5 pt-3 border-t border-slate-100 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex items-center gap-2 pb-1">
            {modules.map((mod) => {
              const tests = practiceTests[mod.id] || [];
              const isSelected = selectedModule?.id === mod.id;
              const Icon = mod.icon;

              return (
                <button
                  key={mod.id}
                  onClick={() => handleModuleSelect(mod)}
                  className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 ${
                    isSelected
                      ? `bg-gradient-to-r ${mod.gradient} text-white shadow-md shadow-indigo-500/20`
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : mod.color}`} />
                  <span>{mod.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tests.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 pt-6 space-y-6">
        {/* Module Sub-Selector (Tests in Module) */}
        {selectedModule && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  {selectedModule.name} Assessments
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  ({selectedModuleTests.length} Available)
                </span>
              </div>
              {selectedTest && (
                <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 self-start sm:self-auto">
                  Active: {selectedTest.test_name}
                </span>
              )}
            </div>

            {selectedModuleTests.length === 0 ? (
              <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="text-sm font-medium text-slate-500">
                  No tests or assessments currently configured for {selectedModule.name}.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Upload tests via CRT & Versant upload or Test Management to track this module.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3.5">
                {selectedModuleTests.map((test) => {
                  const isTestSelected = selectedTest?.test_id === test.test_id;
                  return (
                    <button
                      key={test.test_id}
                      onClick={() => handleTestSelect(test)}
                      className={`text-left p-3.5 rounded-xl transition border flex flex-col justify-between cursor-pointer group ${
                        isTestSelected
                          ? 'bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                          : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-bold line-clamp-2 ${isTestSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                          {test.test_name}
                        </h4>
                        {isTestSelected && (
                          <div className="w-2 h-2 rounded-full bg-indigo-600 flex-shrink-0 mt-1.5 animate-pulse" />
                        )}
                      </div>
                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium truncate max-w-[120px]">
                          {test.subcategory || 'Practice Test'}
                        </span>
                        <span className="font-semibold text-slate-600">
                          {test.total_questions || 0} Qs
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Selected Test Dashboard & Analytics */}
        {selectedTest ? (
          <div className="space-y-6">
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
              {/* Total Assigned */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cohort</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {testStudents.summary?.total_assigned || 0}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">Total eligible students</p>
                </div>
              </div>

              {/* Attempted */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempted</p>
                  <p className="text-2xl font-black text-emerald-600 tracking-tight">
                    {testStudents.summary?.attempted_count || 0}
                  </p>
                  <p className="text-[11px] text-emerald-700 font-medium truncate">
                    {testStudents.summary?.completion_rate || 0}% Completion
                  </p>
                </div>
              </div>

              {/* Pending / Not Started */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Not Started</p>
                  <p className="text-2xl font-black text-amber-600 tracking-tight">
                    {testStudents.summary?.unattempted_count || 0}
                  </p>
                  <p className="text-[11px] text-amber-700 font-medium truncate">Awaiting attempts</p>
                </div>
              </div>

              {/* Average Score */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Class Avg</p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {testStudents.summary?.average_score ? `${testStudents.summary.average_score.toFixed(1)}%` : 'N/A'}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">Mean attempt score</p>
                </div>
              </div>

              {/* Top Score */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Score</p>
                  <p className="text-2xl font-black text-purple-600 tracking-tight">
                    {testStudents.summary?.highest_score ? `${testStudents.summary.highest_score.toFixed(1)}%` : 'N/A'}
                  </p>
                  <p className="text-[11px] text-purple-700 font-medium truncate">Highest achieved</p>
                </div>
              </div>
            </div>

            {/* Filter, Search & View Controls Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search by student name, roll number, or email..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Sort & View Mode */}
                <div className="flex items-center gap-2.5 self-end md:self-auto">
                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                    >
                      <option value="score_desc">Score: High to Low</option>
                      <option value="score_asc">Score: Low to High</option>
                      <option value="name_asc">Name: A to Z</option>
                      <option value="roll_asc">Roll Number</option>
                      <option value="attempts_desc">Most Attempts</option>
                    </select>
                  </div>

                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-lg transition ${
                        viewMode === 'grid' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Grid Card View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`p-1.5 rounded-lg transition ${
                        viewMode === 'table' ? 'bg-white shadow-xs text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                {[
                  { key: 'all', label: 'All Students', count: counts.all, color: 'blue' },
                  { key: 'attempted', label: 'Attempted', count: counts.attempted, color: 'emerald' },
                  { key: 'unattempted', label: 'Not Started', count: counts.unattempted, color: 'amber' },
                  { key: 'high', label: 'Top Performers (≥80%)', count: counts.high, color: 'indigo' },
                  { key: 'low', label: 'Needs Help (<60%)', count: counts.low, color: 'rose' }
                ].map((f) => {
                  const isActive = filterType === f.key;
                  return (
                    <button
                      key={f.key}
                      onClick={() => {
                        setFilterType(f.key);
                        setCurrentPage(1);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                      }`}
                    >
                      <span>{f.label}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-700 shadow-2xs'
                        }`}
                      >
                        {f.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Students List Display */}
            {filteredAndSortedStudents.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No students matched</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Try adjusting your search query or switching the filter tab above.
                </p>
              </div>
            ) : viewMode === 'grid' ? (
              /* Modern Card Grid View */
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {paginatedStudents.map((student) => {
                    const hasAttempted = student.has_attempted || (typeof student.latest_score === 'number' && !isNaN(student.latest_score));
                    const insights = hasAttempted ? getStudentBehaviorInsights(student) : null;
                    const initials = (student.name || 'Student')
                      .split(' ')
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase();

                    return (
                      <div
                        key={student.student_id}
                        onClick={() => handleStudentSelect(student)}
                        className={`bg-white rounded-2xl p-5 border transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md ${
                          hasAttempted
                            ? 'border-slate-200/90 hover:border-blue-400'
                            : 'border-slate-200/70 hover:border-slate-300 opacity-90 hover:opacity-100 bg-slate-50/40'
                        }`}
                      >
                        {/* Student Details Header */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                  hasAttempted
                                    ? 'bg-blue-100 text-blue-800 font-extrabold'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate" title={student.name}>
                                  {student.name}
                                </h4>
                                <p className="text-xs font-semibold text-slate-500 font-mono">
                                  {student.roll_number || 'N/A'}
                                </p>
                              </div>
                            </div>
                            {hasAttempted ? (
                              getPerformanceBadge(insights)
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap flex-shrink-0">
                                <Clock className="w-3 h-3" />
                                Not Started
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-400 truncate mb-3" title={student.email}>
                            {student.email || 'No email registered'}
                          </p>

                          {/* Attempted Performance Metrics */}
                          {hasAttempted ? (
                            <div className="space-y-3 pt-3 border-t border-slate-100">
                              <div className="flex items-baseline justify-between">
                                <span className="text-xs font-semibold text-slate-500">Latest Score</span>
                                <span className={`text-2xl font-black ${getScoreColor(student.latest_score)}`}>
                                  {student.latest_score?.toFixed(1)}%
                                </span>
                              </div>

                              {/* Mini score progress bar */}
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    student.latest_score >= 80 ? 'bg-emerald-500' :
                                    student.latest_score >= 60 ? 'bg-blue-500' :
                                    student.latest_score >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, student.latest_score || 0))}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                                <span className="flex items-center gap-1 font-medium">
                                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                                  {student.total_attempts || 1} {student.total_attempts === 1 ? 'attempt' : 'attempts'}
                                </span>
                                <span className="flex items-center gap-1 font-semibold text-slate-700">
                                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                  {student.highest_score?.toFixed(1)}% Best
                                </span>
                              </div>
                            </div>
                          ) : (
                            /* Unattempted State */
                            <div className="py-4 text-center border-t border-slate-100">
                              <p className="text-xs font-medium text-slate-400">
                                No submissions recorded yet.
                              </p>
                              <span className="text-[11px] text-slate-400 mt-1 inline-block">
                                Click to view historical activity
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Card Footer Action */}
                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                          <span>{hasAttempted ? 'View History & Details' : 'Student Record'}</span>
                          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white px-5 py-3.5 rounded-2xl border border-slate-200 mt-4 shadow-xs">
                    <p className="text-xs font-medium text-slate-500">
                      Showing <span className="font-bold text-slate-900">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                      <span className="font-bold text-slate-900">
                        {Math.min(currentPage * pageSize, filteredAndSortedStudents.length)}
                      </span>{' '}
                      of <span className="font-bold text-slate-900">{filteredAndSortedStudents.length}</span> students
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-1.5 text-xs font-bold text-slate-800">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Detailed Table View */
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                        <th className="py-3.5 px-4">Student</th>
                        <th className="py-3.5 px-4">Roll Number</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4 text-right">Latest Score</th>
                        <th className="py-3.5 px-4 text-right">Best Score</th>
                        <th className="py-3.5 px-4 text-center">Attempts</th>
                        <th className="py-3.5 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {paginatedStudents.map((student) => {
                        const hasAttempted = student.has_attempted || (typeof student.latest_score === 'number' && !isNaN(student.latest_score));

                        return (
                          <tr
                            key={student.student_id}
                            className="hover:bg-slate-50/60 transition cursor-pointer"
                            onClick={() => handleStudentSelect(student)}
                          >
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900">{student.name}</div>
                              <div className="text-xs text-slate-400">{student.email || 'N/A'}</div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-medium text-slate-600 text-xs">
                              {student.roll_number || 'N/A'}
                            </td>
                            <td className="py-3.5 px-4">
                              {hasAttempted ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Attempted
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                  <Clock className="w-3.5 h-3.5" />
                                  Not Started
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {hasAttempted ? (
                                <span className={`font-black text-sm ${getScoreColor(student.latest_score)}`}>
                                  {student.latest_score?.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">None</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              {hasAttempted ? (
                                <span className="font-bold text-slate-800 text-sm">
                                  {student.highest_score?.toFixed(1)}%
                                </span>
                              ) : (
                                <span className="text-slate-400 text-xs italic">None</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-700 text-xs">
                              {student.total_attempts || 0}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStudentSelect(student);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition inline-flex items-center gap-1"
                              >
                                <span>Details</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between bg-white px-5 py-3 border-t border-slate-200">
                    <p className="text-xs font-medium text-slate-500">
                      Page <span className="font-bold text-slate-900">{currentPage}</span> of{' '}
                      <span className="font-bold text-slate-900">{totalPages}</span>
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty / No test selected state */
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Select an assessment to inspect</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
              Choose a module from the top navigation bar to analyze student participation, completion, and performance.
            </p>
          </div>
        )}
      </div>

      {/* Student Progress History & Trend Modal */}
      {showStudentProgress && studentProgress && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[92vh] overflow-hidden border border-slate-200 flex flex-col"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 p-6 text-white flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white font-bold text-lg">
                  {studentProgress.student.name?.charAt(0) || 'S'}
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight">
                    {studentProgress.student.name}
                  </h3>
                  <p className="text-xs text-blue-100 mt-0.5">
                    Roll: <span className="font-mono font-semibold">{studentProgress.student.roll_number}</span> •{' '}
                    {studentProgress.test.test_name}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseStudentProgress}
                className="p-2 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
              {/* Metric Cards Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Attempts</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {studentProgress.summary.total_attempts}
                  </p>
                  <p className="text-[11px] text-slate-400">Total recorded</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Highest Score</span>
                  <p className="text-2xl font-black text-amber-600 mt-1">
                    {studentProgress.summary.highest_score?.toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-amber-700 font-medium">Personal best</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Average Score</span>
                  <p className="text-2xl font-black text-blue-600 mt-1">
                    {studentProgress.summary.average_score?.toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-slate-400">Across attempts</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Latest Score</span>
                  <p className={`text-2xl font-black mt-1 ${getScoreColor(studentProgress.summary.latest_score)}`}>
                    {studentProgress.summary.latest_score?.toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-slate-400">Most recent</p>
                </div>
              </div>

              {/* Progress Line Chart */}
              {studentProgress.attempts && studentProgress.attempts.length > 0 && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-indigo-600" />
                    <h4 className="text-sm font-bold text-slate-900">Score Trajectory Over Attempts</h4>
                  </div>
                  <div className="h-64 w-full">
                    <TestProgressChart
                      attempts={studentProgress.attempts}
                      testName={studentProgress.test.test_name}
                    />
                  </div>
                </div>
              )}

              {/* Attempt History List */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <h4 className="text-sm font-bold text-slate-900">Attempt Records</h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {studentProgress.attempts?.length || 0} attempts found
                  </span>
                </div>

                {(!studentProgress.attempts || studentProgress.attempts.length === 0) ? (
                  <div className="p-8 text-center text-slate-400 text-sm">
                    No detailed submission history available for this student.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {studentProgress.attempts.map((attempt, index) => {
                      const score = attempt.score ?? 0;
                      return (
                        <div
                          key={attempt.attempt_id || index}
                          className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center flex-shrink-0">
                              #{index + 1}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${getScoreColor(score)}`}>
                                  {score.toFixed(1)}%
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getScoreBgColor(score)}`}>
                                  {score >= 80 ? 'Mastery' : score >= 60 ? 'Passing' : 'Review Needed'}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">
                                Submitted on {new Date(attempt.submitted_at).toLocaleString()} • {attempt.correct_answers || 0} / {attempt.total_questions || 0} Correct
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAttemptClick(attempt)}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Review Answers</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Detailed Question Review Modal */}
      {showAttemptDetails && selectedAttempt && (
        <SuperAdminAttemptDetailsModal
          isOpen={showAttemptDetails}
          onClose={handleCloseAttemptDetails}
          attempt={selectedAttempt}
          test={studentProgress?.test}
          basePath={basePath}
        />
      )}
    </div>
  );
};

export default ProgressTracking;
