const axios = require('axios');
const AiSettings = require('../models/AiSettings');
const Question = require('../models/Question');
const { encryptText, decryptText, maskApiKey } = require('../utils/encryption');

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1';

const DECOMMISSIONED_GROQ_MODELS = [
  'gemma2-9b-it',
  'gemma-7b-it',
  'openai/gpt-oss-20b',
  'llama2-70b-4096'
];

/**
 * Fetch list of available chat models from Groq for a given API key
 */
async function getGroqAvailableModels(apiKey) {
  if (!apiKey || typeof axios.get !== 'function') return [];
  try {
    const res = await axios.get(`${GROQ_BASE_URL}/models`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000
    });
    if (res?.data?.data && Array.isArray(res.data.data)) {
      return res.data.data
        .map(m => m.id)
        .filter(id => id && !id.includes('whisper') && !id.includes('tts') && !id.includes('embed') && !id.includes('guard'));
    }
  } catch (err) {
    // Non-critical
  }
  return [];
}

/**
 * Sanitize Groq model name, replacing decommissioned models
 */
function sanitizeGroqModel(model) {
  if (!model || typeof model !== 'string') return 'openai/gpt-oss-120b';
  const clean = model.trim();
  if (DECOMMISSIONED_GROQ_MODELS.includes(clean)) {
    return 'openai/gpt-oss-120b';
  }
  return clean;
}

// In-memory rate limiting map: { ip_or_user: [timestamps] }
const requestRateMap = new Map();

/**
 * Check if the caller has exceeded the requests-per-minute threshold
 */
function checkRateLimit(key, limitPerMinute = 25) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const timestamps = (requestRateMap.get(key) || []).filter(ts => now - ts < windowMs);

  if (timestamps.length >= limitPerMinute) {
    const earliest = timestamps[0];
    const waitSeconds = Math.ceil((windowMs - (now - earliest)) / 1000);
    return { limited: true, waitSeconds };
  }

  timestamps.push(now);
  requestRateMap.set(key, timestamps);
  return { limited: false, waitSeconds: 0 };
}

/**
 * Fetch or initialize the AI Settings document
 */
async function getOrCreateSettings() {
  let settings = await AiSettings.findOne().sort({ created_at: -1 });
  if (!settings) {
    settings = new AiSettings({
      provider: 'groq',
      model: 'llama-3.1-8b-instant',
      groq_model: 'llama-3.1-8b-instant',
      gemini_model: 'gemini-1.5-flash',
      is_enabled: true,
      default_question_count: 10,
      max_question_count: 50,
      default_difficulty: 'Level 1',
      default_question_type: 'mcq',
      enable_question_review: true,
      connection_status: 'untested',
      groq_connection_status: 'untested',
      gemini_connection_status: 'untested'
    });
    await settings.save();
  } else if (settings.groq_model && DECOMMISSIONED_GROQ_MODELS.includes(settings.groq_model)) {
    settings.groq_model = 'llama-3.1-8b-instant';
    if (settings.provider === 'groq') settings.model = 'llama-3.1-8b-instant';
    await settings.save();
  }
  return settings;
}

/**
 * Retrieve decrypted API key for a specified provider ('groq' or 'gemini')
 */
function resolveApiKey(settings, targetProvider = null) {
  const provider = targetProvider || settings.provider || 'groq';

  if (provider === 'groq') {
    // 1. Check dedicated groq fields
    if (settings.groq_api_key_encrypted && settings.groq_api_key_iv && settings.groq_api_key_tag) {
      const decrypted = decryptText(
        settings.groq_api_key_encrypted,
        settings.groq_api_key_iv,
        settings.groq_api_key_tag
      );
      if (decrypted && decrypted.trim()) return decrypted.trim();
    }
    // 2. Check root legacy field if provider was groq
    if (settings.provider === 'groq' && settings.api_key_encrypted && settings.api_key_iv && settings.api_key_tag) {
      const decrypted = decryptText(
        settings.api_key_encrypted,
        settings.api_key_iv,
        settings.api_key_tag
      );
      if (decrypted && decrypted.trim()) return decrypted.trim();
    }
    // 3. Fallback to process.env.GROQ_API_KEY
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
      return process.env.GROQ_API_KEY.trim();
    }
    return null;
  }

  // Gemini Provider
  if (settings.gemini_api_key_encrypted && settings.gemini_api_key_iv && settings.gemini_api_key_tag) {
    const decrypted = decryptText(
      settings.gemini_api_key_encrypted,
      settings.gemini_api_key_iv,
      settings.gemini_api_key_tag
    );
    if (decrypted && decrypted.trim()) return decrypted.trim();
  }
  if (settings.provider === 'gemini' && settings.api_key_encrypted && settings.api_key_iv && settings.api_key_tag) {
    const decrypted = decryptText(
      settings.api_key_encrypted,
      settings.api_key_iv,
      settings.api_key_tag
    );
    if (decrypted && decrypted.trim()) return decrypted.trim();
  }
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }

  return null;
}

/**
 * Get sanitized settings object safe to send to client
 */
