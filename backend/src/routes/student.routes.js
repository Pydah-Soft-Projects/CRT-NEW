const express = require('express');
const router = express.Router();
const studentController = require('../controllers/student.controller');
const testController = require('../controllers/test.controller');
const sdmsController = require('../controllers/sdms.controller');
const authenticateToken = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const upload = require('../middleware/upload.middleware');
const requireSdmsAssignment = require('../middleware/sdmsScope.middleware');

router.use(authenticateToken);

// Student Exam/Module routes
router.get('/tests', studentController.getStudentTests);
router.get('/test/:id', studentController.getTestDetails);
router.get('/online-exams', studentController.getOnlineExams);
router.get('/active-exam', studentController.getActiveExam);
router.get('/completed-exams', studentController.getCompletedExams);
router.get('/test-history', studentController.getTestHistory);
router.get('/profile', studentController.getProfile);
router.get('/dashboard-summary', studentController.getDashboardSummary);
router.get('/progress-summary', studentController.getDashboardSummary);
router.get('/grammar-detailed-results', (req, res) => res.json({ success: true, data: [] }));
router.get('/vocabulary-detailed-results', (req, res) => res.json({ success: true, data: [] }));
router.put('/profile', studentController.updateProfile);
router.post('/tests/:id/start', studentController.startTest);
router.post('/tests/:id/submit', studentController.submitOnlineExam);
router.post('/tests/:id/submit-speaking', upload.examAudioAny, testController.submitSpeakingExam);
router.post('/submit-speaking-test', upload.examAudioAny, testController.submitSpeakingExam);
router.get('/auto-practice-questions', studentController.getAutoPracticeQuestions);
router.post('/submit-practice-test', studentController.submitPracticeTest);
router.get('/unlocked-modules', studentController.getUnlockedModules);
router.get('/grammar-progress', studentController.getGrammarProgress);
router.get('/test-result/:id', studentController.getTestResultById);

// SDMS Hierarchy & Student Fetching
const organizationManagers = authorizeRoles('superadmin', 'campus_admin', 'course_admin');

router.get('/sdms/colleges', organizationManagers, requireSdmsAssignment, sdmsController.getColleges);
router.get('/sdms/courses', organizationManagers, requireSdmsAssignment, sdmsController.getCourses);
router.get('/sdms/branches', organizationManagers, requireSdmsAssignment, sdmsController.getBranches);
router.get('/sdms/years', organizationManagers, requireSdmsAssignment, sdmsController.getYears);
router.get('/sdms/semesters', organizationManagers, requireSdmsAssignment, sdmsController.getSemesters);
router.get('/sdms/sections', organizationManagers, requireSdmsAssignment, sdmsController.getSections);
router.get('/sdms/students', organizationManagers, requireSdmsAssignment, sdmsController.getStudents);
router.get('/sdms/export', organizationManagers, requireSdmsAssignment, sdmsController.exportStudentsCsv);
router.get('/sdms/validation-rules', organizationManagers, sdmsController.getAcademicValidationRules);
router.post('/sdms/validate-student', organizationManagers, sdmsController.validateStudent);
router.post('/sdms/validate-students-bulk', organizationManagers, sdmsController.validateStudentsBulk);

module.exports = router;
