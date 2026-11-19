import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Sparkles,
  Key,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Save,
  Eye,
  EyeOff,
  Sliders,
  Layers,
  ExternalLink,
  BarChart2,
  Zap,
  Info
} from 'lucide-react';
import {
  getAiQuestionSettings,
  updateAiQuestionSettings,
  testAiConnection
} from '../../services/api';

const GROQ_MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'OpenAI GPT-OSS 120B (Active on your Groq Key)', desc: '120B parameter OpenAI model hosted on Groq LPUs' },
  { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ultra-Fast Free Tier)', desc: '128k context, ultra-fast 800 tokens/sec' },
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Meta 70B)', desc: '128k context, high reasoning speed for campus placement & coding questions' },
  { id: 'deepseek-r1-distill-llama-70b', name: 'DeepSeek R1 Distill Llama 70B (High Reasoning)', desc: 'Advanced reasoning and mathematical deduction on Groq' },
  { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B (MoE 32k)', desc: 'High throughput mixture-of-experts model' },
  { id: 'llama3-70b-8192', name: 'Llama 3 70B (Meta Production)', desc: 'Production-tested 70B parameter model' },
  { id: 'llama3-8b-8192', name: 'Llama 3 8B (Meta Lightweight)', desc: 'Fast, lightweight Llama 3 model' }
];

const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Recommended)', desc: 'Fast, highly accurate, and ideal for high-volume question generation' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Next-Gen High Speed)', desc: 'Ultra-low latency with superior reasoning and placement-level precision' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Deep Reasoning)', desc: 'Advanced complex reasoning for intricate coding and math problems' },
  { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash-8B (Lightweight)', desc: 'Compact model built for high throughput and lower latency' }
];

const AiSettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isCustomModel, setIsCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    provider: 'groq',
    api_key: '',
    model: 'llama-3.3-70b-versatile',
    groq_api_key: '',
    groq_model: 'llama-3.3-70b-versatile',
    gemini_api_key: '',
    gemini_model: 'gemini-1.5-flash',
    is_enabled: true,
    default_question_count: 10,
    max_question_count: 50,
    default_difficulty: 'Level 1',
    default_question_type: 'mcq',
    enable_question_review: true,
    rate_limit_per_minute: 25
  });

  // Server-saved status
  const [serverStatus, setServerStatus] = useState({
    provider: 'groq',
    has_api_key: false,
    api_key_masked: '',
    connection_status: 'untested',
    last_tested_at: null,
    last_error_message: '',
    usage_stats: { total_generated: 0, total_requests: 0 },
    groq: {
      has_api_key: false,
      api_key_masked: '',
      model: 'llama-3.3-70b-versatile',
      connection_status: 'untested',
      last_tested_at: null,
      last_error_message: ''
    },
    gemini: {
      has_api_key: false,
      api_key_masked: '',
      model: 'gemini-1.5-flash',
      connection_status: 'untested',
      last_tested_at: null,
      last_error_message: ''
    }
  });

  const [testResult, setTestResult] = useState(null);

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await getAiQuestionSettings();
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        const currentProvider = d.provider || 'groq';
        let activeModel = d.model || (currentProvider === 'groq' ? (d.groq?.model || 'openai/gpt-oss-120b') : (d.gemini?.model || 'gemini-1.5-flash'));
        if (currentProvider === 'groq' && (activeModel === 'gemma2-9b-it' || activeModel === 'openai/gpt-oss-20b')) {
          activeModel = 'openai/gpt-oss-120b';
        }

        setFormData({
          provider: currentProvider,
          api_key: '',
          model: activeModel,
          groq_api_key: '',
          groq_model: (d.groq?.model === 'gemma2-9b-it' || d.groq?.model === 'openai/gpt-oss-20b') ? 'openai/gpt-oss-120b' : (d.groq?.model || 'openai/gpt-oss-120b'),
          gemini_api_key: '',
          gemini_model: d.gemini?.model || 'gemini-1.5-flash',
          is_enabled: d.is_enabled ?? true,
          default_question_count: d.default_question_count || 10,
          max_question_count: d.max_question_count || 50,
          default_difficulty: d.default_difficulty || 'Level 1',
          default_question_type: d.default_question_type || 'mcq',
          enable_question_review: d.enable_question_review ?? true,
          rate_limit_per_minute: d.rate_limit_per_minute || 25
        });

        // Check if model is custom
        const predefined = currentProvider === 'groq' ? GROQ_MODELS : GEMINI_MODELS;
        if (!predefined.some(m => m.id === activeModel)) {
          setIsCustomModel(true);
          setCustomModelName(activeModel);
        } else {
          setIsCustomModel(false);
          setCustomModelName('');
        }

        setServerStatus({
          provider: currentProvider,
          has_api_key: d.has_api_key,
          api_key_masked: d.api_key_masked || '',
          connection_status: d.connection_status || 'untested',
          last_tested_at: d.last_tested_at,
          last_error_message: d.last_error_message || '',
          usage_stats: d.usage_stats || { total_generated: 0, total_requests: 0 },
          groq: d.groq || {
            has_api_key: false,
            api_key_masked: '',
            model: 'llama-3.3-70b-versatile',
            connection_status: 'untested'
          },
          gemini: d.gemini || {
            has_api_key: false,
            api_key_masked: '',
            model: 'gemini-1.5-flash',
            connection_status: 'untested'
          }
        });
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderChange = (newProvider) => {
    const nextModel = newProvider === 'groq'
      ? (formData.groq_model || 'llama-3.3-70b-versatile')
      : (formData.gemini_model || 'gemini-1.5-flash');

    setFormData(prev => ({
      ...prev,
      provider: newProvider,
      model: nextModel,
      api_key: ''
    }));

    setIsCustomModel(false);
    setCustomModelName('');
    setTestResult(null);
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      const activeModel = isCustomModel && customModelName.trim() ? customModelName.trim() : formData.model;

      const payload = {
        provider: formData.provider,
        model: activeModel,
        is_enabled: formData.is_enabled,
        default_question_count: formData.default_question_count,
        max_question_count: formData.max_question_count,
        default_difficulty: formData.default_difficulty,
        default_question_type: formData.default_question_type,
        enable_question_review: formData.enable_question_review,
        rate_limit_per_minute: formData.rate_limit_per_minute
      };

      if (formData.provider === 'groq') {
        payload.groq_model = activeModel;
        if (formData.api_key && formData.api_key.trim()) {
          payload.groq_api_key = formData.api_key.trim();
        }
      } else {
        payload.gemini_model = activeModel;
        if (formData.api_key && formData.api_key.trim()) {
          payload.gemini_api_key = formData.api_key.trim();
        }
      }

      const res = await updateAiQuestionSettings(payload);
      if (res.data?.success) {
        toast.success(`AI configuration for ${formData.provider === 'groq' ? 'Groq' : 'Google Gemini'} saved successfully!`);
        setFormData(prev => ({ ...prev, api_key: '' }));
        await fetchSettings();
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save AI settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestResult(null);

      const activeModel = isCustomModel && customModelName.trim() ? customModelName.trim() : formData.model;
      const payload = {
        provider: formData.provider,
        model: activeModel
      };

      if (formData.api_key && formData.api_key.trim()) {
        payload.api_key = formData.api_key.trim();
      }

      const res = await testAiConnection(payload);
      if (res.data?.success) {
        toast.success(res.data.message || `Connected to ${formData.provider === 'groq' ? 'Groq' : 'Google Gemini'} successfully!`);
        setTestResult({
          success: true,
          message: res.data.message,
          provider: res.data.provider,
          model: res.data.model,
          timestamp: new Date().toLocaleTimeString()
        });

        // If backend confirmed or switched to a specific active model, sync local form
        if (res.data?.model) {
          const verifiedModel = res.data.model;
          setFormData(prev => ({
            ...prev,
            model: verifiedModel,
            ...(formData.provider === 'groq' ? { groq_model: verifiedModel } : { gemini_model: verifiedModel })
          }));
        }

        // Update local status for the active provider
        const isGroq = formData.provider === 'groq';
        setServerStatus(prev => ({
          ...prev,
          connection_status: 'connected',
          last_tested_at: new Date(),
          last_error_message: '',
          ...(isGroq ? {
            groq: {
              ...prev.groq,
              connection_status: 'connected',
              last_tested_at: new Date(),
              last_error_message: ''
            }
          } : {
            gemini: {
              ...prev.gemini,
              connection_status: 'connected',
              last_tested_at: new Date(),
              last_error_message: ''
            }
          })
        }));
      } else {
        throw new Error(res.data?.message || 'Connection test failed');
      }
    } catch (err) {
      const errMsg = err?.response?.data?.message || err.message || 'Connection failed';
      toast.error(errMsg);
      setTestResult({
        success: false,
        message: errMsg,
        timestamp: new Date().toLocaleTimeString()
      });

      const isGroq = formData.provider === 'groq';
      setServerStatus(prev => ({
        ...prev,
        connection_status: 'error',
        last_tested_at: new Date(),
        last_error_message: errMsg,
        ...(isGroq ? {
          groq: {
            ...prev.groq,
            connection_status: 'error',
            last_tested_at: new Date(),
            last_error_message: errMsg
          }
        } : {
          gemini: {
            ...prev.gemini,
            connection_status: 'error',
            last_tested_at: new Date(),
            last_error_message: errMsg
          }
        })
      }));
    } finally {
      setTesting(false);
    }
  };

  const isGroq = formData.provider === 'groq';
  const providerModels = isGroq ? GROQ_MODELS : GEMINI_MODELS;
  const currentProviderStatus = isGroq ? serverStatus.groq : serverStatus.gemini;
  const hasActiveKey = Boolean(formData.api_key || currentProviderStatus.has_api_key);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <RotateCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading AI Settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                  AI Question Generation Settings
                </h1>
                <p className="text-xs text-slate-500 font-medium">
                  Configure Groq LPUs or Google Gemini API, quotas, and placement-level generation controls
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !hasActiveKey}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{testing ? 'Testing API...' : 'Test Connection'}</span>
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </div>

        {/* Free Tier Notice Alert for Groq */}
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-900 flex items-start gap-3 text-xs leading-relaxed">
          <Zap className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-extrabold text-blue-950">
              ⚡ Groq Free Tier Integration Available
            </p>
            <p className="text-blue-800 text-[11px] mt-0.5">
              If Google Gemini Free Tier is restricted (403), switch provider to <strong>Groq</strong>.
              Groq provides free API keys with high speed on open models (e.g. <code>llama-3.3-70b-versatile</code>).
            </p>
          </div>
        </div>

        {/* Status & Analytics Banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Connection Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
              currentProviderStatus.connection_status === 'connected'
                ? 'bg-emerald-100 text-emerald-600'
                : currentProviderStatus.connection_status === 'error'
                ? 'bg-rose-100 text-rose-600'
                : 'bg-amber-100 text-amber-600'
            }`}>
              {currentProviderStatus.connection_status === 'connected' ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : currentProviderStatus.connection_status === 'error' ? (
                <XCircle className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {isGroq ? 'Groq Status' : 'Gemini Status'}
              </p>
              <h4 className="text-sm font-extrabold capitalize text-slate-800">
                {currentProviderStatus.connection_status === 'connected'
                  ? 'Connected & Verified'
                  : currentProviderStatus.connection_status === 'error'
                  ? 'Connection Error'
                  : 'Untested'}
              </h4>
              <p className="text-[11px] text-slate-500 truncate max-w-[200px]" title={currentProviderStatus.last_error_message || (currentProviderStatus.last_tested_at ? `Tested: ${new Date(currentProviderStatus.last_tested_at).toLocaleTimeString()}` : 'Run connection test')}>
                {currentProviderStatus.last_error_message || (currentProviderStatus.last_tested_at ? `Last tested: ${new Date(currentProviderStatus.last_tested_at).toLocaleDateString()}` : 'Run connection test')}
              </p>
            </div>
          </div>

          {/* Active Model Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Provider &amp; Model</p>
              <h4 className="text-sm font-extrabold text-slate-800 font-mono truncate max-w-[210px]">
                {isGroq ? 'Groq' : 'Gemini'} • {isCustomModel ? customModelName : formData.model}
              </h4>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                {isGroq ? 'Groq Free Tier Compatible' : 'Google Gemini API'}
              </p>
            </div>
          </div>

          {/* Usage Analytics Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <BarChart2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">AI Generation Stats</p>
              <h4 className="text-sm font-extrabold text-slate-800">
                {serverStatus.usage_stats?.total_generated || 0} Questions
              </h4>
              <p className="text-[11px] text-slate-500">
                Across {serverStatus.usage_stats?.total_requests || 0} generation requests
              </p>
            </div>
          </div>
        </div>

        {/* Test Result Alert if present */}
        {testResult && (
          <div className={`p-4 rounded-xl border flex items-start gap-3 ${
            testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs">
              <p className="font-bold">{testResult.success ? 'API Connection Successful' : 'Connection Failed'}</p>
              <p className="mt-0.5">{testResult.message}</p>
              <span className="text-[10px] opacity-75 mt-1 block">Tested at {testResult.timestamp}</span>
            </div>
          </div>
        )}

        {/* Configuration Form Card */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Section 1: Provider & Credentials */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                1. AI Provider Selection &amp; Credentials
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Provider Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  AI Provider
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleProviderChange('groq')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      formData.provider === 'groq'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Groq (Recommended)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProviderChange('gemini')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      formData.provider === 'gemini'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Google Gemini</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {isGroq
                    ? 'Groq provides ultra-fast inference and free API access for Llama & Mixtral.'
                    : 'Google Gemini official API provider.'}
                </p>
              </div>

              {/* Model Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    {isGroq ? 'Groq Model' : 'Gemini Model'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsCustomModel(!isCustomModel)}
                    className="text-[11px] text-blue-600 hover:underline font-bold"
                  >
                    {isCustomModel ? 'Choose from list' : '+ Custom model name'}
                  </button>
                </div>

                {isCustomModel ? (
                  <input
                    type="text"
                    value={customModelName}
                    onChange={(e) => setCustomModelName(e.target.value)}
                    placeholder={isGroq ? 'e.g. openai/gpt-oss-20b or llama-3.3-70b-versatile' : 'e.g. gemini-1.5-flash'}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  />
                ) : (
                  <select
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  >
                    {providerModels.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
                <p className="text-[11px] text-slate-400 mt-1">
                  {isGroq ? 'Base URL: https://api.groq.com/openai/v1' : 'Google Gemini API v1beta'}
                </p>
              </div>

              {/* API Key Input */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    <span>{isGroq ? 'Groq API Key' : 'Google Gemini API Key'}</span>
                    {currentProviderStatus.has_api_key && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        Key Configured ({currentProviderStatus.api_key_masked})
                      </span>
                    )}
                  </label>

                  <a
                    href={isGroq ? 'https://console.groq.com/keys' : 'https://aistudio.google.com/app/apikey'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-bold inline-flex items-center gap-1 hover:underline"
                  >
                    <span>{isGroq ? 'Get Free Groq Key' : 'Get Free Gemini Key'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder={
                      currentProviderStatus.has_api_key
                        ? `Enter new ${isGroq ? 'Groq' : 'Gemini'} API key to replace existing`
                        : (isGroq ? 'Paste Groq API Key (starts with gsk_...)' : 'Paste Gemini API Key (starts with AIza...)')
                    }
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-500">
                  <p>
                    🔒 <strong>Security:</strong> Stored with AES-256-GCM encryption on backend. Never displayed after saving.
                  </p>
                  {currentProviderStatus.has_api_key && !formData.api_key && (
                    <span className="text-slate-400 italic">Leave blank to keep existing key.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 2: Generation Defaults */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                2. Generation Behavior &amp; Defaults
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default Question Count
                </label>
                <select
                  value={formData.default_question_count}
                  onChange={(e) => setFormData({ ...formData, default_question_count: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions (Recommended)</option>
                  <option value={20}>20 Questions</option>
                  <option value={30}>30 Questions</option>
                  <option value={50}>50 Questions</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Maximum Questions Per Run
                </label>
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={formData.max_question_count}
                  onChange={(e) => setFormData({ ...formData, max_question_count: parseInt(e.target.value, 10) || 50 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Default Difficulty
                </label>
                <select
                  value={formData.default_difficulty}
                  onChange={(e) => setFormData({ ...formData, default_difficulty: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                >
                  <option value="Level 1">Level 1 (Fundamental / Easy)</option>
                  <option value="Level 2">Level 2 (Standard Placement / Medium)</option>
                  <option value="Level 3">Level 3 (Advanced / Hard)</option>
                </select>
              </div>
            </div>
          </div>

          <hr className="border-slate-100" />

          {/* Section 3: Feature Toggles */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                3. System Feature Controls
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Enable AI Question Generation</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Allow Super Admins to generate questions with {isGroq ? 'Groq' : 'Gemini'}.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_enabled}
                    onChange={(e) => setFormData({ ...formData, is_enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Enable AI Question Review</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Preview, edit, deduplicate, and manually approve questions before saving.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enable_question_review}
                    onChange={(e) => setFormData({ ...formData, enable_question_review: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || !hasActiveKey}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs transition-all disabled:opacity-50"
            >
              {testing ? 'Testing...' : `Test ${isGroq ? 'Groq' : 'Gemini'} Connection`}
            </button>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AiSettingsPage;