async function getClientSafeSettings() {
  const settings = await getOrCreateSettings();
  const activeProvider = settings.provider || 'groq';

  const groqKey = resolveApiKey(settings, 'groq');
  const geminiKey = resolveApiKey(settings, 'gemini');
  const activeKey = activeProvider === 'groq' ? groqKey : geminiKey;

  const activeModel = activeProvider === 'groq'
    ? sanitizeGroqModel(settings.groq_model || settings.model || 'llama-3.3-70b-versatile')
    : (settings.gemini_model || settings.model || 'gemini-1.5-flash');

  const activeStatus = activeProvider === 'groq'
    ? (settings.groq_connection_status || 'untested')
    : (settings.gemini_connection_status || 'untested');

  const activeTestedAt = activeProvider === 'groq'
    ? settings.groq_last_tested_at
    : settings.gemini_last_tested_at;

  const activeLastError = activeProvider === 'groq'
    ? settings.groq_last_error_message
    : settings.gemini_last_error_message;

  return {
    provider: activeProvider,
    model: activeModel,
    is_enabled: settings.is_enabled,
    default_question_count: settings.default_question_count,
    max_question_count: settings.max_question_count,
    default_difficulty: settings.default_difficulty,
    default_question_type: settings.default_question_type,
    enable_question_review: settings.enable_question_review,
    connection_status: activeStatus,
    last_tested_at: activeTestedAt,
    last_error_message: activeLastError,
    rate_limit_per_minute: settings.rate_limit_per_minute,
    usage_stats: settings.usage_stats || { total_generated: 0, total_requests: 0 },
    has_api_key: Boolean(activeKey),
    api_key_masked: activeKey ? maskApiKey(activeKey) : '',

    // Groq specific details
    groq: {
      has_api_key: Boolean(groqKey),
      api_key_masked: settings.groq_api_key_masked || (groqKey ? maskApiKey(groqKey) : ''),
      model: settings.groq_model || 'openai/gpt-oss-120b',
      connection_status: settings.groq_connection_status || 'untested',
      last_tested_at: settings.groq_last_tested_at,
      last_error_message: settings.groq_last_error_message || '',
      available_models: settings.available_groq_models || []
    },

    // Gemini specific details
    gemini: {
      has_api_key: Boolean(geminiKey),
      api_key_masked: settings.gemini_api_key_masked || (geminiKey ? maskApiKey(geminiKey) : ''),
      model: settings.gemini_model || 'gemini-1.5-flash',
      connection_status: settings.gemini_connection_status || 'untested',
      last_tested_at: settings.gemini_last_tested_at,
      last_error_message: settings.gemini_last_error_message || ''
    }
  };
}

/**
 * Update AI Settings
 */
async function updateSettings(data, userId = null) {
  const settings = await getOrCreateSettings();

  const currentProvider = data.provider || settings.provider || 'groq';
  settings.provider = currentProvider;

  if (typeof data.is_enabled === 'boolean') settings.is_enabled = data.is_enabled;
  if (typeof data.enable_question_review === 'boolean') settings.enable_question_review = data.enable_question_review;
  if (data.default_question_count) {
    settings.default_question_count = Math.min(Math.max(parseInt(data.default_question_count, 10) || 10, 1), 50);
  }
  if (data.max_question_count) {
    settings.max_question_count = Math.min(Math.max(parseInt(data.max_question_count, 10) || 50, 5), 100);
  }
  if (data.default_difficulty) settings.default_difficulty = data.default_difficulty;
  if (data.default_question_type) settings.default_question_type = data.default_question_type;

  // Handle Groq configuration
  if (data.groq_model && typeof data.groq_model === 'string') {
    settings.groq_model = sanitizeGroqModel(data.groq_model);
  }
  if (currentProvider === 'groq' && data.model && typeof data.model === 'string') {
    const safeM = sanitizeGroqModel(data.model);
    settings.groq_model = safeM;
    settings.model = safeM;
  }
  if (data.groq_api_key && typeof data.groq_api_key === 'string' && !data.groq_api_key.includes('••••')) {
    const rawKey = data.groq_api_key.trim();
    if (rawKey.length > 0) {
      const encryptedObj = encryptText(rawKey);
      if (encryptedObj) {
        settings.groq_api_key_encrypted = encryptedObj.encrypted;
        settings.groq_api_key_iv = encryptedObj.iv;
        settings.groq_api_key_tag = encryptedObj.tag;
        settings.groq_api_key_masked = maskApiKey(rawKey);
        settings.groq_connection_status = 'untested';
        settings.groq_last_error_message = '';
      }
    }
  }

  // Handle Gemini configuration
  if (data.gemini_model && typeof data.gemini_model === 'string') {
    settings.gemini_model = data.gemini_model.trim();
  }
  if (currentProvider === 'gemini' && data.model && typeof data.model === 'string') {
    settings.gemini_model = data.model.trim();
    settings.model = data.model.trim();
  }
  if (data.gemini_api_key && typeof data.gemini_api_key === 'string' && !data.gemini_api_key.includes('••••')) {
    const rawKey = data.gemini_api_key.trim();
    if (rawKey.length > 0) {
      const encryptedObj = encryptText(rawKey);
      if (encryptedObj) {
        settings.gemini_api_key_encrypted = encryptedObj.encrypted;
        settings.gemini_api_key_iv = encryptedObj.iv;
        settings.gemini_api_key_tag = encryptedObj.tag;
        settings.gemini_api_key_masked = maskApiKey(rawKey);
        settings.gemini_connection_status = 'untested';
        settings.gemini_last_error_message = '';
      }
    }
  }

  // If a generic api_key is submitted, save to active provider
  if (data.api_key && typeof data.api_key === 'string' && !data.api_key.includes('••••')) {
    const rawKey = data.api_key.trim();
    if (rawKey.length > 0) {
      const encryptedObj = encryptText(rawKey);
      if (encryptedObj) {
        settings.api_key_encrypted = encryptedObj.encrypted;
        settings.api_key_iv = encryptedObj.iv;
        settings.api_key_tag = encryptedObj.tag;
        settings.api_key_masked = maskApiKey(rawKey);
        settings.connection_status = 'untested';
        settings.last_error_message = '';

        if (currentProvider === 'groq') {
          settings.groq_api_key_encrypted = encryptedObj.encrypted;
          settings.groq_api_key_iv = encryptedObj.iv;
          settings.groq_api_key_tag = encryptedObj.tag;
          settings.groq_api_key_masked = maskApiKey(rawKey);
          settings.groq_connection_status = 'untested';
        } else {
          settings.gemini_api_key_encrypted = encryptedObj.encrypted;
          settings.gemini_api_key_iv = encryptedObj.iv;
          settings.gemini_api_key_tag = encryptedObj.tag;
          settings.gemini_api_key_masked = maskApiKey(rawKey);
          settings.gemini_connection_status = 'untested';
        }
      }
    }
  }

  // Sync active model and status to root fields
  settings.model = currentProvider === 'groq'
    ? (settings.groq_model || 'llama-3.3-70b-versatile')
    : (settings.gemini_model || 'gemini-1.5-flash');

  settings.connection_status = currentProvider === 'groq'
    ? (settings.groq_connection_status || 'untested')
    : (settings.gemini_connection_status || 'untested');

  if (userId) settings.updated_by = userId;
  settings.updated_at = new Date();

  await settings.save();
  return await getClientSafeSettings();
}

