const express = require('express');
const router = express.Router();
const controller = require('../controllers/aiQuestionGeneration.controller');
const authenticateToken = require('../middleware/auth.middleware');
const authorizeRoles = require('../middleware/role.middleware');

// Protect all routes: Super Admin authentication & authorization
router.use(authenticateToken);
router.use(authorizeRoles('superadmin'));

// AI Question Generation Settings
router.get('/settings', controller.getSettings);
router.put('/settings', controller.updateSettings);

// Test Connection
router.post('/test-connection', controller.testConnection);

// Generation & Approval
router.post('/generate', controller.generateQuestions);
router.post('/regenerate-single', controller.regenerateSingle);
router.post('/save-approved', controller.saveApproved);

module.exports = router;

