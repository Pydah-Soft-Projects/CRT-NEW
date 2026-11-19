const aiService = require('../services/ai-question-generation.service');

/**
 * GET /api/admin/ai-question-generation/settings
 * Super Admin only: Fetch sanitized AI Question Generation Settings
 */
exports.getSettings = async (req, res) => {
  try {
    const safeSettings = await aiService.getClientSafeSettings();
    return res.json({
      success: true,
      data: safeSettings
    });
  } catch (error) {
    console.error('[AI Controller] getSettings error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch AI settings'
    });
  }
};

/**
 * PUT /api/admin/ai-question-generation/settings
 * Super Admin only: Update AI Question Generation Settings
 */
exports.updateSettings = async (req, res) => {
  try {
    const updated = await aiService.updateSettings(req.body, req.user?.id);
    return res.json({
      success: true,
      message: 'AI settings updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('[AI Controller] updateSettings error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to update AI settings'
    });
  }
};

/**
 * POST /api/admin/ai-question-generation/test-connection
 * Super Admin only: Test connection with Gemini API
 */
exports.testConnection = async (req, res) => {
  try {
    const result = await aiService.testConnection(req.body || {});
    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    console.error('[AI Controller] testConnection error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Connection test failed',
      status: 'error'
    });
  }
};

/**
 * POST /api/admin/ai-question-generation/generate
 * Super Admin only: Generate Questions via Google Gemini
 */
exports.generateQuestions = async (req, res) => {
  try {
    const { module_id, topic_name, difficulty, num_questions } = req.body;
    if (!module_id && !req.body.module_name) {
      return res.status(400).json({
        success: false,
        message: 'Module is required for question generation'
      });
    }

    const result = await aiService.generateQuestions(req.body, req.user || {});
    return res.json({
      success: true,
      message: `Generated ${result.questions.length} questions successfully`,
      data: result
    });
  } catch (error) {
    console.error('[AI Controller] generateQuestions error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate questions'
    });
  }
};

/**
 * POST /api/admin/ai-question-generation/regenerate-single
 * Super Admin only: Regenerate 1 specific replacement question
 */
exports.regenerateSingle = async (req, res) => {
  try {
    const question = await aiService.regenerateSingleQuestion(req.body, req.user || {});
    return res.json({
      success: true,
      message: 'Replacement question generated',
      data: question
    });
  } catch (error) {
    console.error('[AI Controller] regenerateSingle error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to regenerate question'
    });
  }
};

/**
 * POST /api/admin/ai-question-generation/save-approved
 * Super Admin only: Save approved questions to the Question bank
 */
exports.saveApproved = async (req, res) => {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one question to save'
      });
    }

    const result = await aiService.saveApprovedQuestions(questions, req.user || {});
    return res.status(201).json({
      success: true,
      message: `Successfully saved ${result.count} questions to Question Bank!`,
      data: result
    });
  } catch (error) {
    console.error('[AI Controller] saveApproved error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to save questions'
    });
  }
};