/**
 * Test Connection with Groq or Google Gemini API
 */
async function testConnection(customParams = {}) {
  const settings = await getOrCreateSettings();
  const provider = customParams.provider || settings.provider || 'groq';

  if (provider === 'groq') {
    return await testGroqConnection(customParams, settings);
  } else {
    return await testGeminiConnection(customParams, settings);
  }
}

/**
 * Test Connection specifically with Groq
 */
async function testGroqConnection(customParams, settings) {
  let apiKey = customParams.api_key && !customParams.api_key.includes('••••')
    ? customParams.api_key.trim()
    : resolveApiKey(settings, 'groq');

  const rawModel = (customParams.model || settings.groq_model || settings.model || 'llama-3.1-8b-instant').trim();
  let model = sanitizeGroqModel(rawModel);

  if (!apiKey) {
    const errorMsg = 'No Groq API key provided or configured. Please enter a valid Groq API key.';
    settings.groq_connection_status = 'error';
    settings.groq_last_tested_at = new Date();
    settings.groq_last_error_message = errorMsg;
    if (settings.provider === 'groq') {
      settings.connection_status = 'error';
      settings.last_error_message = errorMsg;
    }
    await settings.save();
    return {
      success: false,
      message: errorMsg,
      provider: 'Groq',
      status: 'error'
    };
  }

  // Helper to execute a test chat completion with a specific model
  const postTestCompletion = async (modelName) => {
    return await axios.post(`${GROQ_BASE_URL}/chat/completions`, {
      model: modelName,
      messages: [{ role: 'user', content: 'Respond with OK.' }],
      max_tokens: 10
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 20000
    });
  };

  try {
    // 1. Discover available models from Groq for this API key
    let availableModels = [];
    try {
      if (typeof axios.get === 'function') {
        const modelsRes = await axios.get(`${GROQ_BASE_URL}/models`, {
          headers: { 'Authorization': `Bearer ${apiKey}` },
          timeout: 10000
        });
        if (modelsRes?.data?.data && Array.isArray(modelsRes.data.data)) {
          availableModels = modelsRes.data.data
            .map(m => m.id)
            .filter(id => id && !id.includes('whisper') && !id.includes('tts') && !id.includes('embed') && !id.includes('guard'));
        }
      }
    } catch (mErr) {
      if (mErr.response?.status === 401) {
        throw mErr;
      }
      // If fetching models list fails or is blocked, continue with requested model
    }

    // If models list was retrieved and the requested model is not in the list, auto-select an available one
    if (availableModels.length > 0 && !availableModels.includes(model)) {
      const candidate = availableModels.find(m => m === 'openai/gpt-oss-120b')
        || availableModels.find(m => m === 'llama-3.1-8b-instant')
        || availableModels.find(m => m === 'llama-3.3-70b-versatile')
        || availableModels.find(m => m.startsWith('llama-3.1'))
        || availableModels.find(m => m.startsWith('llama3'))
        || availableModels[0];
      if (candidate) {
        model = candidate;
        switchedModel = true;
      }
    }

    // 2. Perform chat completion test
    let response;
    let switchedModelFallback = false;
    try {
      response = await postTestCompletion(model);
    } catch (testErr) {
      const status = testErr.response?.status;
      const apiMsg = testErr.response?.data?.error?.message || '';

      // If model not found (404) or does not exist, auto-fallback to available model
      if ((status === 404 || apiMsg.toLowerCase().includes('model_not_found') || apiMsg.toLowerCase().includes('does not exist')) && availableModels.length > 0) {
        const fallback = availableModels.find(m => m !== model) || 'openai/gpt-oss-120b';
        response = await postTestCompletion(fallback);
        model = fallback;
        switchedModelFallback = true;
      } else {
        throw testErr;
      }
    }

    if (response && response.status === 200) {
      settings.groq_connection_status = 'connected';
      settings.groq_last_tested_at = new Date();
      settings.groq_last_error_message = '';
      settings.groq_model = model;
      settings.available_groq_models = availableModels;
      if (settings.provider === 'groq') {
        settings.connection_status = 'connected';
        settings.last_tested_at = settings.groq_last_tested_at;
        settings.last_error_message = '';
        settings.model = model;
      }
      await settings.save();

      const successMsg = (switchedModel || switchedModelFallback)
        ? `Successfully connected to Groq! Selected model switched to "${model}" (verified active on your account).`
        : `Successfully connected to Groq API (${model})!`;

      return {
        success: true,
        message: successMsg,
        provider: 'Groq',
        model,
        available_models: availableModels,
        status: 'connected',
        tested_at: settings.groq_last_tested_at
      };
    } else {
      throw new Error(`Unexpected Groq status code: ${response?.status}`);
    }
  } catch (error) {
    let friendlyMessage = 'Failed to connect to Groq API.';

    if (error.response) {
      const status = error.response.status;
      const apiErr = error.response.data?.error?.message || '';

      if (status === 401 || apiErr.toLowerCase().includes('invalid api key')) {
        friendlyMessage = 'Invalid Groq API key. Please check your API key from console.groq.com and try again.';
      } else if (status === 404 || apiErr.toLowerCase().includes('model_not_found') || apiErr.toLowerCase().includes('decommissioned')) {
        friendlyMessage = apiErr
          ? `Groq model error: ${apiErr}`
          : `The model "${model}" is not available on your Groq tier. Please select "llama-3.1-8b-instant".`;
      } else if (status === 429 || apiErr.toLowerCase().includes('rate_limit_exceeded')) {
        friendlyMessage = 'Groq API rate limit or quota exceeded. Please wait a few moments and try again.';
      } else if (apiErr) {
        friendlyMessage = `Groq API Error (${status}): ${apiErr}`;
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      friendlyMessage = 'Connection to Groq API timed out after 20 seconds. Please check your network connection.';
    } else {
      friendlyMessage = error.message;
    }

    settings.groq_connection_status = 'error';
    settings.groq_last_tested_at = new Date();
    settings.groq_last_error_message = friendlyMessage;
    if (settings.provider === 'groq') {
      settings.connection_status = 'error';
      settings.last_tested_at = settings.groq_last_tested_at;
      settings.last_error_message = friendlyMessage;
    }
    await settings.save();

    return {
      success: false,
      message: friendlyMessage,
      provider: 'Groq',
      model,
      status: 'error',
      tested_at: settings.groq_last_tested_at
    };
  }
}

/**
 * Test Connection specifically with Gemini
 */
async function testGeminiConnection(customParams, settings) {
  let apiKey = customParams.api_key && !customParams.api_key.includes('••••')
    ? customParams.api_key.trim()
    : resolveApiKey(settings, 'gemini');

  const model = (customParams.model || settings.gemini_model || settings.model || 'gemini-1.5-flash').trim();

  if (!apiKey) {
    const errorMsg = 'No Gemini API key provided or configured. Please enter a valid API key.';
    settings.gemini_connection_status = 'error';
    settings.gemini_last_tested_at = new Date();
    settings.gemini_last_error_message = errorMsg;
    if (settings.provider === 'gemini') {
      settings.connection_status = 'error';
      settings.last_error_message = errorMsg;
    }
    await settings.save();
    return {
      success: false,
      message: errorMsg,
      provider: 'Google Gemini',
      status: 'error'
    };
  }

  try {
    const testUrl = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ role: 'user', parts: [{ text: 'Respond with exactly "OK".' }] }],
      generationConfig: { maxOutputTokens: 10, temperature: 0.1 }
    };

    const response = await axios.post(testUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000
    });

    if (response.status === 200) {
      settings.gemini_connection_status = 'connected';
      settings.gemini_last_tested_at = new Date();
      settings.gemini_last_error_message = '';
      if (settings.provider === 'gemini') {
        settings.connection_status = 'connected';
        settings.last_tested_at = settings.gemini_last_tested_at;
        settings.last_error_message = '';
      }
      await settings.save();

      return {
        success: true,
        message: `Successfully connected to Google Gemini (${model})!`,
        provider: 'Google Gemini',
        model,
        status: 'connected',
        tested_at: settings.gemini_last_tested_at
      };
    } else {
      throw new Error(`Unexpected status code: ${response.status}`);
    }
  } catch (error) {
    let friendlyMessage = 'Failed to connect to Google Gemini API.';

    if (error.response) {
      const status = error.response.status;
      const apiErr = error.response.data?.error?.message || '';

      if (status === 400 || apiErr.toLowerCase().includes('api key not valid')) {
        friendlyMessage = 'Invalid API key. Please check your Google Gemini API key.';
      } else if (status === 403) {
        friendlyMessage = 'Gemini API Free Tier is not available for this project. Consider switching to Groq API.';
      } else if (status === 404 || apiErr.toLowerCase().includes('not found')) {
        friendlyMessage = `The model "${model}" was not found or is not supported.`;
      } else if (status === 429 || apiErr.toLowerCase().includes('quota') || apiErr.toLowerCase().includes('resource has been exhausted')) {
        friendlyMessage = 'Google Gemini free tier quota exceeded. Consider switching to Groq API.';
      } else if (apiErr) {
        friendlyMessage = `Gemini API Error (${status}): ${apiErr}`;
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      friendlyMessage = 'Connection to Google Gemini timed out after 20s.';
    } else {
      friendlyMessage = error.message;
    }

    settings.gemini_connection_status = 'error';
    settings.gemini_last_tested_at = new Date();
    settings.gemini_last_error_message = friendlyMessage;
    if (settings.provider === 'gemini') {
      settings.connection_status = 'error';
      settings.last_tested_at = settings.gemini_last_tested_at;
      settings.last_error_message = friendlyMessage;
    }
    await settings.save();

    return {
      success: false,
      message: friendlyMessage,
      provider: 'Google Gemini',
      status: 'error',
      tested_at: settings.gemini_last_tested_at
    };
  }
}

