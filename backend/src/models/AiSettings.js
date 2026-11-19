const mongoose = require('mongoose');

const aiSettingsSchema = new mongoose.Schema({
  provider: {
    type: String,
    enum: ['gemini', 'groq', 'openai'],
    default: 'groq'
  },
  // Current active key (for backward compatibility)
  api_key_encrypted: {
    type: String,
    default: ''
  },
  api_key_iv: {
    type: String,
    default: ''
  },
  api_key_tag: {
    type: String,
    default: ''
  },
  api_key_masked: {
    type: String,
    default: ''
  },
  model: {
    type: String,
    default: 'llama-3.1-8b-instant',
    trim: true
  },

  // Dedicated Groq Configuration
  groq_api_key_encrypted: {
    type: String,
    default: ''
  },
  groq_api_key_iv: {
    type: String,
    default: ''
  },
  groq_api_key_tag: {
    type: String,
    default: ''
  },
  groq_api_key_masked: {
    type: String,
    default: ''
  },
  groq_model: {
    type: String,
    default: 'llama-3.1-8b-instant',
    trim: true
  },
  groq_connection_status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'untested'],
    default: 'untested'
  },
  groq_last_tested_at: {
    type: Date,
    default: null
  },
  groq_last_error_message: {
    type: String,
    default: ''
  },
  available_groq_models: {
    type: [String],
    default: []
  },

  // Dedicated Gemini Configuration
  gemini_api_key_encrypted: {
    type: String,
    default: ''
  },
  gemini_api_key_iv: {
    type: String,
    default: ''
  },
  gemini_api_key_tag: {
    type: String,
    default: ''
  },
  gemini_api_key_masked: {
    type: String,
    default: ''
  },
  gemini_model: {
    type: String,
    default: 'gemini-1.5-flash',
    trim: true
  },
  gemini_connection_status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'untested'],
    default: 'untested'
  },
  gemini_last_tested_at: {
    type: Date,
    default: null
  },
  gemini_last_error_message: {
    type: String,
    default: ''
  },

  is_enabled: {
    type: Boolean,
    default: true
  },
  default_question_count: {
    type: Number,
    default: 10,
    min: 1,
    max: 50
  },
  max_question_count: {
    type: Number,
    default: 50,
    min: 1,
    max: 100
  },
  default_difficulty: {
    type: String,
    enum: ['Level 1', 'Level 2', 'Level 3'],
    default: 'Level 1'
  },
  default_question_type: {
    type: String,
    default: 'mcq'
  },
  enable_question_review: {
    type: Boolean,
    default: true
  },
  connection_status: {
    type: String,
    enum: ['connected', 'disconnected', 'error', 'untested'],
    default: 'untested'
  },
  last_tested_at: {
    type: Date,
    default: null
  },
  last_error_message: {
    type: String,
    default: ''
  },
  rate_limit_per_minute: {
    type: Number,
    default: 25
  },
  usage_stats: {
    total_generated: { type: Number, default: 0 },
    total_requests: { type: Number, default: 0 },
    last_used_at: { type: Date, default: null }
  },
  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, { collection: 'ai_settings' });

module.exports = mongoose.model('AiSettings', aiSettingsSchema);
