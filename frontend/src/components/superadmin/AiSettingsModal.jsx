import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  X,
  Zap
} from 'lucide-react';
import {
  getAiQuestionSettings,
  updateAiQuestionSettings,
  testAiConnection
} from '../../services/api';

const GROQ_MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'OpenAI GPT-OSS 120B (Active on Groq)' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra-Fast Free Tier)' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Meta 70B)' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B (High Reasoning)' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (MoE 32k)' },
  { id: 'llama3-70b-8192', name: 'Llama 3 70B (Meta)' },
  { id: 'llama3-8b-8192', name: 'Llama 3 8B (Meta Fast)' }
];

const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Recommended)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen)' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B' }
];

const AiSettingsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const [formData, setFormData] = useState({
    provider: 'groq',
    api_key: '',
    model: 'llama-3.1-8b-instant',
    is_enabled: true,
    default_question_count: 10,
    max_question_count: 50,
    default_difficulty: 'Level 1',
    default_question_type: 'mcq',
    enable_question_review: true
  });

  const [serverStatus, setServerStatus] = useState({
    has_api_key: false,
    api_key_masked: '',
    connection_status: 'untested',
    last_tested_at: null,
    last_error_message: '',
    groq: { has_api_key: false, api_key_masked: '', model: 'llama-3.1-8b-instant', connection_status: 'untested' },
    gemini: { has_api_key: false, api_key_masked: '', model: 'gemini-1.5-flash', connection_status: 'untested' }
  });

  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getAiQuestionSettings();
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        const currentProvider = d.provider || 'groq';
        let activeModel = d.model || (currentProvider === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-1.5-flash');
        if (currentProvider === 'groq' && (activeModel === 'gemma2-9b-it' || activeModel === 'openai/gpt-oss-20b')) {
          activeModel = 'llama-3.3-70b-versatile';
        }
        setFormData({
          provider: currentProvider,
          api_key: '',
          model: activeModel,
          is_enabled: d.is_enabled ?? true,
          default_question_count: d.default_question_count || 10,
          max_question_count: d.max_question_count || 50,
          default_difficulty: d.default_difficulty || 'Level 1',
          default_question_type: d.default_question_type || 'mcq',
          enable_question_review: d.enable_question_review ?? true
        });

        setServerStatus({
          has_api_key: d.has_api_key,
          api_key_masked: d.api_key_masked || '',
          connection_status: d.connection_status || 'untested',
          last_tested_at: d.last_tested_at,
          last_error_message: d.last_error_message || '',
          groq: d.groq || { has_api_key: false, api_key_masked: '', model: 'llama-3.3-70b-versatile', connection_status: 'untested' },
          gemini: d.gemini || { has_api_key: false, api_key_masked: '', model: 'gemini-1.5-flash', connection_status: 'untested' }
        });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderSelect = (p) => {
    const nextModel = p === 'groq' ? 'llama-3.3-70b-versatile' : 'gemini-1.5-flash';
    setFormData(prev => ({
      ...prev,
      provider: p,
      model: nextModel,
      api_key: ''
    }));
    setTestResult(null);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        provider: formData.provider,
        model: formData.model,
        is_enabled: formData.is_enabled,
        default_question_count: formData.default_question_count,
        max_question_count: formData.max_question_count,
        default_difficulty: formData.default_difficulty,
        default_question_type: formData.default_question_type,
        enable_question_review: formData.enable_question_review
      };

      if (formData.provider === 'groq') {
        payload.groq_model = formData.model;
        if (formData.api_key && formData.api_key.trim()) payload.groq_api_key = formData.api_key.trim();
      } else {
        payload.gemini_model = formData.model;
        if (formData.api_key && formData.api_key.trim()) payload.gemini_api_key = formData.api_key.trim();
      }

      const res = await updateAiQuestionSettings(payload);
      if (res.data?.success) {
        toast.success(`Settings for ${formData.provider === 'groq' ? 'Groq' : 'Gemini'} saved!`);
        setFormData(prev => ({ ...prev, api_key: '' }));
        await fetchSettings();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const payload = {
        provider: formData.provider,
        model: formData.model
      };
      if (formData.api_key && formData.api_key.trim()) payload.api_key = formData.api_key.trim();

      const res = await testAiConnection(payload);
      if (res.data?.success) {
        toast.success(res.data.message || 'Connected successfully!');
        setTestResult({ success: true, message: res.data.message });
        if (res.data?.model && res.data.model !== formData.model) {
          setFormData(prev => ({ ...prev, model: res.data.model }));
        }
      } else {
        throw new Error(res.data?.message || 'Connection failed');
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message;
      toast.error(msg);
      setTestResult({ success: false, message: msg });
    } finally {
      setTesting(false);
    }
  };

  const isGroq = formData.provider === 'groq';
  const models = isGroq ? GROQ_MODELS : GEMINI_MODELS;
  const currentStatus = isGroq ? serverStatus.groq : serverStatus.gemini;
  const hasKey = Boolean(formData.api_key || currentStatus?.has_api_key);

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-6"
      >
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-tight">AI Question Generation Settings</h3>
              <p className="text-[11px] text-slate-400">Groq &amp; Google Gemini Provider Configuration</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RotateCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading AI configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {/* Provider Switcher */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Select AI Provider</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleProviderSelect('groq')}
                  className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                    formData.provider === 'groq'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Groq (Recommended Free Tier)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleProviderSelect('gemini')}
                  className={`py-2 px-3 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all ${
                    formData.provider === 'gemini'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Google Gemini</span>
                </button>
              </div>
            </div>

            {/* Connection Status Pill */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                {currentStatus?.connection_status === 'connected' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : currentStatus?.connection_status === 'error' ? (
                  <XCircle className="w-4 h-4 text-rose-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                )}
                <div>
                  <span className="font-bold text-slate-800 capitalize">
                    {isGroq ? 'Groq' : 'Gemini'} Status: {currentStatus?.connection_status === 'connected' ? 'Connected & Verified' : (currentStatus?.connection_status || 'untested')}
                  </span>
                  {currentStatus?.last_error_message && (
                    <p className="text-[10px] text-rose-600 truncate max-w-sm">{currentStatus.last_error_message}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing || !hasKey}
                className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold transition-all disabled:opacity-50"
              >
                {testing ? 'Testing...' : 'Test Connection'}
              </button>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl border text-[11px] ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                {testResult.message}
              </div>
            )}

            {/* Model Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {isGroq ? 'Groq Model' : 'Gemini Model'}
              </label>
              <select
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* API Key */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  <span>{isGroq ? 'Groq API Key' : 'Gemini API Key'}</span>
                  {currentStatus?.has_api_key && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
                      {currentStatus.api_key_masked}
                    </span>
                  )}
                </label>
                <a
                  href={isGroq ? 'https://console.groq.com/keys' : 'https://aistudio.google.com/app/apikey'}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-blue-600 hover:underline flex items-center gap-0.5 font-bold"
                >
                  <span>{isGroq ? 'Get Free Groq Key' : 'Get Free Gemini Key'}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder={
                    currentStatus?.has_api_key
                      ? `Enter new ${isGroq ? 'Groq' : 'Gemini'} key to replace existing`
                      : (isGroq ? 'Paste Groq API Key (starts with gsk_...)' : 'Paste Gemini API Key (starts with AIza...)')
                  }
                  className="w-full p-2 pr-8 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono focus:bg-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                🔒 Encrypted server-side with AES-256-GCM. Never exposed in API responses or frontend code.
              </p>
            </div>

            {/* Defaults */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Count</label>
                <select
                  value={formData.default_question_count}
                  onChange={(e) => setFormData({ ...formData, default_question_count: parseInt(e.target.value, 10) })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={20}>20 Questions</option>
                  <option value={30}>30 Questions</option>
                  <option value={50}>50 Questions</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Count</label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={formData.max_question_count}
                  onChange={(e) => setFormData({ ...formData, max_question_count: parseInt(e.target.value, 10) || 50 })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Default Difficulty</label>
                <select
                  value={formData.default_difficulty}
                  onChange={(e) => setFormData({ ...formData, default_difficulty: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:bg-white focus:outline-none"
                >
                  <option value="Level 1">Level 1</option>
                  <option value="Level 2">Level 2</option>
                  <option value="Level 3">Level 3</option>
                </select>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-700">Enable AI Question Generation</span>
                <input
                  type="checkbox"
                  checked={formData.is_enabled}
                  onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                <span className="font-bold text-slate-700">Enable AI Question Review before saving</span>
                <input
                  type="checkbox"
                  checked={formData.enable_question_review}
                  onChange={(e) => setFormData({ ...formData, enable_question_review: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                />
              </label>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-bold"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default AiSettingsModal;