/**
 * Normalize text for duplicate detection
 */
function normalizeQuestionText(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generate Questions via Groq OpenAI-compatible Chat Completions
 */
async function callGroqGenerate({ apiKey, model, prompt }) {
  let safeModel = sanitizeGroqModel(model);
  const url = `${GROQ_BASE_URL}/chat/completions`;
  const payload = {
    model: safeModel,
    messages: [
      {
        role: 'system',
        content: 'You are a Senior Campus Recruitment Examination Setter specializing in Indian campus placement exams. You MUST respond with 100% valid JSON matching the requested schema, without markdown formatting or conversational text.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 4096
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 65000
    });

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response received from Groq API.');
    }
    return content;
  } catch (apiError) {
    if (apiError.response) {
      const status = apiError.response.status;
      const apiMsg = apiError.response.data?.error?.message || '';

      // If model not found (404), discover available models and auto-retry with verified working model
      if (status === 404 || apiMsg.toLowerCase().includes('does not exist') || apiMsg.toLowerCase().includes('model_not_found')) {
        try {
          const available = await getGroqAvailableModels(apiKey);
          const fallback = available.find(m => m !== safeModel) || 'openai/gpt-oss-120b';
          if (fallback && fallback !== safeModel) {
            console.log(`[Groq] Model "${safeModel}" unavailable. Auto-retrying with active model "${fallback}"...`);
            const fallbackPayload = { ...payload, model: fallback };
            const fallbackRes = await axios.post(url, fallbackPayload, {
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              },
              timeout: 65000
            });
            const fbContent = fallbackRes.data?.choices?.[0]?.message?.content;
            if (fbContent) {
              // Persist working model to settings
              try {
                const s = await getOrCreateSettings();
                s.groq_model = fallback;
                if (s.provider === 'groq') s.model = fallback;
                await s.save();
              } catch (persistErr) {}
              return fbContent;
            }
          }
        } catch (fbErr) {
          // Fall through to error reporting
        }
      }

      if (status === 401) {
        throw new Error('Invalid Groq API key. Please check your Groq API key in AI Settings.');
      }
      if (status === 404) {
        throw new Error(apiMsg ? `Groq model error: ${apiMsg}` : `Groq model "${model}" not found or unavailable. Please switch to "llama-3.1-8b-instant" in AI Settings.`);
      }
      if (status === 429) {
        throw new Error('Groq free tier rate limit reached. Please wait a few moments before trying again.');
      }
      throw new Error(`Groq API error (${status}): ${apiMsg || apiError.message}`);
    } else if (apiError.code === 'ECONNABORTED' || apiError.message.includes('timeout')) {
      throw new Error('Groq generation timed out after 65s. Try generating a smaller batch (5 or 10 questions).');
    }
    throw apiError;
  }
}

