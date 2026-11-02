import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { 
  BrainCircuit, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Award,
  Calendar,
  BarChart3,
  PlayCircle,
  Trophy,
  Sparkles,
  Zap,
  ArrowRight,
  Code,
  Headphones,
  Mic,
  PenTool,
  Bookmark,
  ChevronRight,
  Compass,
  CheckCircle,
  Calculator
} from 'lucide-react';

const getModuleIcon = (moduleId) => {
  switch (moduleId) {
    case 'quantitative':
      return <Calculator className="h-5 w-5 text-blue-600" />;
    case 'reasoning':
      return <BrainCircuit className="h-5 w-5 text-emerald-600" />;
    case 'technical':
      return <Code className="h-5 w-5 text-purple-600" />;
    case 'grammar':
      return <BrainCircuit className="h-5 w-5 text-indigo-600" />;
    case 'reading':
      return <BookOpen className="h-5 w-5 text-teal-600" />;
    case 'listening':
      return <Headphones className="h-5 w-5 text-violet-600" />;
    case 'speaking':
      return <Mic className="h-5 w-5 text-rose-600" />;
    case 'writing':
      return <PenTool className="h-5 w-5 text-amber-600" />;
    case 'vocabulary':
      return <Bookmark className="h-5 w-5 text-cyan-600" />;
    default:
      return <Award className="h-5 w-5 text-slate-600" />;
  }
};

