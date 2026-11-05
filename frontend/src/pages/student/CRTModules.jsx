import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getAutoPracticeQuestions, submitPracticeTestResult } from '../../services/api';
import {
  BrainCircuit,
  BookOpen,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Layers,
  Award,
  Filter,
  CheckCircle2,
  Sliders,
  Settings2,
  X,
  PlayCircle
} from 'lucide-react';

const CRT_CATEGORIES = [
  {
    id: 'aptitude',
    name: 'Quantitative Aptitude',
    icon: '🧮',
    color: 'from-blue-600 to-indigo-600',
    description: 'Master arithmetic, percentages, speed-distance, work-time, and permutations.',
    topics: [
      { id: 'numbers', name: 'Numbers & Divisibility', desc: 'HCF, LCM, prime factors, divisibility rules and remainder theorems' },
      { id: 'percentages', name: 'Percentages, Profit & Loss', desc: 'Discounts, cost price, selling price, profit percentage and margins' },
      { id: 'work_time', name: 'Time, Work & Pipes', desc: 'Man-hours, alternating days, pipe cisterns and efficiency equations' },
      { id: 'speed_distance', name: 'Speed, Distance & Trains', desc: 'Relative speed, trains crossing platforms, boats and streams' },
      { id: 'ratio_proportion', name: 'Ratio, Proportion & Averages', desc: 'Mixtures, allegories, partnerships and weighted average questions' },
      { id: 'all', name: 'All Aptitude Topics', desc: 'Comprehensive practice across all quantitative aptitude concepts' }
    ]
  },
  {
    id: 'reasoning',
    name: 'Logical Reasoning',
    icon: '🧩',
    color: 'from-emerald-600 to-teal-600',
    description: 'Sharpen syllogisms, blood relations, series completion, coding-decoding, and puzzles.',
    topics: [
      { id: 'syllogisms', name: 'Syllogisms & Deductions', desc: 'Venn diagrams, statement-conclusion and deductive logic' },
      { id: 'blood_relations', name: 'Blood Relations', desc: 'Family trees, coded relations and pointing puzzle problems' },
      { id: 'series', name: 'Number & Letter Series', desc: 'Alternating patterns, arithmetic leaps and alphabetical sequences' },
      { id: 'coding_decoding', name: 'Coding & Decoding', desc: 'Shift ciphers, matrix coding and conditional deciphering' },
      { id: 'direction_puzzles', name: 'Direction Sense & Seating Puzzles', desc: 'Compass angles, linear arrangements and circular seating puzzles' },
      { id: 'all', name: 'All Reasoning Topics', desc: 'Comprehensive practice across analytical and logical reasoning' }
    ]
  },
  {
    id: 'technical',
    name: 'Technical & CS',
    icon: '⚙️',
    color: 'from-purple-600 to-violet-600',
    description: 'Practice core computer science, data structures, algorithms, DBMS, and OOP concepts.',
    topics: [
      { id: 'data_structures', name: 'Data Structures & Arrays', desc: 'Arrays, linked lists, stacks, queues, trees and traversal algorithms' },
      { id: 'oop', name: 'OOP Concepts & Principles', desc: 'Polymorphism, inheritance, encapsulation and abstraction questions' },
      { id: 'dbms_sql', name: 'DBMS & SQL Queries', desc: 'Relational algebra, normalization, joins, indexing and SQL syntax' },
      { id: 'algorithms', name: 'Algorithms & Complexity', desc: 'Sorting, searching, Big-O analysis and recursion logic' },
      { id: 'os_networks', name: 'Operating Systems & Networks', desc: 'Process scheduling, deadlocks, TCP/IP, OSI layers and protocols' },
      { id: 'all', name: 'All Technical Topics', desc: 'Comprehensive practice across programming and computer science core' }
    ]
  }
];

const DIFFICULTY_LEVELS = [
  { id: 1, name: 'Level 1: Fundamentals', shortName: 'Level 1', desc: 'Core concept mastery and standard problem solving' },
  { id: 2, name: 'Level 2: Intermediate', shortName: 'Level 2', desc: 'Multi-step problems and competitive campus questions' },
  { id: 3, name: 'Level 3: Advanced', shortName: 'Level 3', desc: 'Complex problem solving and placement benchmarks' }
];