/**
 * Generate Questions via Gemini
 */
async function callGeminiGenerate({ apiKey, model, prompt }) {
  const generateUrl = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${apiKey}`;

  const requestPayload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json'
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
    ]
  };

  try {
    const response = await axios.post(generateUrl, requestPayload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 65000
    });

    const candidates = response.data?.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No candidate content received from Google Gemini.');
    }

    const firstPart = candidates[0]?.content?.parts?.[0];
    const rawResponseText = firstPart?.text || '';
    if (!rawResponseText) {
      throw new Error('Empty response received from Google Gemini API.');
    }
    return rawResponseText;
  } catch (apiError) {
    if (apiError.response) {
      const status = apiError.response.status;
      const apiMsg = apiError.response.data?.error?.message || '';

      if (status === 403) {
        throw new Error('Google Gemini API Free Tier is not available for this project. Please switch to Groq AI in Settings.');
      }
      if (status === 429 || apiMsg.toLowerCase().includes('quota') || apiMsg.toLowerCase().includes('resource has been exhausted')) {
        throw new Error('Google Gemini API free tier rate limit or quota exceeded. Please switch to Groq AI in Settings.');
      }
      if (status === 400 && apiMsg.toLowerCase().includes('api key not valid')) {
        throw new Error('Invalid Google Gemini API key. Please update your API key in AI Settings.');
      }
      throw new Error(`Google Gemini API error (${status}): ${apiMsg || apiError.message}`);
    } else if (apiError.code === 'ECONNABORTED' || apiError.message.includes('timeout')) {
      throw new Error('AI Question Generation timed out after 65s.');
    }
    throw apiError;
  }
}

/**
 * Safely parse JSON containing questions, with automatic truncation recovery and regex fallback
 */
function safeParseJsonQuestions(rawResponseText) {
  if (!rawResponseText || typeof rawResponseText !== 'string') return [];

  let cleaned = rawResponseText.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  }

  // 1. Direct JSON parse
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.questions)) return parsed.questions;
  } catch (err) {
    // Truncated or malformed, proceed to recovery
  }

  // 2. Recovery from truncated array: find last complete object ending `}`
  const lastCloseBrace = cleaned.lastIndexOf('}');
  if (lastCloseBrace !== -1) {
    const candidate = cleaned.substring(0, lastCloseBrace + 1);
    const qIndex = candidate.indexOf('"questions"');
    if (qIndex !== -1) {
      const arrStart = candidate.indexOf('[', qIndex);
      if (arrStart !== -1) {
        try {
          const repaired = '{"questions": ' + candidate.substring(arrStart) + ']}';
          const parsed = JSON.parse(repaired);
          if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
            return parsed.questions;
          }
        } catch (e) {}
      }
    }

    try {
      const repaired = candidate + ']}';
      const parsed = JSON.parse(repaired);
      if (Array.isArray(parsed?.questions) && parsed.questions.length > 0) {
        return parsed.questions;
      }
    } catch (e) {}
  }

  // 3. Fallback: regex matcher for individual valid question objects
  const extracted = [];
  const regex = /\{\s*"question"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"options"\s*:\s*\[([^\]]*)\](?:\s*,\s*"correctAnswer"\s*:\s*"((?:\\.|[^"\\])*)")?(?:\s*,\s*"correctAnswerLetter"\s*:\s*"([A-D])")?(?:\s*,\s*"explanation"\s*:\s*"((?:\\.|[^"\\])*)")?\s*\}/gi;
  let m;
  while ((m = regex.exec(cleaned)) !== null) {
    try {
      const obj = JSON.parse(m[0]);
      if (obj.question && Array.isArray(obj.options)) {
        extracted.push(obj);
      }
    } catch (e) {}
  }

  return extracted;
}

/**
 * Generate Questions using configured provider (Groq or Gemini)
 */
async function generateQuestions(options = {}, userContext = {}) {
  const settings = await getOrCreateSettings();

  if (!settings.is_enabled) {
    throw new Error('AI Question Generation is currently disabled by Super Admin. Enable it in AI Settings.');
  }

  const activeProvider = options.provider || settings.provider || 'groq';
  const apiKey = resolveApiKey(settings, activeProvider);

  if (!apiKey) {
    const provName = activeProvider === 'groq' ? 'Groq' : 'Google Gemini';
    throw new Error(`${provName} API Key is not configured. Please add an API key in AI Settings.`);
  }

  // Rate Limiting
  const rateLimitKey = userContext.id || userContext.username || 'admin';
  const limitCheck = checkRateLimit(rateLimitKey, settings.rate_limit_per_minute || 25);
  if (limitCheck.limited) {
    throw new Error(`AI rate limit exceeded. Please wait ${limitCheck.waitSeconds} second(s) before generating more questions.`);
  }

  const {
    module_name = 'Quantitative Aptitude',
    module_id = 'aptitude',
    main_module_id = null,
    topic_name = 'Time & Work',
    topic_id = '',
    custom_topic = '',
    difficulty = 'Level 1',
    num_questions = 10,
    question_type = 'mcq',
    language = 'English',
    college_scope = {},
    include_explanations = true,
    avoid_duplicates = true,
    placement_oriented = true
  } = options;

  const count = Math.min(Math.max(parseInt(num_questions, 10) || 10, 1), settings.max_question_count || 50);
  const activeTopic = custom_topic ? custom_topic.trim() : topic_name;

  const model = activeProvider === 'groq'
    ? (options.model || settings.groq_model || settings.model || 'openai/gpt-oss-120b')
    : (options.model || settings.gemini_model || settings.model || 'gemini-1.5-flash');

  // 1. Fetch existing questions to avoid duplication
  let existingQuestionTexts = [];
  if (avoid_duplicates) {
    try {
      const existingDocs = await Question.find({
        $or: [
          { module_id: module_id },
          { subcategory: activeTopic },
          { topic_id: topic_id }
        ]
      })
        .sort({ created_at: -1 })
        .limit(40)
        .select('text')
        .lean();

      existingQuestionTexts = existingDocs.map(q => q.text).filter(Boolean);
    } catch (err) {
      console.warn('[AI Question Generator] Warning fetching existing questions:', err.message);
    }
  }

  // 2. Batching to prevent single-response token cut-offs (chunk requests into batches of max 10)
  const batchSizeLimit = 10;
  const batchSizes = [];
  let remaining = count;
  while (remaining > 0) {
    const b = Math.min(remaining, batchSizeLimit);
    batchSizes.push(b);
    remaining -= b;
  }

  const rawQuestions = [];
  const allKnownTexts = [...existingQuestionTexts];

  for (let bIdx = 0; bIdx < batchSizes.length; bIdx++) {
    const currentBatchTarget = batchSizes[bIdx];
    const prompt = buildStructuredPrompt({
      moduleName: module_name,
      topicName: activeTopic,
      difficulty,
      numQuestions: currentBatchTarget,
      questionType: question_type,
      language,
      includeExplanations: include_explanations,
      placementOriented: placement_oriented,
      existingQuestionTexts: allKnownTexts
    });

    let rawResponseText = '';
    if (activeProvider === 'groq') {
      rawResponseText = await callGroqGenerate({ apiKey, model, prompt });
    } else {
      rawResponseText = await callGeminiGenerate({ apiKey, model, prompt });
    }

    const batchQuestions = safeParseJsonQuestions(rawResponseText);
    for (const q of batchQuestions) {
      rawQuestions.push(q);
      const text = (q.question || q.text || '').trim();
      if (text) allKnownTexts.push(text);
    }
  }

  // 3. Top-up attempt if the model produced fewer questions than requested (e.g. asked for 10, got 2)
  let topUpAttempts = 0;
  while (rawQuestions.length < count && topUpAttempts < 2) {
    topUpAttempts++;
    const needed = Math.min(count - rawQuestions.length, 10);
    try {
      const topUpPrompt = buildStructuredPrompt({
        moduleName: module_name,
        topicName: activeTopic,
        difficulty,
        numQuestions: needed,
        questionType: question_type,
        language,
        includeExplanations: include_explanations,
        placementOriented: placement_oriented,
        existingQuestionTexts: allKnownTexts
      });

      const topUpText = activeProvider === 'groq'
        ? await callGroqGenerate({ apiKey, model, prompt: topUpPrompt })
        : await callGeminiGenerate({ apiKey, model, prompt: topUpPrompt });

      const topUpQuestions = safeParseJsonQuestions(topUpText);
      if (topUpQuestions.length === 0) break;
      for (const q of topUpQuestions) {
        rawQuestions.push(q);
        const t = (q.question || q.text || '').trim();
        if (t) allKnownTexts.push(t);
      }
    } catch (topUpErr) {
      console.warn('[AI Question Generator] Top-up attempt error:', topUpErr.message);
      break;
    }
  }

  if (rawQuestions.length === 0) {
    throw new Error('AI did not return any questions in the expected format. Please try again.');
  }

  // 4. Validate, Normalize & Deduplicate Questions
  const existingNormalizedSet = new Set(existingQuestionTexts.map(normalizeQuestionText));
  const batchSeenSet = new Set();
  const validQuestions = [];
  let duplicateCount = 0;

  const levelNum = difficulty === 'Level 3' || difficulty === 3 ? 3 : (difficulty === 'Level 2' || difficulty === 2 ? 2 : 1);

  for (let i = 0; i < rawQuestions.length; i++) {
    const rawQ = rawQuestions[i];
    const qText = (rawQ.question || rawQ.text || '').trim();

    if (!qText || qText.length < 10) continue;

    // Check options
    let rawOptions = Array.isArray(rawQ.options) ? rawQ.options : [];
    if (rawOptions.length < 4 && rawQ.optionA && rawQ.optionB && rawQ.optionC && rawQ.optionD) {
      rawOptions = [rawQ.optionA, rawQ.optionB, rawQ.optionC, rawQ.optionD];
    }
    const cleanOptions = rawOptions.map(o => String(o).trim()).filter(Boolean);
    if (cleanOptions.length < 4) continue;

    // Identify correct answer
    let answerText = '';
    const rawAns = String(rawQ.correctAnswer || rawQ.correct_answer || rawQ.answer || '').trim();

    if (/^[ABCD]$/i.test(rawAns)) {
      const idx = rawAns.toUpperCase().charCodeAt(0) - 65;
      answerText = cleanOptions[idx] || cleanOptions[0];
    } else if (/^[0-3]$/.test(rawAns)) {
      answerText = cleanOptions[parseInt(rawAns, 10)] || cleanOptions[0];
    } else {
      const matched = cleanOptions.find(o => o.toLowerCase() === rawAns.toLowerCase());
      answerText = matched || rawAns || cleanOptions[0];
    }

    const explanationText = (rawQ.explanation || '').trim();

    // Duplicate Check
    const normalized = normalizeQuestionText(qText);
    const isDbDuplicate = existingNormalizedSet.has(normalized);
    const isBatchDuplicate = batchSeenSet.has(normalized);
    const isDuplicate = isDbDuplicate || isBatchDuplicate;

    if (isDuplicate) {
      duplicateCount++;
    } else {
      batchSeenSet.add(normalized);
    }

    // Resolve College Scope
    const isGlobal = college_scope.is_global !== undefined ? Boolean(college_scope.is_global) : true;
    const collegeId = !isGlobal && college_scope.college_id ? Number(college_scope.college_id) : null;
    const collegeIds = !isGlobal && Array.isArray(college_scope.college_ids) ? college_scope.college_ids.map(Number) : (collegeId ? [collegeId] : []);
    const collegeName = isGlobal ? 'All Colleges' : (college_scope.college_name || '');

    validQuestions.push({
      _temp_id: `gen_${Date.now()}_${i}`,
      text: qText,
      options: cleanOptions.slice(0, 4),
      correct_answer: answerText,
      explanation: explanationText,
      module_id: module_id,
      main_module_id: main_module_id,
      topic_id: topic_id || activeTopic,
      subcategory: activeTopic,
      level_id: levelNum,
      level_name: `Level ${levelNum}`,
      question_type: 'mcq',
      conversion_type: 'none',
      time_limit_seconds: 45,
      college_id: collegeId,
      college_ids: collegeIds,
      college_name: collegeName,
      is_global: isGlobal,
      is_duplicate: isDuplicate,
      duplicate_reason: isDbDuplicate ? 'Similar question already exists in Question Bank' : (isBatchDuplicate ? 'Duplicate within generated set' : ''),
      is_selected: !isDuplicate
    });
  }

  // 6. Update Usage Statistics in DB
  try {
    settings.usage_stats = settings.usage_stats || { total_generated: 0, total_requests: 0 };
    settings.usage_stats.total_generated = (settings.usage_stats.total_generated || 0) + validQuestions.length;
    settings.usage_stats.total_requests = (settings.usage_stats.total_requests || 0) + 1;
    settings.usage_stats.last_used_at = new Date();
    await settings.save();
  } catch (err) {
    console.warn('[AI Question Generator] Failed to update usage stats:', err.message);
  }

  return {
    provider: activeProvider === 'groq' ? 'Groq' : 'Google Gemini',
    model,
    module_name,
    topic_name: activeTopic,
    difficulty,
    summary: {
      requested: count,
      generated: validQuestions.length,
      valid: validQuestions.filter(q => !q.is_duplicate).length,
      duplicates: duplicateCount
    },
    questions: validQuestions
  };
}

/**
 * Regenerate a single question with replacement
 */
async function regenerateSingleQuestion(options = {}, userContext = {}) {
  const result = await generateQuestions({
    ...options,
    num_questions: 1
  }, userContext);

  if (result.questions && result.questions.length > 0) {
    return result.questions[0];
  }
  throw new Error('Failed to generate replacement question.');
}

/**
 * Save Approved Questions to Database
 */
async function saveApprovedQuestions(questions = [], userContext = {}) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No questions provided for saving.');
  }

  const docsToInsert = questions.map(q => {
    const cleanOpts = Array.isArray(q.options)
      ? q.options.map(o => String(o).trim()).filter(Boolean)
      : [];

    return {
      text: String(q.text || q.question).trim(),
      module_id: q.module_id || 'crt',
      main_module_id: q.main_module_id || null,
      topic_id: q.topic_id || '',
      subcategory: q.subcategory || q.topic_name || 'general',
      level_id: q.level_id ? parseInt(q.level_id, 10) : 1,
      level_name: q.level_name || `Level ${q.level_id || 1}`,
      college_id: q.college_id !== undefined ? q.college_id : null,
      college_ids: Array.isArray(q.college_ids) ? q.college_ids : [],
      college_name: q.college_name || (q.is_global ? 'All Colleges' : ''),
      campus_id: q.campus_id || null,
      is_global: q.is_global !== undefined ? Boolean(q.is_global) : true,
      question_type: q.question_type || 'mcq',
      conversion_type: q.conversion_type || 'none',
      options: cleanOpts,
      correct_answer: String(q.correct_answer || q.answer || cleanOpts[0] || '').trim(),
      reference_text: q.reference_text || '',
      audio_script: q.audio_script || '',
      audio_url: q.audio_url || '',
      time_limit_seconds: q.time_limit_seconds ? parseInt(q.time_limit_seconds, 10) : 45,
      code_stub: q.code_stub || '',
      expected_output: q.expected_output || '',
      explanation: q.explanation ? String(q.explanation).trim() : '',
      created_at: new Date(),
      updated_at: new Date()
    };
  });

  const insertedDocs = await Question.insertMany(docsToInsert);
  return {
    success: true,
    count: insertedDocs.length,
    questions: insertedDocs
  };
}

/**
 * Helper to build prompt
 */
function buildStructuredPrompt({
  moduleName,
  topicName,
  difficulty,
  numQuestions,
  questionType,
  language,
  includeExplanations,
  placementOriented,
  existingQuestionTexts = []
}) {
  let moduleSpecificAdvice = '';

  const lowerModule = moduleName.toLowerCase();
  if (lowerModule.includes('aptitude') || lowerModule.includes('quant')) {
    moduleSpecificAdvice = `
