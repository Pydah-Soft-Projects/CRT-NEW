const express = require('express');
const router = express.Router();
const crtController = require('../controllers/crt.controller');
const authenticateToken = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Dynamic CRT Main Modules
router.get('/modules', crtController.getModules);
router.post('/modules', crtController.createModule);
router.put('/modules/:id', crtController.updateModule);
router.delete('/modules/:id', crtController.deleteModule);

// Dynamic Topics under a Main Module with Level configuration
router.post('/modules/:moduleId/topics', crtController.createTopic);
router.put('/modules/:moduleId/topics/:topicId', crtController.updateTopic);
router.delete('/modules/:moduleId/topics/:topicId', crtController.deleteTopic);

// College Scopes for Questions
router.get('/colleges', crtController.getColleges);

// Dynamic Questions Management
router.get('/questions', crtController.getQuestions);
router.post('/questions', crtController.createQuestion);
router.post('/questions/bulk', crtController.bulkUploadQuestions);
router.put('/questions/:id', crtController.updateQuestion);
router.delete('/questions/:id', crtController.deleteQuestion);

// System stats & AI voice preview
router.get('/stats', crtController.getStats);
router.post('/tts-preview', crtController.generateTTSPreview);

module.exports = router;