const getScoreColor = (score) => {
  if (score >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-rose-600 bg-rose-50 border-rose-200';
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [onlineExams, setOnlineExams] = useState([]);
  const [completedExamIds, setCompletedExamIds] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('crt'); // 'crt' or 'versant'

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        // Load summary, profile, online exams, completed exams concurrently
        const [sumRes, profRes, examsRes, compRes] = await Promise.allSettled([
          api.get('/student/dashboard-summary'),
          api.get('/student/profile'),
          api.get('/student/online-exams'),
          api.get('/student/completed-exams')
        ]);

        if (isMounted) {
          if (sumRes.status === 'fulfilled' && sumRes.value.data?.success) {
            setSummary(sumRes.value.data.data);
          }
          if (profRes.status === 'fulfilled' && profRes.value.data?.success) {
            setUserProfile(profRes.value.data.data);
          }
          if (compRes.status === 'fulfilled' && compRes.value.data?.success) {
            const compIds = compRes.value.data.data || [];
            setCompletedExamIds(Array.isArray(compIds) ? compIds.map(String) : []);
          }
          if (examsRes.status === 'fulfilled' && examsRes.value.data?.success) {
            setOnlineExams(examsRes.value.data.data || []);
          }
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboard();
    return () => { isMounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-28">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const studentName = userProfile?.name || user?.name || user?.username || 'Student';
  const campusName = userProfile?.campus || 'Placement Training Program';

  // Stats safe fallback
  const totalCompleted = summary?.total_tests_completed || 0;
  const bestScore = summary?.highest_score || 0;
  const avgScore = summary?.average_score || 0;
  const scoredWellCount = summary?.practice_scored_well || 0;
  const onlineCount = summary?.online_exams_count || 0;
  const practiceCount = summary?.practice_tests_count || 0;

  // Filter online exams
  const now = new Date();
  const upcomingAndActiveExams = onlineExams.filter(exam => {
    const end = new Date(exam.endDateTime);
    return now <= end;
  });

  const crtModules = (summary?.modules || []).filter(m => m.category === 'CRT');
  const versantModules = (summary?.modules || []).filter(m => m.category === 'Versant');
  const recentActivities = summary?.recent_activities || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-5 sm:p-7 border border-slate-200 shadow-sm relative overflow-hidden"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                {campusName}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] font-semibold text-slate-500">
                Placement & Skill Assessment Portal
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Welcome back, {studentName}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              Track your scheduled placement exams, take automated CRT & Versant practice tests, and analyze your topic performance.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/student/crt"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-colors"
            >
              <span>CRT Practice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to="/student/practice"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs transition-colors"
            >
              <span>Versant Practice</span>
            </Link>
          </div>
        </div>

        {/* 4 Summary Highlight Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-100">
          {/* 1: Tests Completed */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tests Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {totalCompleted}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {onlineCount} Online • {practiceCount} Practice
            </div>
          </div>

          {/* 2: Best Score */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Highest Score</span>
              <Trophy className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600">
              {bestScore}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Personal Best Score
            </div>
          </div>

          {/* 3: Average Score */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Average Score</span>
              <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-indigo-600">
              {avgScore}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Across all evaluations
            </div>
          </div>

          {/* 4: Practice Mastery */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/60">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Practice Mastery</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-600">
              {scoredWellCount}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              Tests scored ≥ 60%
            </div>
          </div>
        </div>
      </motion.div>

      {/* Online Exams Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-orange-50 text-orange-600 border border-orange-200">
              <Calendar className="w-4 h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Assigned Online Exams
            </h2>
          </div>
          <Link
            to="/student/exams"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All Exams</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {upcomingAndActiveExams.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-sm">
            <Calendar className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">No active or upcoming online exams currently scheduled.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">New college and placement assessments will automatically appear here when published.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {upcomingAndActiveExams.slice(0, 3).map((exam) => {
              const start = new Date(exam.startDateTime);
              const end = new Date(exam.endDateTime);
              const isCompleted = completedExamIds.includes(String(exam._id));
              const isActive = !isCompleted && now >= start && now <= end;
              const isUpcoming = !isCompleted && now < start;

              return (
                <div
                  key={exam._id}
                  className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all shadow-sm flex flex-col justify-between ${
                    isActive ? 'border-emerald-300 ring-2 ring-emerald-500/10' :
                    isCompleted ? 'border-purple-200' : 'border-slate-200'
                  }`}
                >
                  <div>
                    {/* Header with status badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {exam.module_id || 'Assessment'}
                      </span>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Submitted
                        </span>
                      ) : isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full animate-pulse">
                          ● Open Now
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2 leading-snug">
                      {exam.title}
                    </h3>

                    {/* Metadata details */}
                    <div className="mt-3 space-y-1 text-[11px] text-slate-500">
                      <div className="flex items-center justify-between">
                        <span>Duration:</span>
                        <strong className="text-slate-700">{exam.duration || 30} mins</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Questions:</span>
                        <strong className="text-slate-700">{exam.total_questions || exam.questions?.length || 25} Qs</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Deadline:</span>
                        <span className="text-slate-700 font-medium">{end.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    {isCompleted ? (
                      <Link
                        to="/student/history"
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>View Results</span>
                      </Link>
                    ) : isActive ? (
                      <Link
                        to={`/student/exam?testid=${exam._id}`}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
                      >
                        <span>Start Exam Now</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <div className="text-center py-1.5 text-xs text-slate-400 font-medium">
                        Opens {start.toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Access Action Hub */}
      <div className="space-y-3">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>Quick Actions</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Link
            to="/student/crt"
            className="group bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl p-4 sm:p-5 border border-blue-200/80 hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                <Calculator className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                CRT Practice Modules
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Quantitative Aptitude, Logical Reasoning & Technical CS practice tests.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-700">
              <span>Practice Now</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/student/practice"
            className="group bg-gradient-to-br from-indigo-50 to-purple-50/60 rounded-2xl p-4 sm:p-5 border border-indigo-200/80 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors">
                Versant English Practice
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Grammar, Reading, Listening, Speaking, Writing & Vocabulary.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-indigo-700">
              <span>Practice Now</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/student/exams"
            className="group bg-gradient-to-br from-emerald-50 to-teal-50/60 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                Online Exams
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Scheduled college tests and automated placement assessments.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-emerald-700">
              <span>View Schedule</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/student/history"
            className="group bg-gradient-to-br from-orange-50 to-amber-50/60 rounded-2xl p-4 sm:p-5 border border-orange-200/80 hover:border-orange-300 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-700 transition-colors">
                Exam History & Review
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Detailed results, score breakdowns, and question-by-question analysis.
              </p>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-bold text-orange-700">
              <span>View Submissions</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Learning & Skill Progress (CRT vs Versant) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Module Progress */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>Module Learning Progress</span>
                </h2>
                <p className="text-[11px] text-slate-500">Track tests taken and high scores across CRT and Versant tracks</p>
              </div>

              {/* Tabs */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-bold self-start">
                <button
                  onClick={() => setActiveTab('crt')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    activeTab === 'crt' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  CRT Modules
                </button>
                <button
                  onClick={() => setActiveTab('versant')}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    activeTab === 'versant' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Versant English
                </button>
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(activeTab === 'crt' ? crtModules : versantModules).map((m) => {
                const scoreColor = getScoreColor(m.highest_score);
                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {getModuleIcon(m.id)}
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                          {m.name}
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                        {m.attempts_count} Test{m.attempts_count !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="space-y-1.5 my-1">
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>Best Score:</span>
                        <strong className="text-slate-800">{m.highest_score}%</strong>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(m.highest_score, m.attempts_count * 20))}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Scored Well: <strong className="text-emerald-700">{m.scored_well_count}</strong></span>
                      <Link
                        to={activeTab === 'crt' ? '/student/crt' : '/student/practice'}
                        className="text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        Practice →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Recent Activity */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <span>Recent Activity</span>
                </h2>
                <Link
                  to="/student/history"
                  className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                >
                  View All
                </Link>
              </div>

              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No recent test attempts found.</p>
                  <p className="text-[10px] mt-0.5">Attempt practice or online exams to see live updates here.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentActivities.map((act) => {
                    const isOnline = act.test_type === 'online_exam';
                    const score = Math.round(Number(act.score || 0));
                    return (
                      <div
                        key={act._id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1 ${
                              isOnline ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {isOnline ? 'Online Exam' : 'Practice Test'}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {act.test_name}
                            </h4>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(act.submitted_at).toLocaleDateString()} • {act.correct_answers}/{act.total_questions} correct
                            </p>
                          </div>

                          <div className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${
                            score >= 60 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {score}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Link
                to="/student/profile"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold transition-colors"
              >
                <span>View Full Analytics Profile</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
