import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { toast } from 'react-hot-toast';
import {
  Calculator,
  Brain,
  Code,
  BookOpen,
  Headphones,
  Mic,
  Volume2,
  Play,
  Square,
  FileCode,
  Sparkles,
  CheckCircle2,
  Layers,
  Search,
  Bell,
  Upload,
  Download,
  Plus,
  Edit2,
  Trash2,
  Eye,
  X,
  ChevronRight,
  ChevronLeft,
  Filter,
  FileText,
  MoreHorizontal,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  School,
  Building2,
  Globe
} from 'lucide-react';
import SkeletonLoader from '../../components/common/SkeletonLoader';
import MultiSelectDropdown from '../../components/common/MultiSelectDropdown';
import {
  getCrtModules,
  createCrtModule,
  updateCrtModule,
  deleteCrtModule,
  createCrtTopic,
  updateCrtTopic,
  deleteCrtTopic,
  getCrtColleges,
  getCrtQuestions,
  createCrtQuestion,
  bulkUploadCrtQuestions,
  updateCrtQuestion,
  deleteCrtQuestion,
  getCrtStats
} from '../../services/api';

// Icon Map for Dynamic Modules
const ICON_MAP = {
  Calculator: Calculator,
  Brain: Brain,
  Code: Code,
  BookOpen: BookOpen,
  Headphones: Headphones,
  Mic: Mic
};

// Module Badge Color Palettes (matching reference design)
const MODULE_THEMES = {
  aptitude: {
    badgeBg: 'bg-blue-600 text-white',
    ringColor: 'ring-blue-600 border-blue-600',
    icon: Calculator,
    defaultSubtitle: 'Numbers, arithmetic, algebra, data interpretation'
  },
  reasoning: {
    badgeBg: 'bg-emerald-500 text-white',
    ringColor: 'ring-emerald-500 border-emerald-500',
    icon: Brain,
    defaultSubtitle: 'Puzzles, blood relations, coding-decoding'
  },
  technical: {
    badgeBg: 'bg-purple-600 text-white',
    ringColor: 'ring-purple-600 border-purple-600',
    icon: Code,
    defaultSubtitle: 'Programming, DBMS, OS, networking'
  },
  verbal: {
    badgeBg: 'bg-amber-500 text-white',
    ringColor: 'ring-amber-500 border-amber-500',
    icon: BookOpen,
    defaultSubtitle: 'Grammar, vocabulary, comprehension'
  },
  versant: {
    badgeBg: 'bg-rose-500 text-white',
    ringColor: 'ring-rose-500 border-rose-500',
    icon: Headphones,
    defaultSubtitle: 'Listening, speaking, pronunciation'
  }
};

const DEFAULT_LEVEL_PRESETS = [
  { level: 1, name: 'Level 1 (Beginner)', description: 'Fundamental concepts, basic formulas & direct problems' },
  { level: 2, name: 'Level 2 (Intermediate)', description: 'Standard exam problems & moderate multi-step questions' },
  { level: 3, name: 'Level 3 (Advanced)', description: 'Complex scenarios, high difficulty & speed tricks' },
  { level: 4, name: 'Level 4 (Expert)', description: 'Campus placement round 2 and competitive benchmarks' },
  { level: 5, name: 'Level 5 (Mastery)', description: 'Mastery tier, deep analytical and optimization queries' }
];

// Module Assessment Types (Configurable when creating / editing Main Modules)
const MODULE_TYPES = [
  {
    id: 'mcq',
    label: 'Standard MCQ',
    subtitle: 'Written Multiple Choice',
    badge: 'MCQ',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: FileText,
    iconColor: 'text-blue-600',
    description: 'Multiple choice questions with 4 options and a correct answer'
  },
  {
    id: 'text_to_voice',
    label: 'Text to Voice (TTS)',
    subtitle: 'Listening Comprehension',
    badge: 'TTS Voice',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    icon: Volume2,
    iconColor: 'text-indigo-600',
    description: 'System synthesizes voice audio prompts for candidate to listen and answer'
  },
  {
    id: 'voice_to_text',
    label: 'Voice to Text (STT)',
    subtitle: 'Speaking & Pronunciation',
    badge: 'STT Speaking',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Mic,
    iconColor: 'text-emerald-600',
    description: 'Candidate speaks into microphone; AI evaluates pronunciation & fluency'
  },
  {
    id: 'dual_voice',
    label: 'Dual Voice AI',
    subtitle: 'Interactive Versant',
    badge: 'Dual Voice',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: Headphones,
    iconColor: 'text-rose-600',
    description: 'System speaks audio prompt, candidate responds orally via microphone'
  },
  {
    id: 'technical',
    label: 'Technical & Coding',
    subtitle: 'Programming Assessments',
    badge: 'Technical',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: FileCode,
    iconColor: 'text-purple-600',
    description: 'Code stubs, syntax challenges, input/output test assertions'
  },
  {
    id: 'mixed',
    label: 'Mixed / Hybrid',
    subtitle: 'Multi-type Assessment',
    badge: 'Mixed',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Layers,
    iconColor: 'text-amber-600',
    description: 'Flexible hybrid module combining MCQs, voice assessments, and code'
  }
];

const mapModuleTypeToQuestionType = (modType) => {
  switch (modType) {
    case 'text_to_voice':
      return 'text_to_audio';
    case 'voice_to_text':
      return 'audio_to_text';
    case 'dual_voice':
      return 'both';
    case 'technical':
      return 'technical';
    case 'mcq':
    case 'mixed':
    default:
      return 'mcq';
  }
};

// Question Types (Matching Step 1 of Right Drawer in Reference)
const QUESTION_TYPES = [
  {
    id: 'mcq',
    conversion_type: 'none',
    title: 'Standard MCQ',
    subtitle: 'Text → Text (Multiple choice)',
    icon: FileText,
    iconBg: 'bg-blue-100 text-blue-700',
    description: 'Create a multiple choice question with 4 options, correct answer and explanation.'
  },
  {
    id: 'text_to_audio',
    conversion_type: 'text_to_audio',
    title: 'Text to Audio (TTS)',
    subtitle: 'Text → Voice (Listening)',
    icon: Volume2,
    iconBg: 'bg-blue-100 text-blue-700',
    description: 'System synthesizes written text into spoken audio prompt. Candidate listens and answers.'
  },
  {
    id: 'audio_to_text',
    conversion_type: 'audio_to_text',
    title: 'Audio to Text (STT)',
    subtitle: 'Voice → Text (Speaking)',
    icon: Mic,
    iconBg: 'bg-emerald-100 text-emerald-700',
    description: 'Candidate speaks into microphone; AI evaluates pronunciation against the reference sentence.'
  },
  {
    id: 'both',
    conversion_type: 'both',
    title: 'Dual Voice AI',
    subtitle: 'Voice Prompt → Voice Response',
    icon: Headphones,
    iconBg: 'bg-rose-100 text-rose-700',
    description: 'Interactive Versant: System speaks audio prompt, candidate repeats/answers via microphone.'
  },
  {
    id: 'technical',
    conversion_type: 'none',
    title: 'Technical / Coding',
    subtitle: 'Programming / Coding Questions',
    icon: FileCode,
    iconBg: 'bg-purple-100 text-purple-700',
    description: 'Technical coding challenge with programming code stub, language, and expected output.'
  }
];

