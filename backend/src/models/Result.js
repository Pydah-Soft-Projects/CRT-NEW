const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', default: null },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  sdms_student_id: { type: Number, default: null, index: true },
  test_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: false },
  test_name: { type: String, default: '' },
  test_type: { type: String, default: '' },
  module_id: { type: String, required: true },
  subcategory: { type: String, default: '' },
  level_id: { type: Number, default: 1 },
  test_number: { type: Number, default: 1 },
  score: { type: Number, default: 0 },
  correct_answers: { type: Number, default: 0 },
  total_questions: { type: Number, default: 0 },
  percentage: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  time_taken_ms: { type: Number, default: 0 },
  answers: [{ type: mongoose.Schema.Types.Mixed }],
  speaking_audio_url: { type: String, default: '' },
  transcription: { type: String, default: '' },
  ai_evaluation: {
    accuracy_score: { type: Number, default: 0 },
    fluency_score: { type: Number, default: 0 },
    overall_score: { type: Number, default: 0 },
    pronunciation_breakdown: { type: Object, default: {} }
  },
  cheating_instances: { type: Number, default: 0 },
  submitted_at: { type: Date, default: Date.now }
}, { collection: 'test_results' });

module.exports = mongoose.model('Result', resultSchema);
