const mongoose = require('mongoose');

const examAttemptSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sdms_student_id: { type: Number },
  test_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  started_at: { type: Date, required: true, default: Date.now },
  expires_at: { type: Date, required: true },
  status: {
    type: String,
    enum: ['in_progress', 'submitting', 'submitted'],
    default: 'in_progress'
  },
  result_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Result' }
}, { collection: 'exam_attempts' });

examAttemptSchema.index(
  { user_id: 1, test_id: 1 },
  { unique: true, partialFilterExpression: { user_id: { $type: 'objectId' } } }
);
examAttemptSchema.index(
  { sdms_student_id: 1, test_id: 1 },
  { unique: true, partialFilterExpression: { sdms_student_id: { $type: 'number' } } }
);

module.exports = mongoose.model('ExamAttempt', examAttemptSchema);
