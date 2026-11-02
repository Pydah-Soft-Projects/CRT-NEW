const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: false },
  email: { type: String, required: false },
  name: { type: String, required: false },
  emp_no: { type: String, index: true, sparse: true },
  role: { 
    type: String, 
    default: 'custom'
  },
  role_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', default: null },
  permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
  auth_source: { type: String, enum: ['local', 'hrms'], default: 'local' },
  department_name: { type: String, default: '' },
  designation_name: { type: String, default: '' },
  phone_number: { type: String, default: '' },
  campus_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Campus', default: null },
  sdms_college_id: { type: Number, default: null },
  sdms_course_id: { type: Number, default: null },
  sdms_branch_id: { type: Number, default: null },
  sdms_year: { type: Number, default: null },
  sdms_college_ids: [{ type: Number }],
  sdms_course_ids: [{ type: Number }],
  sdms_branch_ids: [{ type: Number }],
  sdms_years: [{ type: Number }],
  course_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
  batch_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
  status: { type: String, default: 'active' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { collection: 'users' });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
