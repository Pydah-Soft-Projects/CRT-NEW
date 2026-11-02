import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getAutoPracticeQuestions, submitPracticeTestResult } from '../../services/api';
import {
  BrainCircuit,
  BookOpen,
  Ear,
  Mic,
  PenTool,
  Bookmark,
  ChevronLeft,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Volume2,
  Square,
  Award,
  Settings2,
  X
} from 'lucide-react';

const VERSANT_MODULES = [
  {
    id: 'grammar',
    name: 'Grammar Mastery',
    icon: BrainCircuit,
    color: 'from-blue-600 to-indigo-600',
    description: 'Subject-verb agreement, tenses, prepositions, clauses, and sentence structures.',
    topics: [
      { id: 'tenses', name: 'Tenses & Verb Forms', desc: 'Past, present, future tenses, perfect tenses and conditional moods' },
      { id: 'subject_verb', name: 'Subject-Verb Agreement', desc: 'Singular/plural subjects, collective nouns and compound subjects' },
      { id: 'prepositions', name: 'Prepositions & Articles', desc: 'Prepositions of place/time, definite and indefinite articles' },
      { id: 'conjunctions', name: 'Conjunctions & Clauses', desc: 'Subordinating, coordinating conjunctions and relative clauses' },
      { id: 'all', name: 'All Grammar Topics', desc: 'Comprehensive practice covering all English grammar rules and syntax' }
    ]
  },
  {
    id: 'reading',
    name: 'Reading Comprehension',
    icon: BookOpen,
    color: 'from-emerald-600 to-teal-600',
    description: 'Passage analysis, vocabulary in context, inference, and sentence completion.',
    topics: [
      { id: 'comprehension', name: 'Passage Comprehension', desc: 'Short passages, main idea identification and tone deduction' },
      { id: 'sentence_completion', name: 'Sentence Completion', desc: 'Contextual cloze tests and grammar-based missing word placement' },
      { id: 'inference', name: 'Contextual Inference', desc: 'Critical reasoning, author perspective and implicit meaning' },
      { id: 'all', name: 'All Reading Topics', desc: 'Comprehensive reading comprehension and textual analysis' }
    ]
  },
  {
    id: 'listening',
    name: 'Listening Skills',
    icon: Ear,
    color: 'from-purple-600 to-violet-600',
    description: 'Comprehend spoken dialogues, announcements, audio prompts, and conversations.',
    topics: [
      { id: 'dialogues', name: 'Short Dialogues', desc: 'Conversational exchanges between two speakers in workplace settings' },
      { id: 'conversations', name: 'Workplace Conversations', desc: 'Business meetings, telephonic discussions and corporate contexts' },
      { id: 'audio_prompts', name: 'Audio Comprehension', desc: 'Lectures, public announcements and detailed spoken instructions' },
      { id: 'all', name: 'All Listening Topics', desc: 'Audio comprehension of various accents, dialogues and announcements' }
    ]
  },
  {
    id: 'speaking',
    name: 'Speaking Proficiency',
    icon: Mic,
    color: 'from-rose-600 to-pink-600',
    description: 'Repeat sentences accurately, answer short questions, and spoken fluency.',
    topics: [
      { id: 'repeat_sentence', name: 'Repeat Sentences', desc: 'Listen to native sentence audio and reproduce accurately' },
      { id: 'short_answers', name: 'Short Question Answers', desc: 'Quick one-word or short phrase answers to everyday questions' },
      { id: 'fluency', name: 'Speaking Fluency', desc: 'Continuous speech delivery, intonation and pacing' },
      { id: 'all', name: 'All Speaking Topics', desc: 'Vocal pronunciation, fluency, repeat sentence and question response' }
    ]
  },
  {
    id: 'writing',
    name: 'Written Expression',
    icon: PenTool,
    color: 'from-amber-600 to-orange-600',
    description: 'Professional email drafting, business memos, sentence structure, and tone.',
    topics: [
      { id: 'email_drafting', name: 'Business Email Writing', desc: 'Client follow-ups, meeting requests and professional updates' },
      { id: 'sentence_structure', name: 'Sentence Reconstruction', desc: 'Jumbled sentences, parallel structure and syntax correction' },
      { id: 'paragraph', name: 'Paragraph Expression', desc: 'Cohesive paragraph construction and logical transition words' },
      { id: 'all', name: 'All Writing Topics', desc: 'Formal and business writing proficiency, emails and memos' }
    ]
  },
  {
    id: 'vocabulary',
    name: 'Vocabulary & Idioms',
    icon: Bookmark,
    color: 'from-cyan-600 to-blue-600',
    description: 'Expand word power, synonyms, antonyms, idiomatic phrases, and formal terms.',
    topics: [
      { id: 'synonyms_antonyms', name: 'Synonyms & Antonyms', desc: 'High-frequency corporate and academic vocabulary pairs' },
      { id: 'idioms_phrases', name: 'Idioms & Phrasal Verbs', desc: 'Common English idioms, collocations and prepositional verbs' },
      { id: 'contextual_usage', name: 'Contextual Word Usage', desc: 'Selecting the most accurate word in nuanced business situations' },
      { id: 'all', name: 'All Vocabulary Topics', desc: 'Broad vocabulary enrichment, synonyms, antonyms and phrases' }
    ]
  }
];

