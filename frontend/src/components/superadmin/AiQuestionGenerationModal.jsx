import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  Sliders,
  BookOpen,
  Brain,
  Calculator,
  Code,
  Headphones,
  Settings,
  HelpCircle,
  AlertCircle,
  RotateCw,
  CheckCircle2,
  Globe,
  Building2,
  Zap
} from 'lucide-react';
import MultiSelectDropdown from '../common/MultiSelectDropdown';
import { getAiQuestionSettings } from '../../services/api';

const DIFFICULTY_OPTIONS = [
  { value: 'Level 1', label: 'Level 1 (Fundamental / Easy)', desc: 'Basic formulas, direct concepts' },
  { value: 'Level 2', label: 'Level 2 (Standard Placement / Medium)', desc: 'Standard campus test difficulty' },
  { value: 'Level 3', label: 'Level 3 (Advanced / Hard)', desc: 'Multi-step logic, complex edge cases' }
];

const QUESTION_COUNT_OPTIONS = [5, 10, 20, 30, 50];

const AiQuestionGenerationModal = ({
  isOpen,
  onClose,
  modules = [],
  currentModuleId,
  currentTopicId,
  colleges = [],
  onGenerate,
  isGenerating,
  onOpenSettings
}) => {
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [difficulty, setDifficulty] = useState('Level 1');
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionType, setQuestionType] = useState('mcq');
  const [language, setLanguage] = useState('English');
  const [collegeScope, setCollegeScope] = useState(['all']);
  
  // Options
  const [includeExplanations, setIncludeExplanations] = useState(true);
  const [avoidDuplicates, setAvoidDuplicates] = useState(true);
  const [placementOriented, setPlacementOriented] = useState(true);
  const [activeProviderInfo, setActiveProviderInfo] = useState({ provider: 'groq', model: 'openai/gpt-oss-120b' });

  // Sync with current selection when opened
  useEffect(() => {
    if (isOpen) {
      if (currentModuleId) setSelectedModuleId(String(currentModuleId));
      if (currentTopicId) setSelectedTopicId(String(currentTopicId));
      setIsCustomTopic(false);
      setCustomTopic('');

      getAiQuestionSettings().then(res => {
        if (res.data?.success && res.data?.data) {
          const d = res.data.data;
          const prov = d.provider || 'groq';
          const mod = d.model || (prov === 'groq' ? (d.groq?.model || 'openai/gpt-oss-120b') : (d.gemini?.model || 'gemini-1.5-flash'));
          setActiveProviderInfo({
            provider: prov,
            model: mod
          });
        }
      }).catch(() => {});
    }
  }, [isOpen, currentModuleId, currentTopicId]);

  // Derived active module and topics
  const activeModule = modules.find(m => String(m._id) === String(selectedModuleId) || m.code === selectedModuleId) || modules[0];
  const activeTopics = activeModule?.topics || [];

  // When module changes, default to first topic
  const handleModuleChange = (e) => {
    const modId = e.target.value;
    setSelectedModuleId(modId);
    const mod = modules.find(m => String(m._id) === String(modId) || m.code === modId);
    if (mod?.topics?.length > 0) {
      setSelectedTopicId(String(mod.topics[0]._id || mod.topics[0].code));
    } else {
      setSelectedTopicId('');
    }
    setIsCustomTopic(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const topicObj = activeTopics.find(t => String(t._id) === String(selectedTopicId) || t.code === selectedTopicId);
    const resolvedTopicName = isCustomTopic && customTopic.trim() ? customTopic.trim() : (topicObj?.name || 'General');

    // Parse College Scope
    const isGlobal = collegeScope.includes('all') || collegeScope.length === 0;
    const parsedColIds = isGlobal
      ? []
      : collegeScope.map(v => Number(v)).filter(n => !isNaN(n) && n > 0);

    const firstCol = colleges.find(c => Number(c.id) === parsedColIds[0] || String(c.campus_id) === String(parsedColIds[0]));
    const collegeName = isGlobal ? 'All Colleges' : (firstCol ? firstCol.name : '');

    const payload = {
      module_id: activeModule?.code || 'aptitude',
      main_module_id: activeModule?._id || null,
      module_name: activeModule?.name || 'Quantitative Aptitude',
      topic_id: isCustomTopic ? '' : (topicObj?._id || topicObj?.code || ''),
      topic_name: resolvedTopicName,
      custom_topic: isCustomTopic ? customTopic.trim() : '',
      difficulty,
      num_questions: numQuestions,
      question_type: questionType,
      language,
      college_scope: {
        is_global: isGlobal,
        college_ids: parsedColIds,
        college_id: parsedColIds[0] || null,
        college_name: collegeName
      },
      include_explanations: includeExplanations,
      avoid_duplicates: avoidDuplicates,
      placement_oriented: placementOriented,
      model: activeProviderInfo.model || undefined
    };

    onGenerate(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6"
      >
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 px-6 py-4.5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Sparkles className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold tracking-tight">Generate Questions with AI</h3>
                <p className="text-xs text-white/80 flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-bold">
                    {activeProviderInfo.provider === 'groq' ? <Zap className="w-2.5 h-2.5" /> : <Sparkles className="w-2.5 h-2.5" />}
                    {activeProviderInfo.provider === 'groq' ? 'Groq' : 'Gemini'}: {activeProviderInfo.model}
                  </span>
                  <span>• Campus Placements</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {onOpenSettings && (
                <button
                  type="button"
                  onClick={onOpenSettings}
                  className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
                  title="Configure AI Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                disabled={isGenerating}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Module & Topic Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Module Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Module <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedModuleId}
                onChange={handleModuleChange}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              >
                {modules.map((m) => (
                  <option key={m._id || m.code} value={String(m._id || m.code)}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Topic Dropdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Topic <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomTopic(!isCustomTopic)}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-bold hover:underline"
                >
                  {isCustomTopic ? 'Select from list' : '+ Enter custom topic'}
                </button>
              </div>

              {isCustomTopic ? (
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="e.g. Dynamic Programming, Syllogisms"
                  disabled={isGenerating}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  required
                />
              ) : (
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  disabled={isGenerating}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                >
                  {activeTopics.length > 0 ? (
                    activeTopics.map((t) => (
                      <option key={t._id || t.code} value={String(t._id || t.code)}>
                        {t.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No predefined topics (use custom)</option>
                  )}
                </select>
              )}
            </div>
          </div>

          {/* Difficulty & Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty Level */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Difficulty Level <span className="text-rose-500">*</span>
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={isGenerating}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Number of Questions
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {QUESTION_COUNT_OPTIONS.map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setNumQuestions(cnt)}
                    disabled={isGenerating}
                    className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                      numQuestions === cnt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* College Scope */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              College Scope
            </label>
            <MultiSelectDropdown
              options={colleges.map((c) => ({
                value: String(c.id || c.campus_id),
                label: c.name || `College ${c.id}`
              }))}
              selectedValues={collegeScope}
              onChange={setCollegeScope}
              allLabel="All Colleges (Global Question Bank)"
              placeholder="Select colleges..."
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Generated questions will be scoped to these colleges, or globally for all students.
            </p>
          </div>

          {/* Additional Options */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Quality &amp; Placement Controls
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={includeExplanations}
                  onChange={(e) => setIncludeExplanations(e.target.checked)}
                  disabled={isGenerating}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold">Include step-by-step explanations</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none">
                <input
                  type="checkbox"
                  checked={avoidDuplicates}
                  onChange={(e) => setAvoidDuplicates(e.target.checked)}
                  disabled={isGenerating}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold">Check &amp; avoid existing duplicates</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-700 select-none sm:col-span-2">
                <input
                  type="checkbox"
                  checked={placementOriented}
                  onChange={(e) => setPlacementOriented(e.target.checked)}
                  disabled={isGenerating}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="font-semibold">Generate placement-oriented questions (TCS, Infosys, Wipro pattern)</span>
              </label>
            </div>
          </div>

          {/* Loading Animation when generating */}
          {isGenerating && (
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center gap-3">
              <RotateCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-blue-900">
                  Contacting {activeProviderInfo.provider === 'groq' ? 'Groq LPU Engine' : 'Google Gemini AI'} ({activeProviderInfo.model})...
                </p>
                <p className="text-blue-700 text-[11px] mt-0.5">
                  Crafting {numQuestions} placement-ready MCQs with rigorous solutions and deduplication checks. Please wait...
                </p>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Generating Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Questions ({numQuestions})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AiQuestionGenerationModal;

