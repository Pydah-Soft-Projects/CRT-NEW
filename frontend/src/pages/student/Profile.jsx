import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import api from '../../services/api';
import { formatPhotoUrl } from '../../utils/photoUtils';
import { 
  User, 
  Mail, 
  Hash, 
  Building, 
  BookOpen, 
  Users, 
  ArrowLeft, 
  Phone, 
  Target,
  Trophy,
  TrendingUp,
  Award,
  Sparkles,
  CheckCircle2,
  BrainCircuit,
  Compass,
  ChevronRight
} from 'lucide-react';

const ProfileCard = ({ icon, title, value }) => (
  <div className="bg-slate-50 hover:bg-slate-100/80 rounded-lg sm:rounded-xl p-2 sm:p-3.5 flex items-center space-x-2 sm:space-x-3 transition-colors border border-slate-200/60">
    <div className="p-1.5 sm:p-2 rounded-lg bg-white shadow-sm border border-slate-200/70 text-indigo-600 shrink-0">
      {React.cloneElement(icon, { className: 'h-3.5 w-3.5 sm:h-4 sm:w-4' })}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-0.5">{title}</p>
      <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">{value || 'N/A'}</p>
    </div>
  </div>
);

const getScoreColor = (score) => {
  if (score >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-rose-600 bg-rose-50 border-rose-200';
};

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoError, setPhotoError] = useState(false);
  const { error: showError } = useNotification();

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await api.get('/student/profile');
        if (res.data?.success && isMounted) {
          setProfile(res.data.data);
        } else if (isMounted) {
          showError(res.data?.message || 'Failed to fetch profile.');
        }
      } catch (err) {
        if (isMounted) {
          showError(err.response?.data?.message || 'An error occurred while fetching your profile.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, []); // Empty dependency array to prevent repeated infinite calls

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 max-w-lg mx-auto shadow-sm">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <User className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-slate-800 mb-1">Could not load profile</h3>
        <p className="text-xs text-slate-500 mb-4">We were unable to load your account information. Please try refreshing.</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
        >
          Refresh Page
        </button>
      </div>
    );
  }

  const analytics = profile.analytics || {
    total_practice_tests: 0,
    scored_well_count: 0,
    scored_well_rate: 0,
    average_score: 0,
    best_score: 0,
    total_questions_attempted: 0,
    total_correct_answers: 0,
    overall_accuracy: 0,
    modules: []
  };

  const moduleList = analytics.modules || [];

  return (
    <div className="w-full max-w-6xl mx-auto space-y-3 sm:space-y-6 pb-6 sm:pb-12">
      {/* Back to Dashboard Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/student"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg sm:rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors shadow-sm"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Main Student Profile Identity Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-6 border border-slate-200 shadow-sm"
      >
        <div className="flex flex-col lg:flex-row items-center lg:items-start gap-4 sm:gap-6">
          {/* Avatar and Basic Header */}
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left shrink-0">
            <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md mb-2 sm:mb-3 border border-indigo-100 flex-shrink-0">
              {(!photoError && formatPhotoUrl(profile.photo || profile.student_photo)) ? (
                <img
                  src={formatPhotoUrl(profile.photo || profile.student_photo)}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={() => setPhotoError(true)}
                />
              ) : (
                <User className="h-7 w-7 sm:h-10 sm:w-10" />
              )}
            </div>
            <h1 className="text-sm sm:text-lg font-bold text-slate-900 leading-snug">{profile.name}</h1>
            <p className="text-[11px] sm:text-xs text-slate-500 font-medium break-all">{profile.email}</p>
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] sm:text-[11px] font-bold">
              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
              <span>Verified Student</span>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
            <ProfileCard icon={<Hash />} title="Roll Number / PIN" value={profile.roll_number} />
            <ProfileCard icon={<Building />} title="Campus / College" value={profile.campus} />
            <ProfileCard icon={<BookOpen />} title="Course" value={profile.course} />
            <ProfileCard icon={<Users />} title="Branch & Batch" value={profile.batch || profile.branch} />
            <ProfileCard icon={<Phone />} title="Mobile Number" value={profile.mobile_number} />
            <ProfileCard icon={<Mail />} title="Official Email" value={profile.email} />
          </div>
        </div>
      </motion.div>

      {/* Advanced Practice Test Analytics Section */}
      <div className="space-y-2.5 sm:space-y-4">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <div className="p-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Practice Analytics & Mastery
            </h2>
          </div>
          <p className="hidden sm:block text-xs text-slate-500">
            Real-time performance metrics tracking your practice test attempts, score distribution, and module proficiencies.
          </p>
        </div>

        {/* 4 Summary Highlight Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Card 1: Tests Attempted */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">Practice Tests</span>
              <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-slate-900">
                {analytics.total_practice_tests}
              </div>
              <div className="text-[9px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                Tests completed
              </div>
            </div>
          </div>

          {/* Card 2: Scored Well (>=60%) */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">Mastery (≥60%)</span>
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500" />
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-emerald-600">
                {analytics.scored_well_count}
                <span className="text-xs font-semibold text-slate-400 ml-1">/ {analytics.total_practice_tests}</span>
              </div>
              <div className="text-[9px] sm:text-[11px] font-bold text-emerald-700 mt-0.5 truncate">
                {analytics.scored_well_rate}% mastery rate
              </div>
            </div>
          </div>

          {/* Card 3: Average Score */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">Average Score</span>
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-500" />
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-indigo-600">
                {analytics.average_score}%
              </div>
              <div className="text-[9px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                Across evaluations
              </div>
            </div>
          </div>

          {/* Card 4: Best Score */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-2.5 sm:p-4 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[9px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">Highest Score</span>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500" />
            </div>
            <div>
              <div className="text-xl sm:text-3xl font-extrabold text-amber-600">
                {analytics.best_score}%
              </div>
              <div className="text-[9px] sm:text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                Personal best
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy and Questions Solved Strip */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-lg sm:rounded-xl p-2.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
            <span className="font-semibold text-slate-800 text-[11px] sm:text-xs">
              Question Accuracy:
            </span>
            <span className="font-bold text-indigo-700 text-xs sm:text-sm">
              {analytics.overall_accuracy}%
            </span>
            <span className="text-slate-500 text-[10px] sm:text-xs">
              ({analytics.total_correct_answers}/{analytics.total_questions_attempted} correct)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[10px] sm:text-[11px]">
            <Link
              to="/student/crt"
              className="font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
            >
              CRT Practice
            </Link>
            <span className="text-slate-300">•</span>
            <Link
              to="/student/practice"
              className="font-bold text-indigo-600 hover:text-indigo-800 underline underline-offset-2"
            >
              Versant Practice
            </Link>
          </div>
        </div>

        {/* Module-Wise Practice Tests Breakdown */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
              Module-Wise Practice Breakdown
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              {moduleList.length} module{moduleList.length !== 1 ? 's' : ''} attempted
            </span>
          </div>

          {moduleList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">No Practice Tests Attempted Yet</h4>
              <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                Start practicing with automated tests to generate your module-wise score analytics, accuracy rates, and level progress.
              </p>
              <div className="flex justify-center gap-3">
                <Link
                  to="/student/crt"
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  CRT Modules
                </Link>
                <Link
                  to="/student/practice"
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                >
                  Versant Modules
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
              {moduleList.map((m) => {
                const scoreBadge = getScoreColor(m.average_score);
                return (
                  <div
                    key={m.key}
                    className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header of Module Card */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className={`inline-block text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full mb-1 ${
                            m.category === 'CRT' 
                              ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                              : 'bg-purple-50 text-purple-700 border border-purple-200'
                          }`}>
                            {m.category} Module
                          </span>
                          <h4 className="text-xs sm:text-base font-bold text-slate-900 leading-snug">
                            {m.name}
                          </h4>
                        </div>
                        <span className="text-[10px] sm:text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg shrink-0">
                          {m.tests_attempted} Test{m.tests_attempted !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {/* Scored Well Metric Bar */}
                      <div className="space-y-1 my-2">
                        <div className="flex items-center justify-between text-[11px] sm:text-xs">
                          <span className="text-slate-500 font-medium">Scored Well (≥60%):</span>
                          <span className="font-bold text-emerald-700">
                            {m.scored_well_count}/{m.tests_attempted} ({m.scored_well_rate}%)
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 rounded-full h-1.5 sm:h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              m.scored_well_rate >= 75 ? 'bg-emerald-500' :
                              m.scored_well_rate >= 50 ? 'bg-blue-500' :
                              m.scored_well_rate >= 25 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(5, m.scored_well_rate)}%` }}
                          />
                        </div>
                      </div>

                      {/* Scores Grid */}
                      <div className="grid grid-cols-2 gap-2 my-2 p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                        <div>
                          <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Avg Score</div>
                          <div className={`text-sm sm:text-base font-extrabold ${m.average_score >= 60 ? 'text-indigo-600' : 'text-slate-700'}`}>
                            {m.average_score}%
                          </div>
                        </div>
                        <div className="border-l border-slate-200">
                          <div className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400">Best Score</div>
                          <div className={`text-sm sm:text-base font-extrabold ${m.best_score >= 60 ? 'text-emerald-600' : 'text-slate-700'}`}>
                            {m.best_score}%
                          </div>
                        </div>
                      </div>

                      {/* Level Distribution Pills */}
                      {m.levels && (
                        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                          <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400">Levels:</span>
                          <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${m.levels[1] > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                            L1: {m.levels[1] || 0}
                          </span>
                          <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${m.levels[2] > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                            L2: {m.levels[2] || 0}
                          </span>
                          <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded ${m.levels[3] > 0 ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-400'}`}>
                            L3: {m.levels[3] || 0}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Footer / Accuracy */}
                    <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500">
                      <span>Accuracy: <strong className="text-slate-800">{m.accuracy}%</strong></span>
                      {m.latest_attempt_at && (
                        <span>Last: {new Date(m.latest_attempt_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
