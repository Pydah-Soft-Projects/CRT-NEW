import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileCode,
  Layers,
  Building2,
  ArrowRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AiQuestionsPreviewModal = ({
  isOpen,
  onClose,
  data, // { module_name, topic_name, difficulty, summary, questions }
  onSaveApproved,
  isSaving,
  onRegenerateSingle
}) => {
  if (!isOpen || !data) return null;

  const [questions, setQuestions] = useState(data.questions || []);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [expandedExplanations, setExpandedExplanations] = useState({});

  // Sync state if data questions change
  React.useEffect(() => {
    if (data?.questions) {
      setQuestions(data.questions);
    }
  }, [data]);

  const selectedQuestions = questions.filter(q => q.is_selected);
  const validQuestions = questions.filter(q => !q.is_duplicate);

  const handleToggleSelect = (tempId) => {
    setQuestions(prev => prev.map(q => {
      if (q._temp_id === tempId) {
        return { ...q, is_selected: !q.is_selected };
      }
      return q;
    }));
  };

  const handleSelectAll = (select = true) => {
    setQuestions(prev => prev.map(q => ({
      ...q,
      is_selected: select
    })));
  };

  const handleSelectValidOnly = () => {
    setQuestions(prev => prev.map(q => ({
      ...q,
      is_selected: !q.is_duplicate
    })));
  };

  const handleDeleteQuestion = (tempId) => {
    setQuestions(prev => prev.filter(q => q._temp_id !== tempId));
    toast.success('Question removed from preview');
  };

  const handleToggleExplanation = (tempId) => {
    setExpandedExplanations(prev => ({
      ...prev,
      [tempId]: !prev[tempId]
    }));
  };

  const handleRegenerate = async (q) => {
    if (!onRegenerateSingle) return;
    try {
      setRegeneratingId(q._temp_id);
      const replacement = await onRegenerateSingle({
        module_name: data.module_name,
        topic_name: data.topic_name,
        difficulty: data.difficulty,
        module_id: q.module_id,
        main_module_id: q.main_module_id,
        topic_id: q.topic_id,
        college_scope: {
          is_global: q.is_global,
          college_id: q.college_id,
          college_ids: q.college_ids,
          college_name: q.college_name
        }
      });

      if (replacement) {
        setQuestions(prev => prev.map(oldQ => {
          if (oldQ._temp_id === q._temp_id) {
            return {
              ...replacement,
              _temp_id: `regen_${Date.now()}`,
              is_selected: true
            };
          }
          return oldQ;
        }));
        toast.success('Question regenerated successfully!');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to regenerate question');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleSaveEdit = (editedQ) => {
    setQuestions(prev => prev.map(q => q._temp_id === editedQ._temp_id ? editedQ : q));
    setEditingQuestion(null);
    toast.success('Question edits applied');
  };

  const handleFinalSave = () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question to approve');
      return;
    }
    onSaveApproved(selectedQuestions);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 px-6 py-4 text-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white font-mono text-[10px] font-bold uppercase tracking-wider">
                  Review &amp; Approval
                </span>
                <span className="text-white/70 text-xs">•</span>
                <span className="text-xs font-semibold text-white/90">
                  {data.module_name} &gt; {data.topic_name}
                </span>
              </div>
              <h2 className="text-lg font-black tracking-tight text-white mt-1">
                AI Generated Questions ({questions.length})
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Sub-header Toolbar & Summary Stats */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3">
          {/* Summary Chips */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">
              Total Generated: {questions.length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              Valid: {validQuestions.length}
            </span>
            {data.summary?.duplicates > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Duplicates Excluded: {data.summary.duplicates}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 font-bold text-[11px]">
              {data.difficulty}
            </span>
          </div>

          {/* Quick Selection Buttons */}
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleSelectAll(true)}
              className="text-slate-600 hover:text-blue-600 font-bold"
            >
              Select All
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleSelectValidOnly}
              className="text-slate-600 hover:text-blue-600 font-bold"
            >
              Valid Only
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => handleSelectAll(false)}
              className="text-slate-600 hover:text-blue-600 font-bold"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Questions List (Scrollable Area) */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-100/60">
          {questions.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-sm font-semibold text-slate-500">No questions remaining in this batch.</p>
            </div>
          ) : (
            questions.map((q, idx) => {
              const isExpanded = Boolean(expandedExplanations[q._temp_id]);
              const isRegenerating = regeneratingId === q._temp_id;

              return (
                <div
                  key={q._temp_id || idx}
                  className={`bg-white rounded-xl border p-4 shadow-2xs transition-all ${
                    q.is_selected
                      ? 'border-blue-500 ring-1 ring-blue-500/20'
                      : 'border-slate-200 opacity-80'
                  }`}
                >
                  {/* Top Bar of Card */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={q.is_selected}
                        onChange={() => handleToggleSelect(q._temp_id)}
                        className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-black text-slate-800">
                        Q{idx + 1}.
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        {q.level_name || data.difficulty}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                        {q.subcategory || data.topic_name}
                      </span>
                      {q.is_duplicate && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {q.duplicate_reason || 'Duplicate'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      {/* Regenerate Question */}
                      <button
                        type="button"
                        onClick={() => handleRegenerate(q)}
                        disabled={isRegenerating}
                        title="Regenerate this specific question"
                        className="p-1.5 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                      >
                        <RotateCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin text-blue-600' : ''}`} />
                      </button>

                      {/* Edit Question */}
                      <button
                        type="button"
                        onClick={() => setEditingQuestion(q)}
                        title="Edit question text, options, or answer"
                        className="p-1.5 rounded-lg hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Question */}
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q._temp_id)}
                        title="Discard this question"
                        className="p-1.5 rounded-lg hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Question Prompt */}
                  <div className="py-3">
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-wrap">
                      {q.text}
                    </p>
                  </div>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pb-3">
                    {q.options.map((opt, optIdx) => {
                      const optLetter = String.fromCharCode(65 + optIdx);
                      const isCorrect = String(opt).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase()
                        || String(q.correct_answer).trim().toUpperCase() === optLetter;

                      return (
                        <div
                          key={optIdx}
                          className={`flex items-start gap-2.5 p-2.5 rounded-lg text-xs font-medium border transition-colors ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {optLetter}
                          </span>
                          <span className="flex-1 break-words">{opt}</span>
                          {isCorrect && (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Toggle */}
                  {q.explanation && (
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => handleToggleExplanation(q._temp_id)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <span>{isExpanded ? 'Hide Explanation' : 'View Step-by-Step Explanation'}</span>
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExpanded && (
                        <div className="mt-2 p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg text-xs text-blue-900 leading-relaxed">
                          <p className="font-bold text-[11px] uppercase tracking-wider text-blue-700 mb-1">
                            Explanation:
                          </p>
                          <p className="whitespace-pre-wrap">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-slate-200 px-6 py-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-600 font-semibold">
            <span>{selectedQuestions.length} of {questions.length} question(s) selected for approval</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Discard All
            </button>

            <button
              type="button"
              onClick={handleFinalSave}
              disabled={isSaving || selectedQuestions.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Saving Questions to Bank...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve &amp; Save ({selectedQuestions.length})</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal: Edit Question Inline Drawer */}
        {editingQuestion && (
          <AiQuestionEditModal
            question={editingQuestion}
            onClose={() => setEditingQuestion(null)}
            onSave={handleSaveEdit}
          />
        )}
      </motion.div>
    </div>
  );
};

// Inline Question Editor Sub-modal
const AiQuestionEditModal = ({ question, onClose, onSave }) => {
  const [text, setText] = useState(question.text || '');
  const [options, setOptions] = useState([...question.options]);
  const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer || '');
  const [explanation, setExplanation] = useState(question.explanation || '');

  const handleOptionChange = (idx, val) => {
    const next = [...options];
    next[idx] = val;
    setOptions(next);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Question text is required');
      return;
    }
    if (options.some(o => !String(o).trim())) {
      toast.error('All 4 options must be non-empty');
      return;
    }

    onSave({
      ...question,
      text: text.trim(),
      options: options.map(o => String(o).trim()),
      correct_answer: correctAnswer,
      explanation: explanation.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-2xs">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider">Edit Generated Question</h4>
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Question Prompt</label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Options (4)</label>
            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center font-bold text-slate-600 shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleOptionChange(idx, e.target.value)}
                    className="flex-1 p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <input
                    type="radio"
                    name="correctAnswerSelect"
                    checked={correctAnswer === opt}
                    onChange={() => setCorrectAnswer(opt)}
                    className="cursor-pointer"
                    title="Set as correct answer"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Correct Answer</label>
            <select
              value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none font-semibold"
            >
              {options.map((opt, idx) => (
                <option key={idx} value={opt}>
                  Option {String.fromCharCode(65 + idx)}: {opt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Explanation</label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              placeholder="Step-by-step reasoning..."
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              Apply Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiQuestionsPreviewModal;

