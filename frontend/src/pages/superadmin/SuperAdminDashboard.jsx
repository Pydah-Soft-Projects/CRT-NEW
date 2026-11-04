import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import {
  Users,
  FileText,
  CheckCircle2,
  TrendingUp,
  BarChart3,
  FilePlus,
  Layers,
  Activity,
  ShieldCheck,
  Building2,
  GraduationCap,
  Calendar,
  Clock,
  ChevronRight,
  ArrowUpRight,
  RefreshCw,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import api from '../../services/api';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const { error } = useNotification();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const response = await api.get('/superadmin/dashboard');
      if (response.data.success) {
        setData(response.data.data);
      } else {
        error(response.data.message || 'Failed to load dashboard data.');
      }
    } catch (err) {
      console.error('Dashboard API error:', err);
      error(err.response?.data?.message || err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <SkeletonLoader type="dashboard" />;
  }

  const isSuperadmin = user?.role === 'superadmin';
  const scopeInfo = data?.scopeInfo || {};
  const isScoped = data?.isScoped || scopeInfo?.isScoped || false;
  const stats = data?.statistics || {};

  const totalStudents = data?.totalStudents || stats?.total_students || 0;
  const totalTests = data?.totalTests || stats?.total_tests || 0;
  const totalAttempts = stats?.total_attempts ?? data?.totalAttempts ?? 0;
  const averageScore = stats?.average_score ?? data?.averageScore ?? 0;
  const passRate = stats?.pass_rate ?? data?.passRate ?? 0;

  const scoreDist = data?.scoreDistribution || { excellent: 0, good: 0, average: 0, needs_improvement: 0 };
  const totalDistCount = Object.values(scoreDist).reduce((sum, n) => sum + (Number(n) || 0), 0) || 1;

  const statCards = [
    {
      title: isScoped ? 'Assigned Students' : 'Total Students',
      value: totalStudents.toLocaleString(),
      subtext: isScoped ? 'Within assigned access scope' : `${data?.totalUsers || 0} registered portal accounts`,
      icon: Users,
      gradient: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700 border-blue-200',
      link: '/superadmin/students'
    },
    {
      title: 'Available Tests',
      value: totalTests.toLocaleString(),
      subtext: `${stats?.active_exams || data?.activeExamsCount || 0} Online Exams • ${stats?.practice_modules || data?.practiceTestsCount || 0} Practice`,
      icon: FileText,
      gradient: 'from-purple-600 to-indigo-700',
      bgLight: 'bg-purple-50 text-purple-700 border-purple-200',
      link: '/superadmin/tests'
    },
    {
      title: 'Completed Attempts',
      value: totalAttempts.toLocaleString(),
      subtext: totalAttempts > 0 ? `${passRate}% passing rate` : 'Awaiting student submissions',
      icon: CheckCircle2,
      gradient: 'from-emerald-600 to-teal-600',
      bgLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      link: '/superadmin/results'
    },
    {
      title: 'Average Score',
      value: `${averageScore}%`,
      subtext: `Performance index (${passRate}% passed)`,
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-600',
      bgLight: 'bg-amber-50 text-amber-700 border-amber-200',
      link: '/superadmin/results'
    }
  ];

  const quickActions = [
    {
      title: 'Online Tests',
      description: 'Manage exams & schedules',
      icon: FilePlus,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      link: '/superadmin/tests'
    },
    {
      title: 'Results Management',
      description: 'Review scores & attempts',
      icon: BarChart3,
      color: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      link: '/superadmin/results'
    },
    {
      title: 'Student Directory',
      description: 'View students & credentials',
      icon: Users,
      color: 'bg-emerald-600 hover:bg-emerald-700 text-white',
      link: '/superadmin/students'
    },
    {
      title: 'CRT Modules',
      description: 'Curriculum & question banks',
      icon: Layers,
      color: 'bg-purple-600 hover:bg-purple-700 text-white',
      link: '/superadmin/crt-upload'
    },
    {
      title: 'Progress Tracking',
      description: 'Track mastery & completion',
      icon: Activity,
      color: 'bg-teal-600 hover:bg-teal-700 text-white',
      link: '/superadmin/progress-tracking'
    },
    ...(isSuperadmin ? [{
      title: 'User & Roles',
      description: 'Configure staff & scopes',
      icon: ShieldCheck,
      color: 'bg-slate-800 hover:bg-slate-900 text-white',
      link: '/superadmin/user-management'
    }] : [])
  ];

  return (
    <div className="w-full min-h-screen bg-slate-50/50 p-3 sm:p-4 md:p-5 lg:p-6 space-y-4 md:space-y-5">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name || user?.username || 'Administrator'}!
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              {user?.role_name || user?.role || 'Admin'}
            </span>
          </div>

          {/* Access Scope Indicator */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            {isScoped ? (
              <div className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg text-indigo-900 font-medium">
                <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span><strong className="text-indigo-950">Assigned Scope:</strong> {scopeInfo.scopeSummary}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg text-emerald-900 font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span><strong className="text-emerald-950">Institutional Scope:</strong> Global (All Campuses & Programs)</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboardStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>
      </motion.div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{card.title}</p>
                  <h3 className="text-2xl font-extrabold text-slate-900 mt-1.5 tracking-tight group-hover:text-blue-600 transition-colors">
                    {card.value}
                  </h3>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${card.gradient} text-white shadow-sm group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate">{card.subtext}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Middle Grid: Quick Actions + Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick Actions Hub */}
        <div className="lg:col-span-2 bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Administrative Hub</h2>
              <p className="text-[11px] text-slate-500">Frequently used management tools</p>
            </div>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Link
                  key={action.title}
                  to={action.link}
                  className="flex flex-col p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-sm bg-slate-50/50 hover:bg-blue-50/40 transition group"
                >
                  <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center shadow-sm mb-2 group-hover:scale-105 transition-transform`}>
                    <ActionIcon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {action.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Score Distribution Breakdown */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Score Distribution</h2>
              <p className="text-[11px] text-slate-500">Student performance benchmarks</p>
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
              Avg: {averageScore}%
            </span>
          </div>

          <div className="space-y-2.5 pt-1">
            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1">
                <span className="text-emerald-700">Excellent (&ge; 75%)</span>
                <span className="text-slate-600 font-semibold">{scoreDist.excellent} ({Math.round((scoreDist.excellent / totalDistCount) * 100)}%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((scoreDist.excellent / totalDistCount) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1">
                <span className="text-blue-700">Good (60% - 74%)</span>
                <span className="text-slate-600 font-semibold">{scoreDist.good} ({Math.round((scoreDist.good / totalDistCount) * 100)}%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((scoreDist.good / totalDistCount) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1">
                <span className="text-amber-700">Average (40% - 59%)</span>
                <span className="text-slate-600 font-semibold">{scoreDist.average} ({Math.round((scoreDist.average / totalDistCount) * 100)}%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((scoreDist.average / totalDistCount) * 100)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] font-medium mb-1">
                <span className="text-rose-700">Needs Review (&lt; 40%)</span>
                <span className="text-slate-600 font-semibold">{scoreDist.needs_improvement} ({Math.round((scoreDist.needs_improvement / totalDistCount) * 100)}%)</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.round((scoreDist.needs_improvement / totalDistCount) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-2.5 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Pass Rate: <strong className="text-slate-900">{passRate}%</strong></span>
            <Link to="/superadmin/results" className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
              Full Results <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Active Tests + Recent Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Active & Scheduled Tests */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Online Exams</h2>
              <p className="text-[11px] text-slate-500">Currently active tests in your scope</p>
            </div>
            <Link
              to="/superadmin/tests"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {Array.isArray(data?.activeTests) && data.activeTests.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.activeTests.map((t) => (
                <div key={t._id} className="py-2.5 flex items-center justify-between gap-4 first:pt-1 last:pb-1">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{t.title}</h4>
                    <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-500 mt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {t.duration} mins
                      </span>
                      <span>•</span>
                      <span>{t.question_count} Questions</span>
                      <span>•</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[10px]">
                        {t.category || 'CRT'}
                      </span>
                    </div>
                  </div>
                  <Link
                    to={`/superadmin/results`}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-[11px] font-semibold text-slate-700 hover:text-blue-700 transition shrink-0"
                  >
                    View Scores
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-7 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">No active exams found</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Create a new test or check your access scope filters.</p>
              <Link
                to="/superadmin/tests"
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                Create Test <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Live Recent Submissions Table */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Student Attempts</h2>
              <p className="text-[11px] text-slate-500">Live submission activity</p>
            </div>
            <Link
              to="/superadmin/results"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              All Results <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {Array.isArray(data?.recentAttempts) && data.recentAttempts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {data.recentAttempts.map((attempt) => {
                const score = attempt.percentage ?? attempt.score ?? 0;
                const isPassed = score >= 40;
                return (
                  <div key={attempt._id} className="py-2.5 flex items-center justify-between gap-3 first:pt-1 last:pb-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                          {attempt.roll_number}
                        </span>
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                          {attempt.student_name}
                        </p>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {attempt.test_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          score >= 75
                            ? 'bg-emerald-100 text-emerald-800'
                            : score >= 60
                            ? 'bg-blue-100 text-blue-800'
                            : isPassed
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {score}%
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'Recent'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-7 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs font-semibold text-slate-700">No test attempts yet</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Student submissions in your scope will appear here in real-time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
