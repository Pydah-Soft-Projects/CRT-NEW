import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  FilePlus,
  Users,
  BarChart,
  Building2,
  ChevronRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  RefreshCw,
  ArrowUpRight,
  Sparkles
} from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const CampusAdminDashboard = () => {
  const { user } = useAuth();
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

      // Call campus-admin dashboard with graceful fallback
      let res;
      try {
        res = await api.get('/campus-admin/dashboard');
      } catch (err) {
        res = await api.get('/superadmin/dashboard');
      }

      if (res?.data?.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching campus dashboard stats:', error);
      toast.error('Failed to fetch campus dashboard statistics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading campus dashboard..." />;
  }

  const stats = data?.statistics || {};
  const totalStudents = data?.totalStudents ?? stats?.total_students ?? 0;
  const totalTests = data?.totalTests ?? stats?.total_tests ?? 0;
  const totalBatches = data?.totalBatches ?? stats?.total_batches ?? 0;
  const activeExams = data?.active_exams ?? stats?.active_exams ?? 0;
  const totalAttempts = data?.totalAttempts ?? stats?.total_attempts ?? 0;
  const averageScore = data?.averageScore ?? stats?.average_score ?? 0;
  const recentAttempts = data?.recentAttempts || [];

  const dashboardCards = [
    {
      title: 'Campus Students',
      value: totalStudents.toLocaleString(),
      subtext: 'Enrolled in assigned colleges',
      icon: Users,
      gradient: 'from-blue-600 to-indigo-600',
      path: '/campus-admin/students'
    },
    {
      title: 'Active & Total Tests',
      value: totalTests.toLocaleString(),
      subtext: `${activeExams} Active Online Exams`,
      icon: FilePlus,
      gradient: 'from-purple-600 to-indigo-700',
      path: '/campus-admin/tests'
    },
    {
      title: 'Completed Submissions',
      value: totalAttempts.toLocaleString(),
      subtext: 'Student exam submissions',
      icon: CheckCircle2,
      gradient: 'from-emerald-600 to-teal-600',
      path: '/campus-admin/reports'
    },
    {
      title: 'Average Performance',
      value: `${averageScore}%`,
      subtext: 'Average student score',
      icon: TrendingUp,
      gradient: 'from-amber-500 to-orange-600',
      path: '/campus-admin/reports'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 space-y-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Welcome back, {user?.name || 'Campus Administrator'}!
            </h1>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
              Campus Admin
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Building2 className="h-4 w-4 text-blue-600 shrink-0" />
            <p>
              Institutional Campus: <span className="font-semibold text-slate-800">{user?.campus_name || user?.sdms_college_name || 'Assigned SDMS Campuses'}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchDashboardStats(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition shadow-sm disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </motion.div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={() => navigate(card.path)}
              className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.title}</p>
                  <h3 className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight group-hover:text-blue-600 transition-colors">
                    {card.value}
                  </h3>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="truncate">{card.subtext}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Content: Quick Actions & Live Submissions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Campus Actions</h2>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>

          <div className="space-y-3 pt-1">
            <Link
              to="/campus-admin/tests"
              className="flex items-center p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/50 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm mr-3.5 group-hover:scale-105 transition-transform">
                <FilePlus className="w-5 h-5" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Campus Tests
                </h4>
                <p className="text-xs text-slate-500 truncate">Create & schedule tests for campus</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/campus-admin/students"
              className="flex items-center p-3.5 rounded-xl border border-slate-200 hover:border-emerald-400 bg-slate-50/60 hover:bg-emerald-50/50 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm mr-3.5 group-hover:scale-105 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Student Directory
                </h4>
                <p className="text-xs text-slate-500 truncate">View campus students from SDMS</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/campus-admin/reports"
              className="flex items-center p-3.5 rounded-xl border border-slate-200 hover:border-purple-400 bg-slate-50/60 hover:bg-purple-50/50 transition group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm mr-3.5 group-hover:scale-105 transition-transform">
                <BarChart className="w-5 h-5" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                  Reports & Scores
                </h4>
                <p className="text-xs text-slate-500 truncate">Detailed exam performance & attempts</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Live Recent Test Submissions */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Recent Campus Submissions</h2>
              <p className="text-xs text-slate-500">Live submissions from campus students</p>
            </div>
            <Link
              to="/campus-admin/reports"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
            >
              View Full Reports <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentAttempts.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentAttempts.map((attempt) => {
                const pct = attempt.percentage ?? attempt.score ?? 0;
                return (
                  <div key={attempt._id} className="py-3.5 flex items-center justify-between gap-3 first:pt-1 last:pb-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                          {attempt.roll_number}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {attempt.student_name}
                        </p>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {attempt.test_name}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        pct >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : pct >= 60
                          ? 'bg-blue-100 text-blue-800'
                          : pct >= 40
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {pct}%
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : 'Recent'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No submissions yet</p>
              <p className="text-xs text-slate-500 mt-1">Student exam submissions in your campus will appear here automatically.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CampusAdminDashboard;