- Focus on Quantitative Aptitude topics: Time & Work, Profit & Loss, Percentages, Time Speed Distance, Permutations & Combinations, Probability, Simple/Compound Interest, Averages, Ratios.
- Ensure all calculations and numerical values are 100% mathematically accurate.
- Double-check equations and solutions before outputting.
- Each question must have exactly 4 plausible numerical or algebraic options.`;
  } else if (lowerModule.includes('reasoning') || lowerModule.includes('logical')) {
    moduleSpecificAdvice = `
- Focus on Logical Reasoning: Syllogisms, Blood Relations, Seating Arrangements, Coding-Decoding, Direction Sense, Series Completion, Analogy, Critical Reasoning.
- Ensure logical statements are consistent and deductive conclusions are indisputable.
- Avoid vague or subjective logic.`;
  } else if (lowerModule.includes('technical') || lowerModule.includes('cs') || lowerModule.includes('code')) {
    moduleSpecificAdvice = `
- Focus on Technical & Computer Science subjects: Core Java, Python, C, C++, Data Structures, Algorithms, SQL queries, DBMS, Operating Systems, Computer Networks.
- Format code snippets cleanly inside the question text.
- Test output, syntax, complexity, pointers, OOP principles, or indexing as typical in tech recruitment tests (TCS NQT, Infosys, Accenture, Wipro, Capgemini).`;
  } else if (lowerModule.includes('verbal') || lowerModule.includes('english')) {
    moduleSpecificAdvice = `