export default function CRTUpload() {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalModules: 0, totalTopics: 0, totalQuestions: 0 });

  // Selections
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [activeCenterTab, setActiveCenterTab] = useState('questions'); // 'levels', 'questions', 'analytics'
  const [typeFilter, setTypeFilter] = useState('all');
  const [levelDropdownFilter, setLevelDropdownFilter] = useState('all');

  // College Scope Filtering & Options (multi-selection, empty = All Colleges)
  const [colleges, setColleges] = useState([]);
  const [collegesLoading, setCollegesLoading] = useState(false);
  const [selectedCollegeFilters, setSelectedCollegeFilters] = useState([]); // [] means All Colleges
  const [includeGlobalWithCollege, setIncludeGlobalWithCollege] = useState(true);

  // Bulk Import & Sentence Target College Scopes (multi-selection, empty = All Colleges)
  const [importCollegeScopes, setImportCollegeScopes] = useState([]);
  const [bulkSentenceCollegeScopes, setBulkSentenceCollegeScopes] = useState([]);

  // Modules horizontal inline scrolling
  const modulesScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkModuleScroll = useCallback(() => {
    const el = modulesScrollRef.current;
    if (el) {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkModuleScroll();
    const handleResize = () => checkModuleScroll();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [modules, checkModuleScroll]);

  const scrollModules = (direction) => {
    const el = modulesScrollRef.current;
    if (el) {
      const scrollAmount = 280;
      el.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkModuleScroll, 320);
    }
  };

  // Auto-scroll selected module into view if off-screen
  useEffect(() => {
    if (selectedModuleId && modulesScrollRef.current) {
      const el = modulesScrollRef.current.querySelector(`[data-module-id="${selectedModuleId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [selectedModuleId]);

  // Search & Pagination
  const [globalSearch, setGlobalSearch] = useState('');
  const [topicSearch, setTopicSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Questions Data & Selection
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [playingAudioScript, setPlayingAudioScript] = useState('');

  // Right Drawer: Add / Edit Question Wizard
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState(1); // 1: Type, 2: Content, 3: Settings
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [drawerForm, setDrawerForm] = useState({
    typeId: 'mcq',
    conversion_type: 'none',
    question_type: 'mcq',
    text: '',
    options: ['', '', '', ''],
    correct_answer: '',
    reference_text: '',
    audio_script: '',
    time_limit_seconds: 30,
    level_id: 1,
    college_id: null,
    college_ids: [],
    college_name: '',
    is_global: true,
    code_stub: '',
    expected_output: '',
    explanation: ''
  });

  // Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedImportRows, setParsedImportRows] = useState([]);
  const [importFileName, setImportFileName] = useState('');
  const [isImportSubmitting, setIsImportSubmitting] = useState(false);

  // Bulk Sentences (Speaking & Versant Quick Input)
  const [isBulkSentenceModalOpen, setIsBulkSentenceModalOpen] = useState(false);
  const [bulkSentenceText, setBulkSentenceText] = useState('');
  const [bulkSentenceLevel, setBulkSentenceLevel] = useState(1);
  const [bulkSentenceDuration, setBulkSentenceDuration] = useState(30);
  const [isBulkSentenceSubmitting, setIsBulkSentenceSubmitting] = useState(false);

  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({
    name: '',
    code: '',
    description: '',
    icon: 'BookOpen',
    color: 'indigo',
    module_type: 'mcq'
  });

  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [topicForm, setTopicForm] = useState({
    name: '',
    code: '',
    description: '',
    levels: [
      { level: 1, name: 'Level 1 (Beginner)', description: '' },
      { level: 2, name: 'Level 2 (Intermediate)', description: '' },
      { level: 3, name: 'Level 3 (Advanced)', description: '' }
    ]
  });

  const [viewingQuestion, setViewingQuestion] = useState(null);
  const [openModuleMenuId, setOpenModuleMenuId] = useState(null);

  // Active module reference
  const currentModule = useMemo(() => {
    return modules.find(m => String(m._id) === String(selectedModuleId) || m.code === selectedModuleId) || modules[0] || null;
  }, [modules, selectedModuleId]);

  // Active topic reference
  const currentTopic = useMemo(() => {
    if (!currentModule || !currentModule.topics) return null;
    return currentModule.topics.find(t => String(t._id) === String(selectedTopicId) || t.code === selectedTopicId) || currentModule.topics[0] || null;
  }, [currentModule, selectedTopicId]);

  // Filtered topics list by topicSearch
  const filteredTopics = useMemo(() => {
    if (!currentModule || !currentModule.topics) return [];
    if (!topicSearch.trim()) return currentModule.topics;
    const term = topicSearch.toLowerCase();
    return currentModule.topics.filter(t => t.name.toLowerCase().includes(term) || (t.description || '').toLowerCase().includes(term));
  }, [currentModule, topicSearch]);

  // Fetch modules & stats
  const fetchStructure = useCallback(async (preserveSelection = true) => {
    try {
      setLoading(true);
      const [modRes, statRes] = await Promise.all([
        getCrtModules(),
        getCrtStats().catch(() => ({ data: { data: {} } }))
      ]);

      const modList = modRes?.data?.data || [];
      setModules(modList);
      if (statRes?.data?.data) {
        setStats(statRes.data.data);
      }

      if (modList.length > 0) {
        if (!preserveSelection || !selectedModuleId) {
          const firstMod = modList[0];
          setSelectedModuleId(String(firstMod._id));
          if (firstMod.topics && firstMod.topics.length > 0) {
            setSelectedTopicId(String(firstMod.topics[0]._id));
          }
        }
      }
    } catch (err) {
      console.error('Failed to load CRT modules:', err);
      toast.error('Failed to load CRT & Versant structure');
    } finally {
      setLoading(false);
    }
  }, [selectedModuleId]);

  useEffect(() => {
    fetchStructure(false);

    const fetchColleges = async () => {
      try {
        setCollegesLoading(true);
        const res = await getCrtColleges();
        const list = res?.data?.data || res?.data || [];
        setColleges(Array.isArray(list) ? list : []);
      } catch (err) {
        console.warn('Failed to load CRT colleges:', err);
        setColleges([]);
      } finally {
        setCollegesLoading(false);
      }
    };
    fetchColleges();
  }, []);

  // Sync active topic on module change
  useEffect(() => {
    if (currentModule) {
      const topics = currentModule.topics || [];
      const topicExists = topics.some(t => String(t._id) === String(selectedTopicId) || t.code === selectedTopicId);
      if (!topicExists && topics.length > 0) {
        setSelectedTopicId(String(topics[0]._id));
      } else if (topics.length === 0) {
        setSelectedTopicId('');
      }
      setSelectedLevel('all');
      setCurrentPage(1);
      setSelectedQuestionIds([]);
    }
  }, [currentModule]);

  // Load questions for selected module, topic, level and college scope
  const loadQuestions = useCallback(async () => {
    if (!currentModule || !currentTopic) {
      setQuestions([]);
      return;
    }

    try {
      setQuestionsLoading(true);
      const params = {
        module_id: currentModule.code || currentModule._id,
        topic_id: currentTopic._id || currentTopic.code,
        level_id: selectedLevel !== 'all' ? selectedLevel : (levelDropdownFilter !== 'all' ? levelDropdownFilter : undefined),
        conversion_type: typeFilter !== 'all' ? typeFilter : undefined,
        limit: 150
      };

      if (selectedCollegeFilters.length > 0) {
        params.college_ids = selectedCollegeFilters.join(',');
        params.include_global = includeGlobalWithCollege ? 'true' : 'false';
      }

      const res = await getCrtQuestions(params);
      const list = res?.data?.data?.questions || [];
      setQuestions(list);
      setSelectedQuestionIds([]);
    } catch (err) {
      console.error('Error loading questions:', err);
      toast.error('Failed to load questions');
      setQuestions([]);
    } finally {
      setQuestionsLoading(false);
    }
  }, [currentModule, currentTopic, selectedLevel, levelDropdownFilter, typeFilter, selectedCollegeFilters, includeGlobalWithCollege]);

  useEffect(() => {
    if (currentModule && currentTopic) {
      loadQuestions();
    }
  }, [currentModule, currentTopic, selectedLevel, levelDropdownFilter, typeFilter, selectedCollegeFilters, includeGlobalWithCollege, loadQuestions]);

  // Filter questions by global search or center question search
  const displayedQuestions = useMemo(() => {
    let list = [...questions];
    const query = (questionSearch || globalSearch).trim().toLowerCase();
    if (query) {
      list = list.filter(q =>
        (q.text || '').toLowerCase().includes(query) ||
        (q.correct_answer || '').toLowerCase().includes(query) ||
        (q.reference_text || '').toLowerCase().includes(query) ||
        (q.audio_script || '').toLowerCase().includes(query) ||
        (q.options || []).some(o => String(o).toLowerCase().includes(query))
      );
    }
    return list;
  }, [questions, questionSearch, globalSearch]);

  // Pagination calculation
  const totalQuestions = displayedQuestions.length;
  const totalPages = Math.ceil(totalQuestions / pageSize) || 1;
  const pagedQuestions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayedQuestions.slice(start, start + pageSize);
  }, [displayedQuestions, currentPage, pageSize]);

  // Audio Playback
  const handlePlayAudio = (text) => {
    if (!text || !text.trim()) {
      toast.error('No audio text provided');
      return;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.trim());
      utterance.rate = 0.95;
      utterance.lang = 'en-US';
      utterance.onstart = () => setPlayingAudioScript(text);
      utterance.onend = () => setPlayingAudioScript('');
      utterance.onerror = () => setPlayingAudioScript('');
      window.speechSynthesis.speak(utterance);
      toast.success('Playing audio prompt...', { icon: '🔊', duration: 1500 });
    } else {
      toast.error('Speech synthesis not supported in this browser');
    }
  };

  const handleStopAudio = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setPlayingAudioScript('');
    }
  };

  // -------------------------------------------------------------
  // DRAWER WORKFLOW: ADD / EDIT QUESTION (3 STEPS)
  // -------------------------------------------------------------
  const handleOpenAddDrawer = (typePreset = null) => {
    const availableLevels = currentTopic?.levels || [];
    const defaultLevel = selectedLevel !== 'all' ? Number(selectedLevel) : (availableLevels[0]?.level || 1);

    // Auto-select question type based on explicit preset or current parent module's type
    const targetTypeId = typePreset || mapModuleTypeToQuestionType(currentModule?.module_type);
    const preset = QUESTION_TYPES.find(t => t.id === targetTypeId) || QUESTION_TYPES[0];

    const initialCollegeIds = Array.isArray(selectedCollegeFilters) ? [...selectedCollegeFilters] : [];
    const isGlobal = initialCollegeIds.length === 0;
    const firstCol = !isGlobal ? colleges.find(c => String(c.id) === String(initialCollegeIds[0])) : null;
    let initialColName = 'All Colleges';
    if (initialCollegeIds.length === 1) {
      initialColName = firstCol?.name || `College #${initialCollegeIds[0]}`;
    } else if (initialCollegeIds.length > 1) {
      initialColName = `${initialCollegeIds.length} Colleges`;
    }

    setEditingQuestion(null);
    setDrawerStep(1);
    setDrawerForm({
      typeId: preset.id,
      conversion_type: preset.conversion_type,
      question_type: preset.id,
      text: '',
      options: ['', '', '', ''],
      correct_answer: '',
      reference_text: '',
      audio_script: '',
      time_limit_seconds: 30,
      level_id: defaultLevel,
      college_ids: initialCollegeIds,
      college_id: initialCollegeIds[0] ? Number(initialCollegeIds[0]) : null,
      college_name: initialColName,
      is_global: isGlobal,
      code_stub: '',
      expected_output: '',
      explanation: ''
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEditDrawer = (q) => {
    let typeId = 'mcq';
    if (q.conversion_type === 'text_to_audio') typeId = 'text_to_audio';
    else if (q.conversion_type === 'audio_to_text') typeId = 'audio_to_text';
    else if (q.conversion_type === 'both') typeId = 'both';
    else if (q.question_type === 'technical') typeId = 'technical';

    const qCollegeIds = Array.isArray(q.college_ids) && q.college_ids.length > 0
      ? q.college_ids.map(String)
      : (q.college_id ? [String(q.college_id)] : []);
    const isGlobal = q.is_global !== undefined ? Boolean(q.is_global) : qCollegeIds.length === 0;
    let colName = 'All Colleges';
    if (qCollegeIds.length === 1) {
      const found = colleges.find(c => String(c.id) === String(qCollegeIds[0]));
      colName = found?.name || `College #${qCollegeIds[0]}`;
    } else if (qCollegeIds.length > 1) {
      colName = `${qCollegeIds.length} Colleges`;
    }

    setEditingQuestion(q);
    setDrawerStep(2); // Jump directly to content for editing
    setDrawerForm({
      typeId,
      conversion_type: q.conversion_type || 'none',
      question_type: q.question_type || 'mcq',
      text: q.text || '',
      options: Array.isArray(q.options) && q.options.length >= 2 ? q.options : ['', '', '', ''],
      correct_answer: q.correct_answer || '',
      reference_text: q.reference_text || '',
      audio_script: q.audio_script || '',
      time_limit_seconds: q.time_limit_seconds || 30,
      level_id: q.level_id || 1,
      college_ids: qCollegeIds,
      college_id: qCollegeIds[0] ? Number(qCollegeIds[0]) : null,
      college_name: q.college_name || colName,
      is_global: isGlobal,
      code_stub: q.code_stub || '',
      expected_output: q.expected_output || '',
      explanation: q.explanation || ''
    });
    setIsDrawerOpen(true);
  };

  const handleSelectDrawerType = (typeObj) => {
    setDrawerForm(prev => ({
      ...prev,
      typeId: typeObj.id,
      conversion_type: typeObj.conversion_type,
      question_type: typeObj.id
    }));
  };

  const handleDrawerNext = () => {
    if (drawerStep === 1) {
      setDrawerStep(2);
    } else if (drawerStep === 2) {
      if (!drawerForm.text.trim()) {
        toast.error('Question prompt / text is required');
        return;
      }
      if (drawerForm.typeId === 'mcq') {
        const cleanOpts = drawerForm.options.map(o => String(o).trim()).filter(Boolean);
        if (cleanOpts.length < 2) {
          toast.error('At least 2 options are required for MCQ');
          return;
        }
      }
      setDrawerStep(3);
    }
  };

  const handleDrawerBack = () => {
    if (drawerStep > 1) {
      setDrawerStep(drawerStep - 1);
    }
  };

  const handleSaveDrawerQuestion = async () => {
    if (!currentModule || !currentTopic) {
      toast.error('Select a module and topic first');
      return;
    }

    const cleanOpts = drawerForm.options.map(o => String(o).trim()).filter(Boolean);
    const refText = drawerForm.reference_text.trim() || (drawerForm.conversion_type === 'audio_to_text' || drawerForm.conversion_type === 'both' ? drawerForm.text.trim() : '');
    const script = drawerForm.audio_script.trim() || (drawerForm.conversion_type === 'text_to_audio' || drawerForm.conversion_type === 'both' ? drawerForm.text.trim() : '');
    const ans = drawerForm.correct_answer.trim() || (cleanOpts.length > 0 ? cleanOpts[0] : refText);

    const rawCollegeIds = Array.isArray(drawerForm.college_ids)
      ? drawerForm.college_ids
      : (drawerForm.college_id ? [drawerForm.college_id] : []);
    const parsedCollegeIds = rawCollegeIds.map(Number).filter(n => !isNaN(n) && n > 0);
    const isGlobal = parsedCollegeIds.length === 0;

    let colName = 'All Colleges';
    if (parsedCollegeIds.length === 1) {
      const found = colleges.find(c => String(c.id) === String(parsedCollegeIds[0]));
      colName = found?.name || `College #${parsedCollegeIds[0]}`;
    } else if (parsedCollegeIds.length > 1) {
      colName = `${parsedCollegeIds.length} Colleges`;
    }

    const payload = {
      ...drawerForm,
      options: cleanOpts,
      reference_text: refText,
      audio_script: script,
      correct_answer: ans,
      module_id: currentModule.code,
      main_module_id: currentModule._id,
      topic_id: currentTopic._id,
      subcategory: currentTopic.code || currentTopic.name,
      level_name: `Level ${drawerForm.level_id}`,
      college_ids: parsedCollegeIds,
      college_id: parsedCollegeIds[0] || null,
      college_name: isGlobal ? 'All Colleges' : colName,
      is_global: isGlobal
    };

    try {
      if (editingQuestion) {
        await updateCrtQuestion(editingQuestion._id, payload);
        toast.success('Question updated successfully!');
      } else {
        await createCrtQuestion(payload);
        toast.success('Question added to bank!');
      }
      setIsDrawerOpen(false);
      await loadQuestions();
      await fetchStructure(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save question');
    }
  };

  // -------------------------------------------------------------
  // QUESTION TABLE ACTIONS
  // -------------------------------------------------------------
  const handleDeleteQuestion = async (qId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await deleteCrtQuestion(qId);
      toast.success('Question deleted');
      setQuestions(prev => prev.filter(q => q._id !== qId));
      fetchStructure(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete question');
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedQuestionIds.length === pagedQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(pagedQuestions.map(q => q._id));
    }
  };

  const handleToggleSelectRow = (qId) => {
    setSelectedQuestionIds(prev =>
      prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedQuestionIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedQuestionIds.length} selected questions?`)) return;

    try {
      await Promise.all(selectedQuestionIds.map(id => deleteCrtQuestion(id)));
      toast.success(`Deleted ${selectedQuestionIds.length} questions`);
      setSelectedQuestionIds([]);
      await loadQuestions();
      await fetchStructure(true);
    } catch {
      toast.error('Bulk deletion encountered an error');
    }
  };

  // -------------------------------------------------------------
  // BULK CSV / EXCEL UPLOAD
  // -------------------------------------------------------------
  const handleDownloadTemplate = () => {
    const lvlNum = selectedLevel !== 'all' ? selectedLevel : 1;
    const colVal = selectedCollegeFilters.length > 0 ? selectedCollegeFilters.join(';') : '';
    const csvContent =
      'question,conversion_type,question_type,audio_script,reference_text,option_a,option_b,option_c,option_d,correct_answer,explanation,level,college_id\n' +
      `"A pipe can fill a tank in 6 hours. Another pipe empties it in 8 hours. Time taken together?","none","mcq","","","18 hrs","24 hrs","12 hrs","30 hrs","24 hrs","Net work = 1/6 - 1/8 = 1/24. Time = 24 hours.",${lvlNum},"${colVal}"\n` +
      `"Listen to the announcement and identify the room number.","text_to_audio","text_to_audio","Attention passengers. The orientation session has been moved to Conference Room 302 on the third floor.","","Room 203","Room 302","Room 320","Room 402","Room 302","Text-to-Audio (TTS): System plays synthesized voice.",${lvlNum},"${colVal}"\n` +
      `"Read the following sentence aloud clearly into the microphone.","audio_to_text","audio_to_text","","Traffic congestion has become a major challenge for modern urban cities worldwide.","","","","","Traffic congestion has become a major challenge for modern urban cities worldwide.","Audio-to-Text (STT / Versant): Candidate speaks, AI evaluates pronunciation.",${lvlNum},"${colVal}"\n` +
      `"Listen and repeat the sentence exactly as you hear it.","both","both","Please leave your visitor badge at the reception desk before departing.","Please leave your visitor badge at the reception desk before departing.","","","","","Please leave your visitor badge at the reception desk before departing.","Dual Voice AI: System speaks TTS, candidate repeats via mic.",${lvlNum},"${colVal}"`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CRT_Versant_Questions_Template_Level${lvlNum}.csv`;
    link.click();
    toast.success('Sample CSV template downloaded!');
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => processParsedImport(results.data),
        error: () => toast.error('CSV parse error')
      });
    } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const wb = XLSX.read(evt.target.result, { type: 'binary' });
          const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
          processParsedImport(rows);
        } catch {
          toast.error('Failed to parse Excel file');
        }
      };
      reader.readAsBinaryString(file);
    } else {
      toast.error('Please upload a .csv or .xlsx file');
    }
    e.target.value = '';
  };

  const processParsedImport = (rows) => {
    const activeLvl = selectedLevel !== 'all' ? parseInt(selectedLevel, 10) : 1;
    const parsed = [];

    rows.forEach((r, idx) => {
      const qText = r.question || r.text || r.Question;
      if (!qText || !String(qText).trim()) return;

      const opts = [
        r.option_a || r.option1 || r['Option A'],
        r.option_b || r.option2 || r['Option B'],
        r.option_c || r.option3 || r['Option C'],
        r.option_d || r.option4 || r['Option D']
      ].map(o => (o !== undefined && o !== null) ? String(o).trim() : '').filter(Boolean);

      let convType = r.conversion_type || 'none';
      let qType = r.question_type || 'mcq';

      if (!convType || convType === 'none') {
        if (r.audio_script || qType === 'text_to_audio') convType = 'text_to_audio';
        else if (r.reference_text || qType === 'audio_to_text') convType = 'audio_to_text';
        else if (qType === 'both') convType = 'both';
      }

      const refText = r.reference_text || (convType === 'audio_to_text' || convType === 'both' ? String(qText).trim() : '');
      const script = r.audio_script || (convType === 'text_to_audio' || convType === 'both' ? String(qText).trim() : '');
      const ans = r.correct_answer || r.answer || refText || (opts.length > 0 ? opts[0] : '');

      const rawCol = r.college_id || r.college || r['College ID'] || '';
      const rowColId = (rawCol && rawCol !== 'all' && rawCol !== 'global') ? Number(rawCol) : null;

      parsed.push({
        idx: idx + 1,
        text: String(qText).trim(),
        conversion_type: convType,
        question_type: qType,
        options: opts,
        correct_answer: String(ans).trim(),
        reference_text: String(refText).trim(),
        audio_script: String(script).trim(),
        explanation: String(r.explanation || '').trim(),
        level_id: r.level ? parseInt(r.level, 10) : activeLvl,
        college_id: rowColId
      });
    });

    if (parsed.length > 0) {
      setParsedImportRows(parsed);
      // Pre-select import college scope from current filters if active
      if (selectedCollegeFilters.length > 0) {
        setImportCollegeScopes([...selectedCollegeFilters]);
      } else {
        setImportCollegeScopes([]);
      }
      setIsImportModalOpen(true);
      toast.success(`Parsed ${parsed.length} questions ready to import!`);
    } else {
      toast.error('No valid question rows found in file');
    }
  };

  const handleConfirmImport = async () => {
    if (!currentModule || !currentTopic) {
      toast.error('Please select a main module and topic first');
      return;
    }

    try {
      setIsImportSubmitting(true);
      const parsedColIds = (Array.isArray(importCollegeScopes) ? importCollegeScopes : [])
        .map(Number)
        .filter(n => !isNaN(n) && n > 0);
      const isGlobal = parsedColIds.length === 0;

      let colName = 'All Colleges';
      if (parsedColIds.length === 1) {
        const found = colleges.find(c => String(c.id) === String(parsedColIds[0]));
        colName = found?.name || `College #${parsedColIds[0]}`;
      } else if (parsedColIds.length > 1) {
        colName = `${parsedColIds.length} Colleges`;
      }

      const payload = {
        module_id: currentModule.code,
        main_module_id: currentModule._id,
        topic_id: currentTopic._id,
        subcategory: currentTopic.code || currentTopic.name,
        level_id: selectedLevel !== 'all' ? parseInt(selectedLevel, 10) : 1,
        college_ids: parsedColIds,
        college_id: parsedColIds[0] || null,
        college_name: isGlobal ? 'All Colleges' : colName,
        is_global: isGlobal,
        questions: parsedImportRows
      };

      const res = await bulkUploadCrtQuestions(payload);
      toast.success(res?.data?.message || `Imported ${parsedImportRows.length} questions successfully!`);
      setIsImportModalOpen(false);
      setParsedImportRows([]);
      setImportFileName('');
      await loadQuestions();
      await fetchStructure(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Import failed');
    } finally {
      setIsImportSubmitting(false);
    }
  };

  // Bulk Sentences Handler
  const handleConfirmBulkSentences = async () => {
    if (!currentModule || !currentTopic) {
      toast.error('Select a module and topic first');
      return;
    }
    const lines = bulkSentenceText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 3);

    if (lines.length === 0) {
      toast.error('Please enter at least one sentence');
      return;
    }

    try {
      setIsBulkSentenceSubmitting(true);
      const parsedColIds = (Array.isArray(bulkSentenceCollegeScopes) ? bulkSentenceCollegeScopes : [])
        .map(Number)
        .filter(n => !isNaN(n) && n > 0);
      const isGlobal = parsedColIds.length === 0;

      let colName = 'All Colleges';
      if (parsedColIds.length === 1) {
        const found = colleges.find(c => String(c.id) === String(parsedColIds[0]));
        colName = found?.name || `College #${parsedColIds[0]}`;
      } else if (parsedColIds.length > 1) {
        colName = `${parsedColIds.length} Colleges`;
      }

      const questionsToUpload = lines.map(sentence => ({
        text: sentence,
        reference_text: sentence,
        question_type: 'audio_to_text',
        conversion_type: 'audio_to_text',
        time_limit_seconds: parseInt(bulkSentenceDuration, 10) || 30,
        level_id: parseInt(bulkSentenceLevel, 10) || 1,
        level_name: `Level ${bulkSentenceLevel || 1}`,
        options: [],
        correct_answer: sentence,
        college_ids: parsedColIds,
        college_id: parsedColIds[0] || null,
        college_name: isGlobal ? 'All Colleges' : colName,
        is_global: isGlobal,
        explanation: 'Read the sentence aloud into your microphone. Graded by AI Whisper speech recognition.'
      }));

      await bulkUploadCrtQuestions({
        module_id: currentModule.code,
        main_module_id: currentModule._id,
        topic_id: currentTopic._id,
        subcategory: currentTopic.code || currentTopic.name,
        level_id: parseInt(bulkSentenceLevel, 10) || 1,
        level_name: `Level ${bulkSentenceLevel || 1}`,
        college_ids: parsedColIds,
        college_id: parsedColIds[0] || null,
        college_name: isGlobal ? 'All Colleges' : colName,
        is_global: isGlobal,
        questions: questionsToUpload
      });

      toast.success(`Successfully added ${lines.length} speaking sentences!`);
      setIsBulkSentenceModalOpen(false);
      setBulkSentenceText('');
      await loadQuestions();
      await fetchStructure(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to upload speaking sentences');
    } finally {
      setIsBulkSentenceSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // MODULE & TOPIC ACTIONS
  // -------------------------------------------------------------
  const handleOpenModuleModal = (mod = null) => {
    setOpenModuleMenuId(null);
    if (mod) {
      setEditingModule(mod);
      setModuleForm({
        name: mod.name || '',
        code: mod.code || '',
        description: mod.description || '',
        icon: mod.icon || 'BookOpen',
        color: mod.color || 'indigo',
        module_type: mod.module_type || 'mcq'
      });
    } else {
      setEditingModule(null);
      setModuleForm({
        name: '',
        code: '',
        description: '',
        icon: 'BookOpen',
        color: 'indigo',
        module_type: 'mcq'
      });
    }
    setIsModuleModalOpen(true);
  };

  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!moduleForm.name.trim()) return toast.error('Module name is required');
    try {
      if (editingModule) {
        await updateCrtModule(editingModule._id, moduleForm);
        toast.success(`Module '${moduleForm.name}' updated!`);
      } else {
        const res = await createCrtModule(moduleForm);
        toast.success(`Module '${moduleForm.name}' created!`);
        if (res?.data?.data?._id) setSelectedModuleId(String(res.data.data._id));
      }
      setIsModuleModalOpen(false);
      await fetchStructure(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save module');
    }
  };

  const handleDeleteModule = async (mod, e) => {
    e?.stopPropagation();
    setOpenModuleMenuId(null);
    if (!window.confirm(`Delete module '${mod.name}' and all its topics?`)) return;
    try {
      await deleteCrtModule(mod._id);
      toast.success(`Module '${mod.name}' deleted`);
      await fetchStructure(false);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete module');
    }
  };

  const handleOpenTopicModal = (topic = null) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({
        name: topic.name || '',
        code: topic.code || '',
        description: topic.description || '',
        levels: topic.levels && topic.levels.length > 0 ? topic.levels : DEFAULT_LEVEL_PRESETS.slice(0, 3)
      });
    } else {
      setEditingTopic(null);
      setTopicForm({
        name: '',
        code: '',
        description: '',
        levels: DEFAULT_LEVEL_PRESETS.slice(0, 3)
      });
    }
    setIsTopicModalOpen(true);
  };

  const handleSaveTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.name.trim()) return toast.error('Topic name is required');
    if (!topicForm.levels || topicForm.levels.length === 0) {
      return toast.error('Select at least one difficulty level');
    }

    try {
      if (editingTopic) {
        await updateCrtTopic(currentModule._id, editingTopic._id, topicForm);
        toast.success(`Topic '${topicForm.name}' updated!`);
      } else {
        const res = await createCrtTopic(currentModule._id, topicForm);
        toast.success(`Topic '${topicForm.name}' created!`);
        if (res?.data?.data?._id) setSelectedTopicId(String(res.data.data._id));
      }
      setIsTopicModalOpen(false);
      await fetchStructure(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save topic');
    }
  };

  const handleDeleteTopic = async (topic, e) => {
    e?.stopPropagation();
    if (!window.confirm(`Delete topic '${topic.name}'?`)) return;
    try {
      await deleteCrtTopic(currentModule._id, topic._id);
      toast.success(`Topic '${topic.name}' deleted`);
      await fetchStructure(true);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete topic');
    }
  };

  // Helper badge for question types in table
  const renderTypeBadge = (convType, qType) => {
    if (convType === 'text_to_audio' || qType === 'text_to_audio') {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
          TTS
        </span>
      );
    }
    if (convType === 'audio_to_text' || qType === 'audio_to_text') {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          STT
        </span>
      );
    }
    if (convType === 'both' || qType === 'both' || qType === 'audio_interactive') {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          Dual AI
        </span>
      );
    }
    if (qType === 'technical') {
      return (
        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          Technical
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
        MCQ
      </span>
    );
  };

  // Helper badge for College Scope in table & details (no icons, clean tag)
  const renderCollegeBadge = (q) => {
    const colIds = Array.isArray(q?.college_ids) && q.college_ids.length > 0
      ? q.college_ids
      : (q?.college_id ? [q.college_id] : []);
    const isGlobal = q?.is_global || colIds.length === 0 || q?.college_name === 'All Colleges';

    if (isGlobal) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
          Global
        </span>
      );
    }

    if (colIds.length > 1) {
      const collegeNames = colIds
        .map(id => colleges.find(c => String(c.id) === String(id))?.name || `College #${id}`)
        .join(', ');
      return (
        <span
          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs"
          title={collegeNames}
        >
          {colIds.length} Colleges
        </span>
      );
    }

    const col = colleges.find(c => String(c.id) === String(colIds[0]));
    const label = col?.code ? `[${col.code}] ${col.name}` : (q?.college_name || `College #${colIds[0]}`);

    return (
      <span
        className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 max-w-[130px] truncate shadow-2xs"
        title={col?.name || label}
      >
        <span className="truncate">{label}</span>
      </span>
    );
  };

  if (loading) {
    return <SkeletonLoader type="crt" />;
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-slate-800 p-3 sm:p-4 md:p-5 lg:p-6 space-y-4 md:space-y-5">

      {/* ============================================================= */}
      {/* 1. TOP HEADER & BREADCRUMBS                                    */}
      {/* ============================================================= */}
      <div className="space-y-2">
        {/* Header Search & Actions */}
        <div className="flex items-center justify-end text-xs text-slate-500 font-medium">
          {/* User & Global Header Search on larger screens */}
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Search modules, topics or questions..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>

            <button className="relative p-1.5 rounded-full bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shadow-2xs">
              <Bell className="w-4 h-4" />
              <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-rose-500"></span>
            </button>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                S
              </div>
              <span className="text-xs font-bold text-slate-800 hidden sm:inline">School</span>
            </div>
          </div>
        </div>

        {/* Header Title & Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-[#0F172A] tracking-tight">
              CRT &amp; Versant Question Bank
            </h1>
            
          </div>

          <div className="flex items-center gap-2.5">
            {/* Import Questions Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span>Import Questions</span>
            </button>

            {/* Add Module Button (Royal Blue) */}
            <button
              onClick={() => handleOpenModuleModal()}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Module</span>
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* 2. COMPACT MODULE CARDS INLINE ROW (Single Horizontal Track)   */}
      {/* ============================================================= */}
      <div className="relative group/moduleRow">
        {/* Left Arrow Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => scrollModules('left')}
            className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all opacity-95 hover:scale-105"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {/* Right Arrow Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => scrollModules('right')}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all opacity-95 hover:scale-105"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}

        {/* Horizontal Modules Track */}
        <div
          ref={modulesScrollRef}
          onScroll={checkModuleScroll}
          className="flex items-stretch gap-3.5 overflow-x-auto pb-2.5 pt-0.5 module-scroll-track scroll-smooth"
        >
          {modules.map((mod) => {
            const isSelected = String(mod._id) === String(selectedModuleId) || mod.code === selectedModuleId;
            const theme = MODULE_THEMES[mod.code] || {
              badgeBg: 'bg-indigo-600 text-white',
              ringColor: 'ring-indigo-600 border-indigo-600',
              icon: ICON_MAP[mod.icon] || BookOpen,
              defaultSubtitle: mod.description || 'Module assessments'
            };
            const IconComp = theme.icon || BookOpen;

            return (
              <div
                key={mod._id || mod.code}
                data-module-id={String(mod._id)}
                onClick={() => setSelectedModuleId(String(mod._id))}
                className={`relative bg-white rounded-xl p-3 border transition-all cursor-pointer text-left shadow-2xs min-w-[195px] sm:min-w-[205px] flex-1 shrink-0 ${
                  isSelected
                    ? `border-2 ${theme.ringColor} shadow-md`
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Icon Badge & Three Dots Menu */}
                <div className="flex items-start justify-between">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme.badgeBg} shadow-2xs`}>
                    <IconComp className="w-4 h-4 text-white stroke-[2.2]" />
                  </div>

                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenModuleMenuId(openModuleMenuId === mod._id ? null : mod._id);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {openModuleMenuId === mod._id && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-7 z-20 w-32 bg-white rounded-xl shadow-lg border border-slate-100 py-1 text-xs font-semibold"
                      >
                        <button
                          onClick={() => handleOpenModuleModal(mod)}
                          className="w-full text-left px-3 py-1.5 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                        >
                          <Edit2 className="w-3 h-3 text-slate-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => handleDeleteModule(mod, e)}
                          className="w-full text-left px-3 py-1.5 text-rose-600 hover:bg-rose-50 flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3 h-3 text-rose-500" />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Module Assessment Type Badge */}
                <div className="mt-3 flex items-center">
                  {(() => {
                    const mType = MODULE_TYPES.find(t => t.id === mod.module_type) || MODULE_TYPES[0];
                    const MTypeIcon = mType.icon;
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${mType.color}`}>
                        <MTypeIcon className="w-2.5 h-2.5" />
                        <span>{mType.badge}</span>
                      </span>
                    );
                  })()}
                </div>

                {/* Title & Subtitle */}
                <h3 className="font-bold text-slate-900 mt-1.5 text-sm tracking-tight truncate">
                  {mod.name}
                </h3>
                

                {/* Counts Footer */}
                <div className="flex items-center text-[11px] font-bold text-slate-600 pt-2.5 mt-2 border-t border-slate-100">
                  <span>{mod.topics?.length || 0} Topics</span>
                  <span className="mx-1.5 text-slate-300">|</span>
                  <span className="text-slate-800">{mod.question_count || 0} Questions</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================= */}
      {/* 3. MAIN WORKSPACE: THREE-SECTION DESKTOP LAYOUT                */}
      {/* ============================================================= */}
      <div className="w-full flex flex-col lg:flex-row gap-5 items-start">

        {/* ----------------------------------------------------------- */}
        {/* LEFT SECTION: TOPICS SIDEBAR (Width: ~260px)                 */}
        {/* ----------------------------------------------------------- */}
        <div className="w-full lg:w-72 shrink-0 bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight">
              Topics ({currentModule?.topics?.length || 0})
            </h3>
            <button
              onClick={() => handleOpenTopicModal()}
              className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded-md text-[11px] font-bold shadow-2xs transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Topic</span>
            </button>
          </div>

          {/* Search topics input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={topicSearch}
              onChange={(e) => setTopicSearch(e.target.value)}
              placeholder="Search topics..."
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Topics List */}
          <div className="space-y-1 max-h-[620px] overflow-y-auto pr-0.5">
            {filteredTopics.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No topics found
              </div>
            ) : (
              filteredTopics.map((topic) => {
                const isTopicSelected = String(topic._id) === String(selectedTopicId) || topic.code === selectedTopicId;
                return (
                  <div
                    key={topic._id || topic.code}
                    onClick={() => {
                      setSelectedTopicId(String(topic._id));
                      setSelectedLevel('all');
                      setCurrentPage(1);
                    }}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                      isTopicSelected
                        ? 'bg-blue-50 text-blue-700 font-bold border-l-4 border-blue-600 rounded-l-none'
                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                    }`}
                  >
                    <span className="truncate pr-2">{topic.name}</span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[11px] text-slate-400 font-semibold">
                        {topic.question_count || 0} Qs
                      </span>
                      <ChevronRight className={`w-3.5 h-3.5 ${isTopicSelected ? 'text-blue-600' : 'text-slate-300'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ----------------------------------------------------------- */}
        {/* CENTER SECTION: QUESTIONS MANAGEMENT TABLE                   */}
        {/* ----------------------------------------------------------- */}
        <div className="flex-1 w-full bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">

          {/* Selected Topic Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {currentTopic?.name || 'Select a Topic'}
                </h2>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Active</span>
                </span>
                {currentModule?.module_type && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                    (MODULE_TYPES.find(t => t.id === currentModule.module_type) || MODULE_TYPES[0]).color
                  }`}>
                    <span>{(MODULE_TYPES.find(t => t.id === currentModule.module_type) || MODULE_TYPES[0]).label}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {currentTopic?.description || 'Questions repository for this topic'}
              </p>
            </div>

            {/* Edit / Delete Topic Actions */}
            {currentTopic && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenTopicModal(currentTopic)}
                  className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Edit Topic</span>
                </button>
                <button
                  onClick={() => handleDeleteTopic(currentTopic)}
                  className="inline-flex items-center gap-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Delete Topic</span>
                </button>
              </div>
            )}
          </div>

          {/* Sub-tabs: Levels / Questions / Analytics */}
          <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-bold text-slate-500">
            <button
              onClick={() => setActiveCenterTab('levels')}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
                activeCenterTab === 'levels'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'hover:text-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Levels</span>
            </button>
            <button
              onClick={() => setActiveCenterTab('questions')}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
                activeCenterTab === 'questions'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Questions</span>
            </button>
            <button
              onClick={() => setActiveCenterTab('analytics')}
              className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
                activeCenterTab === 'analytics'
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'hover:text-slate-800'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </div>

          {/* Dynamic Difficulty Level Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setSelectedLevel('all'); setCurrentPage(1); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedLevel === 'all'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>All Levels</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedLevel === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {questions.length}
              </span>
            </button>

            {(currentTopic?.levels || []).map((lvl) => {
              const isLvlActive = String(selectedLevel) === String(lvl.level);
              return (
                <button
                  key={lvl.level}
                  onClick={() => { setSelectedLevel(lvl.level); setCurrentPage(1); }}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isLvlActive
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Level {lvl.level}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    isLvlActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {lvl.question_count || 0}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search, Type Filter, College Scope, Template & Add Question Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              {/* College Scope Multi-Select Filter */}
              <div className="w-56">
                <MultiSelectDropdown
                  options={colleges}
                  selectedValues={selectedCollegeFilters}
                  onChange={(vals) => {
                    setSelectedCollegeFilters(vals);
                    setImportCollegeScopes(vals);
                    setBulkSentenceCollegeScopes(vals);
                    setCurrentPage(1);
                  }}
                  allLabel="All Colleges"
                  placeholder="Filter colleges..."
                  compact={true}
                />
              </div>

              {selectedCollegeFilters.length > 0 && (
                <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-indigo-50/70 border border-indigo-100 rounded-lg px-2 py-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeGlobalWithCollege}
                    onChange={(e) => setIncludeGlobalWithCollege(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                  />
                  <span>+ Include Global</span>
                </label>
              )}

              {/* Type Filter Select */}
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
              >
                <option value="all">All Types</option>
                <option value="none">Standard MCQ</option>
                <option value="text_to_audio">Text to Audio (TTS)</option>
                <option value="audio_to_text">Audio to Text (STT)</option>
                <option value="both">Dual Voice AI</option>
                <option value="technical">Technical / Coding</option>
              </select>

              {/* Level Dropdown Filter */}
              <select
                value={levelDropdownFilter}
                onChange={(e) => { setLevelDropdownFilter(e.target.value); setCurrentPage(1); }}
                className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
              >
                <option value="all">All Levels</option>
                {(currentTopic?.levels || []).map(l => (
                  <option key={l.level} value={l.level}>Level {l.level}</option>
                ))}
              </select>

              {/* Question Search Input */}
              <div className="relative min-w-[180px] flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => { setQuestionSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Search questions..."
                  className="w-full pl-8 pr-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Template</span>
              </button>

              <label className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Upload CSV/Excel</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>

              {/* Quick Paste Sentences (Speaking & Versant) */}
              <button
                type="button"
                onClick={() => setIsBulkSentenceModalOpen(true)}
                className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors"
                title="Paste a list of sentences to auto-create speaking test questions"
              >
                <Mic className="w-3.5 h-3.5 text-rose-600" />
                <span>+ Paste Sentences</span>
              </button>

              {/* Add Question Button (Royal Blue) */}
              <button
                onClick={() => handleOpenAddDrawer()}
                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Question</span>
              </button>
            </div>
          </div>

          {/* Bulk Selection Action Bar */}
          {selectedQuestionIds.length > 0 && (
            <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-bold text-blue-900">
              <span>{selectedQuestionIds.length} question(s) selected</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-2xs"
                >
                  Delete Selected
                </button>
                <button
                  onClick={() => setSelectedQuestionIds([])}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  Deselect
                </button>
              </div>
            </div>
          )}

          {/* Questions Management Table */}
          {questionsLoading ? (
            <div className="py-4">
              <SkeletonLoader type="table" count={4} />
            </div>
          ) : pagedQuestions.length === 0 ? (
            <div className="py-14 text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <FileText className="w-9 h-9 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-800 font-bold text-sm">No questions found</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Click "+ Add Question" or "Upload CSV/Excel" to add questions to this topic.
              </p>
              <button
                onClick={() => handleOpenAddDrawer()}
                className="mt-3 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-2xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Question</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedQuestionIds.length > 0 && selectedQuestionIds.length === pagedQuestions.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </th>
                    <th className="p-3 w-8">#</th>
                    <th className="p-3 w-20">Type</th>
                    <th className="p-3">Question Content</th>
                    <th className="p-3 w-28">Scope</th>
                    <th className="p-3 w-20">Level</th>
                    <th className="p-3 w-16">Duration</th>
                    <th className="p-3 w-14 text-center">Audio</th>
                    <th className="p-3 w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {pagedQuestions.map((q, idx) => {
                    const rowNumber = (currentPage - 1) * pageSize + idx + 1;
                    const isSelected = selectedQuestionIds.includes(q._id);
                    const conv = q.conversion_type || 'none';
                    const hasAudio = conv === 'text_to_audio' || conv === 'both';
                    const isPlaying = playingAudioScript === (q.audio_script || q.text);

                    return (
                      <tr key={q._id || idx} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelectRow(q._id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-semibold text-slate-400">{rowNumber}</td>
                        <td className="p-3">
                          {renderTypeBadge(q.conversion_type, q.question_type)}
                        </td>
                        <td className="p-3 font-medium max-w-sm truncate text-slate-900" title={q.text}>
                          {q.text}
                        </td>
                        <td className="p-3">
                          {renderCollegeBadge(q)}
                        </td>
                        <td className="p-3 font-semibold text-slate-600">
                          Level {q.level_id || 1}
                        </td>
                        <td className="p-3 text-slate-500 font-semibold">
                          {q.time_limit_seconds ? `${q.time_limit_seconds}s` : '-'}
                        </td>
                        <td className="p-3 text-center">
                          {hasAudio ? (
                            <button
                              type="button"
                              onClick={() => isPlaying ? handleStopAudio() : handlePlayAudio(q.audio_script || q.text)}
                              title="Play audio prompt"
                              className={`p-1 rounded-full transition-colors ${
                                isPlaying ? 'bg-rose-600 text-white animate-pulse' : 'text-blue-600 hover:bg-blue-50'
                              }`}
                            >
                              {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                            </button>
                          ) : conv === 'audio_to_text' ? (
                            <Mic className="w-3.5 h-3.5 text-emerald-600 mx-auto" title="Spoken microphone question" />
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => setViewingQuestion(q)}
                              title="View details"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditDrawer(q)}
                              title="Edit question"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteQuestion(q._id)}
                              title="Delete question"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Footer: Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div>
              Showing {displayedQuestions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, totalQuestions)} of {totalQuestions} questions
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={pg}
                  onClick={() => setCurrentPage(pg)}
                  className={`w-7 h-7 rounded-lg font-bold text-xs transition-colors ${
                    currentPage === pg
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {pg}
                </button>
              ))}

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>

        {/* ----------------------------------------------------------- */}
        {/* RIGHT SECTION: ADD / EDIT QUESTION DRAWER (Width: ~360px)    */}
        {/* ----------------------------------------------------------- */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full lg:w-[380px] shrink-0 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                  {editingQuestion ? 'Edit Question' : 'Add Question'}
                </h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 3-Step Wizard Indicator */}
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1 pb-1">
                <div className={`flex items-center gap-1.5 ${drawerStep === 1 ? 'text-blue-600' : drawerStep > 1 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    drawerStep === 1 ? 'bg-blue-600 text-white' : drawerStep > 1 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    1
                  </span>
                  <span>Type</span>
                </div>

                <div className="w-6 h-0.5 bg-slate-200"></div>

                <div className={`flex items-center gap-1.5 ${drawerStep === 2 ? 'text-blue-600' : drawerStep > 2 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    drawerStep === 2 ? 'bg-blue-600 text-white' : drawerStep > 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    2
                  </span>
                  <span>Content</span>
                </div>

                <div className="w-6 h-0.5 bg-slate-200"></div>

                <div className={`flex items-center gap-1.5 ${drawerStep === 3 ? 'text-blue-600' : 'text-slate-400'}`}>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    drawerStep === 3 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    3
                  </span>
                  <span>Settings</span>
                </div>
              </div>

              {/* STEP 1: SELECT QUESTION TYPE */}
              {drawerStep === 1 && (
                <div className="space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Select Question Type
                  </div>

                  <div className="space-y-2">
                    {QUESTION_TYPES.map((t) => {
                      const isSelected = drawerForm.typeId === t.id;
                      const IconComp = t.icon;
                      return (
                        <div
                          key={t.id}
                          onClick={() => handleSelectDrawerType(t)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-blue-50/70 border-2 border-blue-600 shadow-2xs'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.iconBg}`}>
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-slate-900">{t.title}</div>
                              <div className="text-[11px] text-slate-500">{t.subtitle}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Informational Callout Box */}
                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-900 leading-relaxed">
                    <div className="font-bold mb-0.5">
                      {QUESTION_TYPES.find(t => t.id === drawerForm.typeId)?.title}:
                    </div>
                    {QUESTION_TYPES.find(t => t.id === drawerForm.typeId)?.description}
                  </div>

                  {/* Step 1 Footer Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDrawerNext}
                      className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: ENTER QUESTION CONTENT */}
              {drawerStep === 2 && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Question Text / Prompt Statement *
                    </label>
                    <textarea
                      rows={3}
                      value={drawerForm.text}
                      onChange={(e) => setDrawerForm({ ...drawerForm, text: e.target.value })}
                      placeholder={
                        drawerForm.typeId === 'audio_to_text'
                          ? 'e.g. "Read the following sentence aloud clearly into the microphone."'
                          : drawerForm.typeId === 'text_to_audio'
                          ? 'e.g. "Listen to the announcement and identify the room number."'
                          : 'Enter the question statement...'
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Audio Script for Text-to-Audio / Dual Voice AI */}
                  {(drawerForm.typeId === 'text_to_audio' || drawerForm.typeId === 'both') && (
                    <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold text-blue-900 uppercase">
                          TTS Audio Prompt Script
                        </label>
                        <button
                          type="button"
                          onClick={() => handlePlayAudio(drawerForm.audio_script || drawerForm.text)}
                          className="inline-flex items-center gap-1 bg-white hover:bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold border border-blue-200"
                        >
                          <Play className="w-2.5 h-2.5" />
                          <span>Test Voice</span>
                        </button>
                      </div>
                      <textarea
                        rows={2}
                        value={drawerForm.audio_script}
                        onChange={(e) => setDrawerForm({ ...drawerForm, audio_script: e.target.value })}
                        placeholder="The exact sentence or dialogue synthesized into voice..."
                        className="w-full px-2.5 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Reference Text for Audio-to-Text / Dual Voice AI */}
                  {(drawerForm.typeId === 'audio_to_text' || drawerForm.typeId === 'both') && (
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1.5">
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase">
                        Expected Spoken Transcript (For AI Whisper Scoring)
                      </label>
                      <textarea
                        rows={2}
                        value={drawerForm.reference_text}
                        onChange={(e) => setDrawerForm({ ...drawerForm, reference_text: e.target.value })}
                        placeholder="e.g. Traffic congestion has become a major challenge for modern urban cities worldwide."
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* MCQ Options (for MCQ or Text-to-Audio listening comprehension) */}
                  {(drawerForm.typeId === 'mcq' || drawerForm.typeId === 'text_to_audio') && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase">
                        Options &amp; Correct Answer
                      </label>
                      {drawerForm.options.map((opt, idx) => {
                        const isCorrect = String(opt).trim() !== '' && String(opt).trim() === String(drawerForm.correct_answer).trim();
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                              isCorrect ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => setDrawerForm({ ...drawerForm, correct_answer: opt })}
                              className={`w-4 h-4 rounded-full flex items-center justify-center border ${
                                isCorrect ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isCorrect && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </button>
                            <span className="font-bold text-slate-400 w-3">{String.fromCharCode(65 + idx)}.</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...drawerForm.options];
                                newOpts[idx] = e.target.value;
                                setDrawerForm({
                                  ...drawerForm,
                                  options: newOpts,
                                  correct_answer: isCorrect ? e.target.value : drawerForm.correct_answer
                                });
                              }}
                              placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                              className="flex-1 bg-transparent text-xs font-semibold focus:outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Technical Coding Fields */}
                  {drawerForm.typeId === 'technical' && (
                    <div className="space-y-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                      <label className="block text-[11px] font-bold text-amber-900 uppercase">Code Stub</label>
                      <textarea
                        rows={3}
                        value={drawerForm.code_stub}
                        onChange={(e) => setDrawerForm({ ...drawerForm, code_stub: e.target.value })}
                        placeholder="def solution():&#10;    pass"
                        className="w-full px-2.5 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono"
                      />
                    </div>
                  )}

                  {/* Explanation */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Explanation / Solution Notes
                    </label>
                    <textarea
                      rows={2}
                      value={drawerForm.explanation}
                      onChange={(e) => setDrawerForm({ ...drawerForm, explanation: e.target.value })}
                      placeholder="Step-by-step walkthrough or note..."
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
                    />
                  </div>

                  {/* Step 2 Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleDrawerBack}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDrawerNext}
                      className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: CONFIGURE DIFFICULTY, DURATION & SETTINGS */}
              {drawerStep === 3 && (
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Settings &amp; Difficulty
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Target Difficulty Level *
                    </label>
                    <select
                      value={drawerForm.level_id}
                      onChange={(e) => setDrawerForm({ ...drawerForm, level_id: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      {(currentTopic?.levels || []).map(lvl => (
                        <option key={lvl.level} value={lvl.level}>
                          Level {lvl.level} - {lvl.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Candidate Duration / Limit
                    </label>
                    <select
                      value={drawerForm.time_limit_seconds}
                      onChange={(e) => setDrawerForm({ ...drawerForm, time_limit_seconds: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value={15}>15 Seconds (Rapid Versant / Short Answer)</option>
                      <option value={25}>25 Seconds (Versant Repeat Sentence)</option>
                      <option value={30}>30 Seconds (Standard MCQ / Speaking Default)</option>
                      <option value={45}>45 Seconds (Reading Aloud / Comprehension)</option>
                      <option value={60}>60 Seconds (1 Minute - Analytical MCQ)</option>
                      <option value={90}>90 Seconds (1.5 Minutes - Long Passage)</option>
                      <option value={120}>120 Seconds (2 Minutes - Technical Challenge)</option>
                      <option value={300}>300 Seconds (5 Minutes - Complex Coding Algorithm)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      College Scope (Bank Assignment)
                    </label>
                    <MultiSelectDropdown
                      options={colleges}
                      selectedValues={drawerForm.college_ids || []}
                      onChange={(vals) => {
                        const isGlob = vals.length === 0;
                        let colName = 'All Colleges';
                        if (vals.length === 1) {
                          const found = colleges.find(c => String(c.id) === String(vals[0]));
                          colName = found?.name || `College #${vals[0]}`;
                        } else if (vals.length > 1) {
                          colName = `${vals.length} Colleges`;
                        }
                        setDrawerForm(prev => ({
                          ...prev,
                          college_ids: vals,
                          college_id: vals[0] ? Number(vals[0]) : null,
                          college_name: colName,
                          is_global: isGlob
                        }));
                      }}
                      allLabel="All Colleges (Global Question)"
                      placeholder="Select colleges..."
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Scoped questions are prioritized for students belonging to the chosen colleges.
                    </p>
                  </div>

                  {/* Summary Review Card */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                    <div className="font-bold text-slate-700">Question Summary:</div>
                    <div className="text-slate-600 line-clamp-2 italic">"{drawerForm.text}"</div>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-bold">
                      <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 uppercase">
                        {drawerForm.typeId}
                      </span>
                      <span className="text-slate-500">
                        Level {drawerForm.level_id} • {drawerForm.time_limit_seconds}s
                      </span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {drawerForm.is_global || !(drawerForm.college_ids?.length) ? 'Global' : drawerForm.college_name}
                      </span>
                    </div>
                  </div>

                  {/* Step 3 Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleDrawerBack}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDrawerQuestion}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{editingQuestion ? 'Update Question' : 'Save Question'}</span>
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ============================================================= */}
      {/* MODAL 1: IMPORT QUESTIONS (BULK CSV / EXCEL)                   */}
      {/* ============================================================= */}
      <AnimatePresence>
        {isImportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-3xl w-full p-6 border border-slate-200 shadow-xl space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Import Questions {parsedImportRows.length > 0 && `(${parsedImportRows.length})`}
                  </h3>
                </div>
                <button onClick={() => setIsImportModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Target College Scope Selection Banner */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-slate-800">
                    Target College Scope
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Imported questions will be scoped to the selected college question banks.
                  </p>
                </div>
                <div className="w-full sm:w-80">
                  <MultiSelectDropdown
                    options={colleges}
                    selectedValues={importCollegeScopes}
                    onChange={setImportCollegeScopes}
                    allLabel="All Colleges (Global Question Bank)"
                    placeholder="Select colleges..."
                  />
                </div>
              </div>

              {parsedImportRows.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-3">
                  <Upload className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">Select a CSV or Excel file to preview and import</p>
                  <div className="flex items-center justify-center gap-3">
                    <label className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer">
                      <span>Choose File</span>
                      <input type="file" accept=".csv,.xlsx,.xls" onChange={handleFileSelect} className="hidden" />
                    </label>
                    <button onClick={handleDownloadTemplate} className="px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50">
                      Download Sample Template
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl max-h-[45vh]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5 w-8">#</th>
                        <th className="p-2.5 w-20">Type</th>
                        <th className="p-2.5">Question Prompt</th>
                        <th className="p-2.5">Answer / Reference</th>
                        <th className="p-2.5 w-24">Scope</th>
                        <th className="p-2.5 w-16">Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedImportRows.slice(0, 50).map((row, idx) => {
                        const isGlobal = !row.college_id && (!importCollegeScopes || importCollegeScopes.length === 0);
                        let scopeLabel = 'Global';
                        if (!isGlobal) {
                          if (row.college_id) {
                            const c = colleges.find(item => String(item.id) === String(row.college_id));
                            scopeLabel = c?.code ? `[${c.code}]` : (c?.name || `College #${row.college_id}`);
                          } else if (importCollegeScopes.length === 1) {
                            const c = colleges.find(item => String(item.id) === String(importCollegeScopes[0]));
                            scopeLabel = c?.code ? `[${c.code}]` : (c?.name || `College #${importCollegeScopes[0]}`);
                          } else {
                            scopeLabel = `${importCollegeScopes.length} Colleges`;
                          }
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="p-2.5 text-slate-400">{idx + 1}</td>
                            <td className="p-2.5">{renderTypeBadge(row.conversion_type, row.question_type)}</td>
                            <td className="p-2.5 truncate max-w-xs">{row.text}</td>
                            <td className="p-2.5 font-semibold text-emerald-700 truncate max-w-xs">{row.correct_answer || row.reference_text}</td>
                            <td className="p-2.5">
                              {isGlobal ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                  Global
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 max-w-[120px] truncate" title={scopeLabel}>
                                  <span className="truncate">{scopeLabel}</span>
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">Level {row.level_id}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-500">{importFileName}</span>
                <div className="flex items-center gap-2">
                  <button onClick={() => setIsImportModalOpen(false)} className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
                    Cancel
                  </button>
                  {parsedImportRows.length > 0 && (
                    <button
                      onClick={handleConfirmImport}
                      disabled={isImportSubmitting}
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                    >
                      {isImportSubmitting ? 'Importing...' : `Confirm & Import (${parsedImportRows.length})`}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* MODAL: BULK ADD SENTENCES (SPEAKING & VERSANT)                 */}
      {/* ============================================================= */}
      <AnimatePresence>
        {isBulkSentenceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Mic className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">
                      Quick Add Sentences List
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Paste sentences to create speaking test questions with Whisper AI scoring
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBulkSentenceModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Target Level *
                    </label>
                    <select
                      value={bulkSentenceLevel}
                      onChange={(e) => setBulkSentenceLevel(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      {(currentTopic?.levels || []).map(lvl => (
                        <option key={lvl.level} value={lvl.level}>
                          Level {lvl.level} - {lvl.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Speaking Time Limit *
                    </label>
                    <select
                      value={bulkSentenceDuration}
                      onChange={(e) => setBulkSentenceDuration(parseInt(e.target.value, 10))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                    >
                      <option value={15}>15 Seconds (Rapid Versant)</option>
                      <option value={25}>25 Seconds (Short Sentences)</option>
                      <option value={30}>30 Seconds (Default)</option>
                      <option value={45}>45 Seconds (Paragraphs / Long Sentences)</option>
                      <option value={60}>60 Seconds</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Target College Scope *
                    </label>
                    <MultiSelectDropdown
                      options={colleges}
                      selectedValues={bulkSentenceCollegeScopes}
                      onChange={setBulkSentenceCollegeScopes}
                      allLabel="All Colleges (Global Question Bank)"
                      placeholder="Select colleges..."
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Created questions will be assigned to these colleges' speaking question bank.
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Paste Sentences List (One Per Line) *
                    </label>
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                      {bulkSentenceText.split('\n').map(s => s.trim()).filter(s => s.length > 3).length} Sentences Detected
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    value={bulkSentenceText}
                    onChange={(e) => setBulkSentenceText(e.target.value)}
                    placeholder={`Traffic congestion has become a major challenge for modern urban cities worldwide.\nArtificial intelligence and machine learning are revolutionizing software development.\nPlease leave your visitor badge at the reception desk before departing.\nThe flight to Chicago has been delayed by approximately forty-five minutes.`}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium font-mono text-slate-800 focus:outline-none focus:bg-white focus:ring-1 focus:ring-rose-500 leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Each sentence is automatically saved as a reference text for Whisper AI pronunciation and fluency scoring.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsBulkSentenceModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBulkSentences}
                    disabled={isBulkSentenceSubmitting || !bulkSentenceText.trim()}
                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>
                      {isBulkSentenceSubmitting
                        ? 'Creating Questions...'
                        : `Import Sentences (${bulkSentenceText.split('\n').map(s => s.trim()).filter(s => s.length > 3).length})`}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* MODAL 2: ADD / EDIT MAIN MODULE                                */}
      {/* ============================================================= */}
      <AnimatePresence>
        {isModuleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 border border-slate-200 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    {editingModule ? 'Edit Main Module' : 'Add Main Module'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure module details, assessment type, and icon
                  </p>
                </div>
                <button onClick={() => setIsModuleModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveModule} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Module Name *</label>
                  <input
                    type="text"
                    required
                    value={moduleForm.name}
                    onChange={(e) => setModuleForm({ ...moduleForm, name: e.target.value })}
                    placeholder="e.g. Quantitative Aptitude, Technical & CS, Versant & Voice"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>

                {/* Module Assessment Type Selection */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Module Assessment Type *
                    </label>
                    <span className="text-[11px] font-medium text-slate-500">
                      Select primary assessment engine &amp; mode
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {MODULE_TYPES.map((type) => {
                      const isSel = (moduleForm.module_type || 'mcq') === type.id;
                      const TypeIcon = type.icon;
                      return (
                        <div
                          key={type.id}
                          onClick={() => setModuleForm({ ...moduleForm, module_type: type.id })}
                          className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-2.5 ${
                            isSel
                              ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-500 shadow-2xs'
                              : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSel ? 'bg-blue-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-600'
                          }`}>
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold truncate ${isSel ? 'text-blue-900' : 'text-slate-800'}`}>
                                {type.label}
                              </span>
                              {isSel && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-1 leading-tight mt-0.5">
                              {type.subtitle}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Code / Identifier</label>
                    <input
                      type="text"
                      value={moduleForm.code}
                      onChange={(e) => setModuleForm({ ...moduleForm, code: e.target.value })}
                      placeholder="Auto-generated if blank (e.g. aptitude)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Icon Style</label>
                    <select
                      value={moduleForm.icon || 'BookOpen'}
                      onChange={(e) => setModuleForm({ ...moduleForm, icon: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white"
                    >
                      <option value="Calculator">Calculator (Aptitude)</option>
                      <option value="Brain">Brain (Logical Reasoning)</option>
                      <option value="Code">Code (Technical & CS)</option>
                      <option value="BookOpen">BookOpen (Verbal Ability)</option>
                      <option value="Headphones">Headphones (Versant Voice)</option>
                      <option value="Mic">Mic (Speaking)</option>
                      <option value="Volume2">Volume (Listening)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                  <textarea
                    rows={2}
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    placeholder="Brief description of subjects covered in this module..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsModuleModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
                    {editingModule ? 'Save Changes' : 'Create Module'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* MODAL 3: ADD / EDIT TOPIC (WITH LEVEL SELECTION PROMPT)        */}
      {/* ============================================================= */}
      <AnimatePresence>
        {isTopicModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingTopic ? 'Edit Topic & Levels' : 'Add Topic with Levels'}
                </h3>
                <button onClick={() => setIsTopicModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTopic} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Topic Name *</label>
                  <input
                    type="text"
                    required
                    value={topicForm.name}
                    onChange={(e) => setTopicForm({ ...topicForm, name: e.target.value })}
                    placeholder="e.g. Time & Work, Reading Aloud"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description</label>
                  <input
                    type="text"
                    value={topicForm.description}
                    onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                    placeholder="Short description..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                {/* Level selection prompt */}
                <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-blue-900 uppercase">Select Available Difficulty Levels *</div>
                  <div className="space-y-1.5">
                    {DEFAULT_LEVEL_PRESETS.map(preset => {
                      const isSelected = (topicForm.levels || []).some(l => l.level === preset.level);
                      return (
                        <div
                          key={preset.level}
                          onClick={() => {
                            const exists = (topicForm.levels || []).some(l => l.level === preset.level);
                            if (exists) {
                              if (topicForm.levels.length <= 1) return toast.error('Topic must have at least 1 level');
                              setTopicForm({ ...topicForm, levels: topicForm.levels.filter(l => l.level !== preset.level) });
                            } else {
                              const updated = [...topicForm.levels, preset].sort((a, b) => a.level - b.level);
                              setTopicForm({ ...topicForm, levels: updated });
                            }
                          }}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                            isSelected ? 'bg-white border-blue-300 font-bold text-blue-900 shadow-2xs' : 'bg-white/60 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={isSelected} readOnly className="rounded text-blue-600 pointer-events-none" />
                            <span>{preset.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">L{preset.level}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setIsTopicModalOpen(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold">
                    {editingTopic ? 'Update Topic' : 'Create Topic'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ============================================================= */}
      {/* MODAL 4: VIEW QUESTION DETAILS                                 */}
      {/* ============================================================= */}
      <AnimatePresence>
        {viewingQuestion && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  {renderTypeBadge(viewingQuestion.conversion_type, viewingQuestion.question_type)}
                  {renderCollegeBadge(viewingQuestion)}
                  <h3 className="text-base font-extrabold text-slate-900">Question Details</h3>
                </div>
                <button onClick={() => setViewingQuestion(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px]">Prompt Statement</span>
                  <p className="text-sm font-semibold text-slate-900 mt-1">{viewingQuestion.text}</p>
                </div>

                {viewingQuestion.audio_script && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1">
                    <span className="font-bold text-blue-900 uppercase text-[10px]">TTS Audio Script:</span>
                    <p className="text-blue-800">{viewingQuestion.audio_script}</p>
                  </div>
                )}

                {viewingQuestion.reference_text && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                    <span className="font-bold text-emerald-900 uppercase text-[10px]">Expected Reference Transcript:</span>
                    <p className="text-emerald-800">{viewingQuestion.reference_text}</p>
                  </div>
                )}

                {viewingQuestion.options && viewingQuestion.options.length > 0 && (
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-[10px]">Options</span>
                    {viewingQuestion.options.map((opt, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg border ${
                          String(opt).trim() === String(viewingQuestion.correct_answer).trim()
                            ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-800'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {String.fromCharCode(65 + i)}. {opt}
                      </div>
                    ))}
                  </div>
                )}

                {viewingQuestion.explanation && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <span className="font-bold text-slate-700">Explanation: </span>
                    <span className="text-slate-600">{viewingQuestion.explanation}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                <button onClick={() => setViewingQuestion(null)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
