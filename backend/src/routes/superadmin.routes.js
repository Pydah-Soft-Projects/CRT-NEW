const express = require('express');
const router = express.Router();
const superadminController = require('../controllers/superadmin.controller');
const campusAdminController = require('../controllers/campusAdmin.controller');
const progressTrackingController = require('../controllers/progressTracking.controller');
const authenticateToken = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');
const requireSdmsAssignment = require('../middleware/sdmsScope.middleware');

router.use(authenticateToken);

const resultsViewers = authorizeRoles('superadmin', 'campus_admin', 'course_admin', 'evaluator', 'faculty');
const dashboardViewers = authorizeRoles('superadmin', 'campus_admin', 'course_admin', 'evaluator', 'faculty');

router.get('/dashboard', dashboardViewers, requireSdmsAssignment, superadminController.getDashboard);
router.get('/stats', dashboardViewers, requireSdmsAssignment, superadminController.getSystemStats);
router.get('/online-tests-overview', resultsViewers, requireSdmsAssignment, campusAdminController.getOnlineTestOverview);
router.get('/test-attempts/:testId', resultsViewers, requireSdmsAssignment, campusAdminController.getOnlineTestAttempts);
router.get('/student-attempts/:studentId/:testId', resultsViewers, requireSdmsAssignment, campusAdminController.getStudentOnlineTestAttempts);

// Progress tracking routes
router.get('/practice-tests-by-module', resultsViewers, requireSdmsAssignment, progressTrackingController.getPracticeTestsByModule);
router.get('/test-assigned-students/:testId', resultsViewers, requireSdmsAssignment, progressTrackingController.getTestAssignedStudents);
router.get('/student-test-progress/:studentId/:testId', resultsViewers, requireSdmsAssignment, progressTrackingController.getStudentTestProgress);
router.get('/practice-attempt-details/:attemptId', resultsViewers, requireSdmsAssignment, progressTrackingController.getPracticeAttemptDetails);

// Campus management routes (mapped at /superadmin and /campus-management)
router.get('/', resultsViewers, superadminController.getCampuses);
router.get('/campuses', resultsViewers, superadminController.getCampuses);
router.post('/', authorizeRoles('superadmin'), superadminController.createCampus);
router.post('/campuses', authorizeRoles('superadmin'), superadminController.createCampus);
router.put('/campuses/:id', authorizeRoles('superadmin'), superadminController.updateCampus);
router.put('/:id', authorizeRoles('superadmin'), superadminController.updateCampus);
router.delete('/campuses/:id', authorizeRoles('superadmin'), superadminController.deleteCampus);
router.delete('/:id', authorizeRoles('superadmin'), superadminController.deleteCampus);

// Course management routes
router.get('/courses/:campusId?', resultsViewers, superadminController.getCourses);
router.post('/courses/:campusId?', authorizeRoles('superadmin'), superadminController.createCourse);

module.exports = router;