- Focus on Verbal Ability: Sentence Correction, Error Spotting, Synonyms/Antonyms, Prepositions, Para Jumbles, Reading Comprehension, Subject-Verb Agreement.
- High-standard professional English. Only one grammatically valid or contextually accurate option.`;
  } else if (lowerModule.includes('versant') || lowerModule.includes('voice')) {
    moduleSpecificAdvice = `
- Focus on English communication, listening comprehension, phrase rearrangement, or contextual speaking.`;
  }

  let avoidListPrompt = '';
  if (existingQuestionTexts.length > 0) {
    const sampleExisting = existingQuestionTexts.slice(0, 15).map((t, idx) => `${idx + 1}. "${t.substring(0, 80)}..."`).join('\n');
    avoidListPrompt = `
DO NOT repeat or generate questions similar to these existing ones:
${sampleExisting}
`;
  }

  return `You are a Senior Campus Recruitment Examination Setter specializing in Indian campus placement exams (CRT - Campus Recruitment Training for TCS, Infosys, Wipro, Cognizant, Accenture, Capgemini, tech hiring drives).

TASK:
You MUST generate an array of EXACTLY ${numQuestions} distinct, high-quality, professional multiple-choice questions (MCQs) for:
- Module: ${moduleName}
- Topic: ${topicName}
- Difficulty Level: ${difficulty} (Level 1 = Easy/Fundamental, Level 2 = Moderate/Standard Placement, Level 3 = Advanced/Challenging)
- Language: ${language}
${placementOriented ? '- Style: Direct campus placement pattern (thorough, industry-relevant, competitive)' : ''}
${includeExplanations ? '- Requirement: Provide a clear, step-by-step educational explanation for each question.' : ''}