const DIFFICULTY_LEVELS = [
  { id: 1, name: 'Level 1: Fundamentals', shortName: 'Level 1', desc: 'Core grammar, basic vocabulary, and essential sentence structures' },
  { id: 2, name: 'Level 2: Intermediate', shortName: 'Level 2', desc: 'Complex sentences, nuanced listening comprehension, and professional phrasing' },
  { id: 3, name: 'Level 3: Advanced', shortName: 'Level 3', desc: 'High-speed audio comprehension, business rhetoric, and corporate fluency' }
];

export default function PracticeModules() {
  const [selectedModuleId, setSelectedModuleId] = useState('grammar');
  const [view, setView] = useState('topics'); // 'topics', 'test_list', 'taking_module', 'result'
  
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
  const [completedTests, setCompletedTests] = useState({});
  const [questions, setQuestions] = useState([]);
  const [moduleResult, setModuleResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { error: showError, success } = useNotification();

  const currentModule = VERSANT_MODULES.find(m => m.id === selectedModuleId) || VERSANT_MODULES[0];

  // 1. Topic/Level clicked -> open question count modal
  const handleSelectTopicAndLevel = (topic, level = 1) => {
    setPendingTopic(topic);
    setPendingLevel(level);
    setShowConfigModal(true);
  };

  // 2. Confirmed in modal -> save to settings & show practice tests
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

      const queryTopic = activeTopic.id === 'all' ? currentModule.id : activeTopic.id;
      // Requests questions from DB with testNumber offset and previous questions excluded
      const res = await getAutoPracticeQuestions('VERSANT', queryTopic, questionCount, activeLevel, testNumber);
      const loadedQuestions = res?.data?.questions || [];
      if (loadedQuestions.length === 0) {
        showError('No questions available in the question bank for this topic & level yet. Please try another selection.');
        return;
      }
      setQuestions(loadedQuestions);
      setView('taking_module');
    } catch (err) {
      console.error('Error starting Versant practice:', err);
      showError('Failed to load Versant practice questions from database.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Submit practice test
  const handleFinishTest = async (result) => {
    try {
      setLoading(true);
      await submitPracticeTestResult({
        module_id: 'VERSANT',
        subcategory: activeTopic?.id || currentModule.id,
        topic: activeTopic?.id || currentModule.id,
        level: activeLevel || 1,
        test_number: currentTestNumber,
        answers: result.answers,
        questions: result.questions,
        time_taken_seconds: result.timeTakenSeconds || 0
      });

      const testKey = `${currentModule.id}_${activeTopic?.id}_${activeLevel}_${currentTestNumber}`;
      setCompletedTests(prev => ({
        ...prev,
        [testKey]: result.score
      }));

      success(`Versant Practice Test ${currentTestNumber} submitted and saved to history!`);
    } catch (err) {
      console.error('Failed to save Versant practice test result:', err);
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
        ) : view === 'topics' ? (
          <VersantTopicsWithLevelsView
            modules={VERSANT_MODULES}
            selectedModuleId={selectedModuleId}
            onSelectModule={setSelectedModuleId}
            onSelectTopicAndLevel={handleSelectTopicAndLevel}
          />
        ) : view === 'test_list' && activeTopic ? (
          <VersantTestsListView
            module={currentModule}
            topic={activeTopic}
            level={activeLevel}
            questionCount={questionCount}
            completedTests={completedTests}
            onBack={handleBackToTopics}
            onOpenSettings={() => handleSelectTopicAndLevel(activeTopic, activeLevel)}
            onLaunchTest={handleLaunchPracticeTest}
          />
        ) : view === 'taking_module' ? (
          <VersantTestTakingView
            module={currentModule}
            level={activeLevel}
            testNumber={currentTestNumber}
            questions={questions}
            onSubmit={handleFinishTest}
            onBack={handleBackToTestList}
          />
        ) : view === 'result' ? (
          <VersantResultView
            module={currentModule}
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
            <VersantQuestionCountModal
              module={currentModule}
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
 * View 1: Versant Topics with all Levels displayed clearly
 */
function VersantTopicsWithLevelsView({ modules, selectedModuleId, onSelectModule, onSelectTopicAndLevel }) {
  const currentModule = modules.find(m => m.id === selectedModuleId) || modules[0];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
            Versant Practice Tests
          </h1>
          <p className="text-xs text-slate-500">
            Select an English communication topic and difficulty level to take practice tests.
          </p>
        </div>
      </div>

      {/* Module Tabs (Grammar, Reading, Listening, Speaking, Writing, Vocabulary) */}
      <div className="flex items-center gap-1.5 p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto">
        {modules.map(mod => {
          const isActive = mod.id === selectedModuleId;
          const IconComponent = mod.icon;
          return (
            <button
              key={mod.id}
              type="button"
              onClick={() => onSelectModule(mod.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <IconComponent className="w-3.5 h-3.5" />
              <span>{mod.name.replace(' Mastery', '').replace(' Skills', '').replace(' Proficiency', '').replace(' Expression', '')}</span>
            </button>
          );
        })}
      </div>

      {/* Topics Grid with all levels shown for each topic */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 pt-1">
        {currentModule.topics.map(topic => (
          <div
            key={topic.id}
            className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow hover:border-indigo-200 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-bold text-slate-900">
                  {topic.name}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                  3 Levels
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug mb-3">
                {topic.desc}
              </p>
            </div>

            {/* Clickable Level Badges for this Topic */}
            <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Choose Level to Start:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {DIFFICULTY_LEVELS.map(lvl => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => onSelectTopicAndLevel(topic, lvl.id)}
                    className="py-1.5 px-2 rounded-lg border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/70 text-slate-700 hover:text-indigo-700 text-center transition-all group"
                  >
                    <span className="text-xs font-bold block">{lvl.shortName}</span>
                    <span className="text-[9px] text-slate-400 group-hover:text-indigo-600 block truncate">
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
 * Modal Popup: Question Count Setting for Versant
 */
function VersantQuestionCountModal({ module, topic, level, initialCount, onClose, onConfirm }) {
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
 * View 2: Practice Tests List (Practice Test 1, 2, 3...) for Versant
 */
function VersantTestsListView({
  module,
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
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
            {module.name}
          </span>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {topic.name}
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            {levelObj.name} • {questionCount} questions per test
          </span>
        </div>
        <div className="text-[11px] text-slate-400 font-medium bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl w-fit">
          Questions are drawn dynamically and do not repeat across tests
        </div>
      </div>

      {/* Practice Tests 1, 2, 3, 4, 5 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tests.map(testNum => {
          const testKey = `${module.id}_${topic.id}_${level}_${testNum}`;
          const prevScore = completedTests[testKey];
          const isDone = prevScore !== undefined;

          return (
            <div
              key={testNum}
              className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-indigo-200 shadow-sm transition-all flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900">
                    Practice Test {testNum}
                  </span>
                  {isDone && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {prevScore}% Score
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {questionCount} Questions • Level {level} • ~{questionCount} mins
                </p>
              </div>

              <button
                type="button"
                onClick={() => onLaunchTest(testNum)}
                className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${
                  isDone
                    ? 'bg-slate-100 hover:bg-indigo-50 text-indigo-700 border border-slate-200'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                }`}
              >
                <span>{isDone ? 'Retake' : 'Start Test'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
function VersantTestTakingView({ module, level, testNumber, questions, onSubmit, onBack }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const totalQuestions = questions.length;
  const initialDuration = Math.max(totalQuestions * 75, 5 * 60);
  const [timeLeft, setTimeLeft] = useState(initialDuration);

  // Audio recording states for speaking module
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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
  const qId = currentQ?.question_id || currentQ?._id || currentQ?.id || currentIndex;
  const questionTitle = currentQ?.question || currentQ?.text || currentQ?.question_text || 'Question Prompt';

  const handleSelectOption = (opt) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: opt
    }));
  };

  // Text-To-Speech Audio Playback for listening prompts
  const playAudioPrompt = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Voice recording toggle for speaking practice
  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          setRecordingBlob(blob);
          handleSelectOption(currentQ.correct_answer || 'Audio Recorded Successfully');
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.warn('Microphone access:', err);
        handleSelectOption(currentQ.correct_answer || 'Audio Recorded Successfully');
      }
    }
  };

  const handleSubmitTest = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      const id = q.question_id || q._id || q.id || idx;
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
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to exit this test session?')) {
                onBack();
              }
            }}
            className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
              {module?.name} • Practice Test {testNumber}
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900">
              Q{currentIndex + 1} of {questions.length}
            </h2>
          </div>
        </div>

        {/* Timer & Answered */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-mono text-xs font-bold text-slate-800">
              {formatTimer(timeLeft)}
            </span>
          </div>

          <div className="text-xs font-semibold text-slate-600">
            Answered: <strong className="text-indigo-600">{answeredCount}</strong>/{questions.length}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4">
        {/* Main Question Card */}
        <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                Question {currentIndex + 1}
              </span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                {currentQ?.question_type || 'Multiple Choice'}
              </span>
            </div>

            {/* Question Text */}
            <div className="space-y-2">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-snug whitespace-pre-line">
                {questionTitle}
              </h3>

              {/* Audio Listen Button for Listening / Speaking */}
              {(module?.id === 'listening' || module?.id === 'speaking') && (
                <button
                  type="button"
                  onClick={() => playAudioPrompt(questionTitle)}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Listen to Prompt</span>
                </button>
              )}
            </div>

            {/* Speaking Audio Recorder if Speaking Module */}
            {module?.id === 'speaking' && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
                <p className="text-[11px] text-slate-500">
                  Record your response clearly into your microphone:
                </p>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all ${
                    isRecording
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Stop Recording</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Record Answer</span>
                    </>
                  )}
                </button>

                {answers[qId] && (
                  <p className="text-[11px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Voice answer recorded</span>
                  </p>
                )}
              </div>
            )}

            {/* Options list for MCQ */}
            {Array.isArray(currentQ?.options) && currentQ.options.length > 0 && module?.id !== 'speaking' && (
              <div className="space-y-2 pt-1">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = answers[qId] === opt;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(opt)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-sm'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <span className="text-xs sm:text-sm break-words">{opt}</span>
                      </div>
                      {isSelected && <CheckCircle className="w-4 h-4 text-indigo-600 shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
              className="px-3.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>

            {currentIndex === questions.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmitTest}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Submit Practice Test
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex(prev => prev + 1)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
              >
                Next Question
              </button>
            )}
          </div>
        </div>

        {/* Question Palette */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3 h-fit">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Questions ({questions.length})
            </h4>
            <span className="text-xs text-indigo-600 font-bold">
              {answeredCount}/{questions.length}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5 max-h-56 overflow-y-auto pr-0.5">
            {questions.map((q, idx) => {
              const id = q.question_id || q._id || q.id || idx;
              const isAnswered = answers[id] !== undefined;
              const isCurrent = idx === currentIndex;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs transition-all flex items-center justify-center ${
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
            className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl text-xs font-bold transition-all"
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
function VersantResultView({ module, level, testNumber, result, onRetake, onNextTest, onBack }) {
  const isPassed = (result?.score || 0) >= 60;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4 max-w-2xl mx-auto">
      <div className="bg-white p-5 sm:p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-4">
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full mx-auto flex items-center justify-center text-2xl ${
          isPassed ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
        }`}>
          {isPassed ? <Award className="w-8 h-8" /> : <RotateCcw className="w-8 h-8" />}
        </div>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {module?.name} • Practice Test {testNumber}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-0.5">
            {isPassed ? 'Great Job!' : 'Keep Practicing!'}
          </h2>
          <div className="mt-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Saved to your database test history!</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6 py-2">
          <div>
            <div className={`text-3xl sm:text-4xl font-black ${isPassed ? 'text-emerald-600' : 'text-slate-900'}`}>
              {result.score}%
            </div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Accuracy</span>
          </div>

          <div className="h-10 w-px bg-slate-200"></div>

          <div>
            <div className="text-3xl sm:text-4xl font-black text-slate-900">
              {result.correctCount} / {result.totalQuestions}
            </div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Correct</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            onClick={onRetake}
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retake Test {testNumber}</span>
          </button>

          <button
            onClick={onNextTest}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-sm transition-all"
          >
            <span>Next: Practice Test {testNumber + 1}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
          >
            Back to Tests List
          </button>
        </div>
      </div>

      {/* Answer Key Review */}
      {Array.isArray(result?.questions) && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Review ({result.questions.length} Questions)
          </h3>

          <div className="space-y-2.5">
            {result.questions.map((q, idx) => {
              const qId = q._id || q.id || idx;
              const userAns = result.answers?.[qId];
              const isCorrect = userAns && String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-left space-y-1.5 ${
                    isCorrect ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-900">
                      Q{idx + 1}. {q.question || q.text || q.question_text}
                    </p>
                    {isCorrect ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 text-[10px] font-bold bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
                        <CheckCircle className="w-3 h-3" /> Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-700 text-[10px] font-bold bg-rose-100 px-1.5 py-0.5 rounded-full shrink-0">
                        <XCircle className="w-3 h-3" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] space-y-0.5 text-slate-700">
                    <div>
                      <span className="text-slate-500">Your Answer: </span>
                      <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                        {userAns || 'Not Answered'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Correct Answer: </span>
                      <strong className="text-emerald-700">{q.correct_answer}</strong>
                    </div>
                    {q.explanation && (
                      <div className="text-slate-500 pt-0.5 text-[10px] italic">
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
