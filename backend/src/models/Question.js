const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  text: { type: String, required: true },
  module_id: { type: String, required: true },
  main_module_id: { type: mongoose.Schema.Types.ObjectId, ref: 'CrtModule' },
  topic_id: { type: String, default: '' },
  level_id: { type: Number, default: 1 },
  level_name: { type: String, default: 'Level 1' },
  subcategory: { type: String, default: 'general' },
  // College Scope fields
  college_id: { type: Number, default: null, index: true },
  college_name: { type: String, default: '' },
  college_ids: [{ type: Number }],
  campus_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', default: null },
  is_global: { type: Boolean, default: true, index: true },
  question_type: { 
    type: String, 
    default: 'mcq' 
  }, // mcq, text_to_audio, audio_to_text, audio_interactive, technical, sentence, paragraph
  conversion_type: { 
    type: String, 
    enum: ['none', 'text_to_audio', 'audio_to_text', 'both'], 
    default: 'none' 
  }, // none (MCQ/Written), text_to_audio (TTS voice prompt), audio_to_text (STT speech scoring), both (Dual voice AI)
  options: [{ type: String }],
  correct_answer: { type: mongoose.Schema.Types.Mixed },
  reference_text: { type: String, default: '' }, // Spoken sentence reference for Audio-to-Text grading
  audio_script: { type: String, default: '' },   // Script to synthesize for Text-to-Audio prompts
  explanation: { type: String, default: '' },
  audio_url: { type: String, default: '' },
  code_stub: { type: String, default: '' },
  expected_output: { type: String, default: '' },
  time_limit_seconds: { type: Number, default: 45 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'questions' });

questionSchema.index({ module_id: 1, topic_id: 1, level_id: 1, college_id: 1 });
questionSchema.index({ college_id: 1, is_global: 1 });

module.exports = mongoose.model('Question', questionSchema);