QUANTITY MANDATE (VERY IMPORTANT):
- The "questions" array MUST contain EXACTLY ${numQuestions} unique question objects.
- Do NOT generate fewer than ${numQuestions} questions. Do NOT stop after 1, 2, or 3 questions.
- You must output all ${numQuestions} questions in the array.

SPECIFIC RULES:
${moduleSpecificAdvice}
${avoidListPrompt}
- Exactly 4 options for each question (e.g. Option A, B, C, D).
- Exactly ONE option must be strictly correct. The other three must be plausible distractors.
- Specify "correctAnswer" as the EXACT matching string of the correct option text.
- Specify "correctAnswerLetter" as "A", "B", "C", or "D".
- No duplicate questions within the output.
- Output MUST be 100% valid JSON only, without additional markdown commentary.

JSON SCHEMA:
{
  "module": "${moduleName}",
  "topic": "${topicName}",
  "difficulty": "${difficulty}",
  "questions": [
    // Output all ${numQuestions} questions in this array
    {
      "question": "Full clear text of the question with any necessary data or code snippet",
      "options": [
        "First option",
        "Second option",
        "Third option",
        "Fourth option"
      ],
      "correctAnswer": "First option",
      "correctAnswerLetter": "A",
      "explanation": "Step-by-step reasoning explaining why this answer is correct."
    }
  ]
}

Ensure the output is 100% valid JSON only, without additional markdown commentary.`;
}

module.exports = {
  getOrCreateSettings,
  getClientSafeSettings,
  updateSettings,
  testConnection,
  generateQuestions,
  regenerateSingleQuestion,
  saveApprovedQuestions
};