export default function CRTModules() {
  const [searchParams] = useSearchParams();
  const initialModuleParam = searchParams.get('module');
  const [selectedModuleId, setSelectedModuleId] = useState(() => initialModuleParam || null);
  const [view, setView] = useState(() => initialModuleParam ? 'topics' : 'modules'); // 'modules', 'topics', 'test_list', 'taking_module', 'result'
  
  // Selected configuration
  const [activeTopic, setActiveTopic] = useState(null);
  const [activeLevel, setActiveLevel] = useState(1);
  const [questionCount, setQuestionCount] = useState(() => {
    const saved = localStorage.getItem('student_practice_question_count');
    return saved ? parseInt(saved, 10) : 15;
  });

  // Modal State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [pendingTopic, setPendingTopic] = useState(null);
  const [pendingLevel, setPendingLevel] = useState(1);

  // Test Taking State
  const [currentTestNumber, setCurrentTestNumber] = useState(1);
  const [completedTests, setCompletedTests] = useState({}); // { [key]: score }
  const [questions, setQuestions] = useState([]);
  const [moduleResult, setModuleResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { error: showError, success } = useNotification();

  const currentCategory = CRT_CATEGORIES.find(c => c.id === (selectedModuleId || 'aptitude')) || CRT_CATEGORIES[0];

  const handleSelectModule = (moduleId) => {
    setSelectedModuleId(moduleId);
    setView('topics');
  };

  const handleBackToModules = () => {
    setView('modules');
  };

  // 1. When student clicks a topic or level: open question count popup
  const handleSelectTopicAndLevel = (topic, level = 1) => {
    setPendingTopic(topic);
    setPendingLevel(level);
    setShowConfigModal(true);
  };

  // 2. When student confirms question count in popup: save to settings and show tests
  const handleConfirmSettings = (count) => {
    setQuestionCount(count);
    localStorage.setItem('student_practice_question_count', String(count));
    setActiveTopic(pendingTopic);
    setActiveLevel(pendingLevel);
    setShowConfigModal(false);
    setView('test_list');
  };

  // 3. Launch Practice Test (1, 2, 3...)
  const handleLaunchPracticeTest = async (testNumber) => {
    try {
      setLoading(true);
      setCurrentTestNumber(testNumber);

      const queryTopic = activeTopic.id === 'all' ? currentCategory.id : activeTopic.id;
      // Requests questions from DB with testNumber offset and previous questions excluded
      const res = await getAutoPracticeQuestions('CRT', queryTopic, questionCount, activeLevel, testNumber);
      const loadedQuestions = res?.data?.questions || [];
      
      if (loadedQuestions.length === 0) {
        showError('No questions available in the question bank for this topic & level yet. Please try another selection.');
        return;
      }
      setQuestions(loadedQuestions);
      setView('taking_module');
    } catch (err) {
      console.error('Error starting CRT practice:', err);
      showError('Failed to load practice questions from database.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit practice test
  const handleFinishTest = async (result) => {
    try {
      setLoading(true);
      await submitPracticeTestResult({
        module_id: 'CRT',
        subcategory: activeTopic?.id || currentCategory.id,
        topic: activeTopic?.id || currentCategory.id,
        level: activeLevel || 1,
        test_number: currentTestNumber,
        answers: result.answers,
        questions: result.questions,
        time_taken_seconds: result.timeTakenSeconds || 0
      });

      // Update completed state
      const testKey = `${currentCategory.id}_${activeTopic?.id}_${activeLevel}_${currentTestNumber}`;
      setCompletedTests(prev => ({
        ...prev,
        [testKey]: result.score
      }));

      success(`Practice Test ${currentTestNumber} submitted and saved to history!`);
    } catch (err) {
      console.error('Failed to save practice test result:', err);
    } finally {
      setLoading(false);
      setModuleResult(result);
      setView('result');
    }
  };

  const handleBackToTopics = () => {
    setView('topics');
    setQuestions([]);
    setModuleResult(null);
  };

  const handleBackToTestList = () => {
    setView('test_list');
    setQuestions([]);
    setModuleResult(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-2.5 sm:p-4 md:p-6 w-full max-w-full overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <LoadingSpinner />
            <p className="text-xs sm:text-sm text-slate-500 font-medium">Connecting to question bank...</p>
          </div>
        ) : view === 'modules' ? (
          <CRTModulesSelectionView
            categories={CRT_CATEGORIES}
            onSelectModule={handleSelectModule}
          />
        ) : view === 'topics' ? (
          <CRTTopicsWithLevelsView
            categories={CRT_CATEGORIES}
            selectedModuleId={selectedModuleId || 'aptitude'}
            onSelectModule={setSelectedModuleId}
            onBackToModules={handleBackToModules}
            onSelectTopicAndLevel={handleSelectTopicAndLevel}
          />
        ) : view === 'test_list' && activeTopic ? (
          <CRTTestsListView
            category={currentCategory}
            topic={activeTopic}
            level={activeLevel}
            questionCount={questionCount}
            completedTests={completedTests}
            onBack={handleBackToTopics}
            onOpenSettings={() => handleSelectTopicAndLevel(activeTopic, activeLevel)}
            onLaunchTest={handleLaunchPracticeTest}
          />
        ) : view === 'taking_module' ? (
          <CRTTestTakingView
            category={currentCategory}
            topic={activeTopic}
            level={activeLevel}
            testNumber={currentTestNumber}
            questions={questions}
            onSubmit={handleFinishTest}
            onBack={handleBackToTestList}
          />
        ) : view === 'result' ? (
          <CRTResultView
            category={currentCategory}
            topic={activeTopic}
            level={activeLevel}
            testNumber={currentTestNumber}
            result={moduleResult}
            onRetake={() => handleLaunchPracticeTest(currentTestNumber)}
            onNextTest={() => handleLaunchPracticeTest(currentTestNumber + 1)}
            onBack={handleBackToTestList}
          />
        ) : null}

        {/* Modal: Question Count Setting Popup */}
        <AnimatePresence>
          {showConfigModal && pendingTopic && (
            <QuestionCountModal
              topic={pendingTopic}
              level={pendingLevel}
              initialCount={questionCount}
              onClose={() => setShowConfigModal(false)}
              onConfirm={handleConfirmSettings}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * View 1: Module Selection View - Compact, fit-to-screen eye view
 */
function CRTModulesSelectionView({ categories, onSelectModule }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-2.5 sm:space-y-3.5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-200">
        <div>
          <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
            CRT Practice Modules
          </h1>
          <p className="text-[10px] sm:text-xs text-slate-500">
            Select a module to practice topics
          </p>
        </div>
        <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 shrink-0">
          {categories.length} Modules
        </span>
      </div>

      {/* Modules Grid: 3 columns on tablet/desktop, 3 compact cards on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => onSelectModule(cat.id)}
            className="bg-white rounded-xl p-2.5 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-indigo-400 active:scale-[0.98] transition-all flex sm:flex-col justify-between items-center sm:items-stretch cursor-pointer group gap-2"
          >
            <div className="flex sm:flex-col items-center sm:items-stretch gap-2.5 sm:gap-1.5 flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1.5">
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${cat.color} flex items-center justify-center text-white text-base shadow-xs shrink-0 group-hover:scale-105 transition-transform`}>
                  <span>{cat.icon}</span>
                </div>
                <span className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                  {cat.topics.length} Topics
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:hidden">
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {cat.name}
                  </h3>
                  <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-slate-100 text-slate-600 shrink-0">
                    {cat.topics.length} Topics
                  </span>
                </div>
                <h3 className="hidden sm:block text-xs sm:text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug truncate">
                  {cat.name}
                </h3>
                <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 line-clamp-1 leading-tight">
                  {cat.description}
                </p>
              </div>
            </div>

            <div className="sm:mt-2 sm:pt-1.5 sm:border-t sm:border-slate-100 flex items-center justify-end sm:justify-between text-[10px] font-bold text-indigo-600 group-hover:text-indigo-700 shrink-0">
              <span className="hidden sm:inline">3 Levels</span>
              <span className="flex items-center gap-0.5">
                <span>Start</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * View 2: CRT Topics with all Levels displayed clearly inside the selected module
 */
function CRTTopicsWithLevelsView({ categories, selectedModuleId, onSelectModule, onBackToModules, onSelectTopicAndLevel }) {
  const currentCategory = categories.find(c => c.id === selectedModuleId) || categories[0];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 sm:space-y-4">
      {/* Top Breadcrumb & Back to Modules Button */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <button
          type="button"
          onClick={onBackToModules}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-xs"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-slate-500" />
          <span>All Modules</span>
        </button>

        <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
          Module: <strong className="text-slate-800">{currentCategory.name}</strong>
        </span>
      </div>

      {/* Active Category Banner */}
      <div className="bg-gradient-to-r from-indigo-50/70 via-blue-50/40 to-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr ${currentCategory.color} flex items-center justify-center text-white text-lg sm:text-xl shadow-xs shrink-0`}>
            <span>{currentCategory.icon}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-lg font-bold text-slate-900 tracking-tight">
                {currentCategory.name}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {currentCategory.topics.length} Topics
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-600 mt-0.5">
              {currentCategory.description}
            </p>
          </div>
        </div>
      </div>

      {/* Topics Grid with all levels shown for each topic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 pt-1">
        {currentCategory.topics.map(topic => (
          <div
            key={topic.id}
            className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm hover:shadow hover:border-indigo-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  {topic.name}
                </h3>
                <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                  3 Levels
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 leading-snug mb-2 sm:mb-3">
                {topic.desc}
              </p>
            </div>

            {/* Clickable Level Badges for this Topic */}
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Choose Level to Start:
              </span>
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                {DIFFICULTY_LEVELS.map(lvl => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => onSelectTopicAndLevel(topic, lvl.id)}
                    className="py-1 px-1.5 rounded-md sm:rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-700 text-center transition-all group"
                  >
                    <span className="text-[11px] sm:text-xs font-bold block">{lvl.shortName}</span>
                    <span className="text-[8px] sm:text-[9px] text-slate-400 group-hover:text-indigo-600 block truncate">
                      {lvl.id === 1 ? 'Basic' : lvl.id === 2 ? 'Medium' : 'Advanced'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Modal Popup: Ask student how many questions per test they want & store to settings
 */
function QuestionCountModal({ topic, level, initialCount, onClose, onConfirm }) {
  const [count, setCount] = useState(initialCount || 15);
  const [customInput, setCustomInput] = useState('');
  const presets = [5, 10, 15, 20, 25];

  const levelObj = DIFFICULTY_LEVELS.find(l => l.id === level) || DIFFICULTY_LEVELS[0];

  const handleCustomChange = (e) => {
    const val = e.target.value;
    setCustomInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 5 && num <= 50) {
      setCount(num);
    }
  };

  const handlePresetSelect = (c) => {
    setCount(c);
    setCustomInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-5 sm:p-6 w-full max-w-md space-y-4"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
              Practice Test Settings
            </span>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-0.5">
              {topic.name}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 inline-block mt-1">
              {levelObj.name}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Question Count Selection */}
        <div className="space-y-2 pt-1">
          <label className="text-xs sm:text-sm font-bold text-slate-800 block">
            How many questions per test would you like to take?
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {presets.map(cnt => {
              const isSelected = count === cnt && customInput === '';
              return (
                <button
                  key={cnt}
                  type="button"
                  onClick={() => handlePresetSelect(cnt)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  {cnt} Qs
                </button>
              );
            })}
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-400">custom:</span>
              <input
                type="number"
                min="5"
                max="50"
                placeholder="Qty"
                value={customInput}
                onChange={handleCustomChange}
                className="w-16 px-2.5 py-1.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Estimated duration: ~{count} minutes ({count} questions from bank without repetition).
          </p>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(count)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
          >
            <span>Save Settings & Show Tests</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * View 2: Practice Tests List (Practice Test 1, 2, 3...) for chosen Topic & Level
 */
function CRTTestsListView({
  category,
  topic,
  level,
  questionCount,
  completedTests,
  onBack,
  onOpenSettings,
  onLaunchTest
}) {
  const tests = [1, 2, 3, 4, 5];
  const levelObj = DIFFICULTY_LEVELS.find(l => l.id === level) || DIFFICULTY_LEVELS[0];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>All Topics</span>
        </button>

        {/* Edit Setting Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>{questionCount} Qs / Test (Edit Setting)</span>
        </button>
      </div>

      {/* Topic Header Card */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
        <div>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            {category.name}
          </span>
          <h2 className="text-sm sm:text-lg font-bold text-slate-900 leading-snug">
            {topic.name}
          </h2>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
            {levelObj.name} • {questionCount} questions per test
          </span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg sm:rounded-xl w-fit">
          Questions are drawn dynamically and do not repeat across tests
        </div>
      </div>

      {/* Practice Tests 1, 2, 3, 4, 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
        {tests.map(testNum => {
          const testKey = `${category.id}_${topic.id}_${level}_${testNum}`;
          const prevScore = completedTests[testKey];
          const isDone = prevScore !== undefined;

          return (
            <div
              key={testNum}
              className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-slate-200 hover:border-indigo-200 shadow-sm transition-all flex items-center justify-between gap-2.5"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                    Practice Test {testNum}
                  </span>
                  {isDone && (
                    <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0">
                      {prevScore}% Score
                    </span>
                  )}
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 truncate">
                  {questionCount} Questions • Level {level} • ~{questionCount} mins
                </p>
              </div>

              <button
                type="button"
                onClick={() => onLaunchTest(testNum)}
                className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isDone
                    ? 'bg-slate-100 hover:bg-indigo-50 text-indigo-700 border border-slate-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                }`}
              >
                <span>{isDone ? 'Retake' : 'Start'}</span>
                <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/**
 * Question Test Taking Interface (Mobile Responsive)
 */
function CRTTestTakingView({ category, topic, level, testNumber, questions, onSubmit, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const totalQuestions = questions.length;
  const initialDuration = Math.max(totalQuestions * 75, 5 * 60);
  const [timeLeft, setTimeLeft] = useState(initialDuration);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [answers, questions]);

  const formatTimer = (sec) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const qId = currentQ?._id || currentQ?.id || currentQ?.question_id || currentIndex;

  const handleSelectOption = (opt) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: opt
    }));
  };

  const handleSubmitTest = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const id = q._id || q.id || q.question_id || idx;
      const userAns = answers[id];
      if (userAns && q.correct_answer && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()) {
        correctCount++;
      }
    });

    const total = questions.length;
    const score = Math.round((correctCount / total) * 100);
    const timeTaken = initialDuration - timeLeft;

    onSubmit({
      score,
      percentage: score,
      correctCount,
      totalQuestions: total,
      answers,
      questions,
      timeTakenSeconds: Math.max(0, timeTaken)
    });
  };

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="space-y-2.5 sm:space-y-4">
      {/* Top Header */}
      <div className="bg-white p-2.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to exit this practice session?')) {
                onBack();
              }
            }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
          </button>
          <div>
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
              {topic?.name} • Practice Test {testNumber}
            </span>
            <h2 className="text-xs sm:text-base font-extrabold text-slate-900">
              Q{currentIndex + 1} of {questions.length}
            </h2>
          </div>
        </div>

        {/* Timer & Progress */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg border border-slate-200">
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-500" />
            <span className="font-mono text-xs font-bold text-slate-800">
              {formatTimer(timeLeft)}
            </span>
          </div>

          <div className="text-[11px] sm:text-xs font-semibold text-slate-600">
            Answered: <strong className="text-indigo-600">{answeredCount}</strong>/{questions.length}
          </div>
        </div>
      </div>

      {/* Main Question Card + Navigator */}
      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Question Area */}
        <div className="lg:col-span-3 bg-white p-3 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm space-y-3 sm:space-y-4">
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                Question {currentIndex + 1}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium">Multiple Choice</span>
            </div>

            <h3 className="text-xs sm:text-base md:text-lg font-bold text-slate-900 leading-snug">
              {currentQ?.question || currentQ?.text}
            </h3>

            {/* Options with A, B, C, D */}
            <div className="space-y-1.5 sm:space-y-2 pt-1">
              {currentQ?.options?.map((opt, oIdx) => {
                const isSelected = answers[qId] === opt;
                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                      <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold shrink-0 ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="text-xs sm:text-sm break-words">{opt}</span>
                    </div>
                    {isSelected && <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0 ml-1.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-2.5 sm:pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmitTest}
                className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Submit Test
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Next Question
              </button>
            )}
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm space-y-2.5 sm:space-y-3 h-fit">
          <div className="flex items-center justify-between">
            <h4 className="text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Questions ({questions.length})
            </h4>
            <span className="text-xs text-indigo-600 font-bold">
              {answeredCount}/{questions.length}
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-5 gap-1 sm:gap-1.5 max-h-40 sm:max-h-56 overflow-y-auto pr-0.5">
            {questions.map((q, idx) => {
              const id = q._id || q.id || q.question_id || idx;
              const isAnswered = answers[id] !== undefined;
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md sm:rounded-lg font-bold text-[11px] sm:text-xs transition-all flex items-center justify-center ${
                    isCurrent
                      ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleSubmitTest}
            className="w-full mt-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Submit Test
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Result & Feedback Screen
 */
function CRTResultView({ category, topic, level, testNumber, result, onRetake, onNextTest, onBack }) {
  const isPassed = (result?.score || 0) >= 60;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-3 sm:space-y-4 max-w-2xl mx-auto">
      <div className="bg-white p-3.5 sm:p-8 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm text-center space-y-3 sm:space-y-4">
        <div className={`w-10 h-10 sm:w-16 sm:h-16 rounded-full mx-auto flex items-center justify-center text-xl sm:text-2xl ${
          isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
        }`}>
          {isPassed ? <Award className="w-5 h-5 sm:w-8 sm:h-8" /> : <RotateCcw className="w-5 h-5 sm:w-8 sm:h-8" />}
        </div>

        <div>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {topic?.name} • Practice Test {testNumber}
          </span>
          <h2 className="text-base sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            {isPassed ? 'Outstanding Performance!' : 'Keep Practicing!'}
          </h2>
          <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-600" />
            <span>Saved to your test history!</span>
          </div>
        </div>

        {/* Score Ring / Metric */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 py-1 sm:py-2">
          <div>
            <div className={`text-2xl sm:text-4xl font-black ${isPassed ? 'text-emerald-600' : 'text-slate-900'}`}>
              {result.score}%
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase">Score</span>
          </div>

          <div className="h-8 sm:h-10 w-px bg-slate-200"></div>

          <div>
            <div className="text-2xl sm:text-4xl font-black text-slate-900">
              {result.correctCount} / {result.totalQuestions}
            </div>
            <span className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase">Correct</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 pt-1 sm:pt-2">
          <button
            onClick={onRetake}
            className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Test</span>
          </button>

          <button
            onClick={onNextTest}
            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <span>Next Test {testNumber + 1}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onBack}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Back to List
          </button>
        </div>
      </div>

      {/* Answer Key & Explanation Review */}
      {Array.isArray(result?.questions) && (
        <div className="bg-white p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm space-y-2.5 sm:space-y-3">
          <h3 className="text-[10px] sm:text-xs font-bold text-slate-900 uppercase tracking-wider">
            Review ({result.questions.length} Questions)
          </h3>

          <div className="space-y-2 sm:space-y-2.5">
            {result.questions.map((q, idx) => {
              const qId = q._id || q.id || q.question_id || idx;
              const userAns = result.answers?.[qId];
              const isCorrect = userAns && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();

              return (
                <div
                  key={idx}
                  className={`p-2.5 sm:p-3 rounded-lg sm:rounded-xl border text-left space-y-1 ${
                    isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      Q{idx + 1}. {q.question || q.text}
                    </p>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-700 text-[9px] sm:text-[10px] font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
                        <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-rose-700 text-[9px] sm:text-[10px] font-bold bg-rose-100 px-1.5 py-0.5 rounded-full shrink-0">
                        <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] sm:text-[11px] space-y-0.5 text-slate-700">
                    <div>
                      <span className="text-slate-500">Your Answer: </span>
                      <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                        {userAns || 'Not Answered'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Correct: </span>
                      <strong className="text-emerald-700">{q.correct_answer}</strong>
                    </div>
                    {q.explanation && (
                      <div className="text-slate-500 pt-0.5 text-[9px] sm:text-[10px] italic">
                        💡 {q.explanation}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
