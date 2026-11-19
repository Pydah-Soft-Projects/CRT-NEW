jest.mock('../services/ai-question-generation.service');

const aiService = require('../services/ai-question-generation.service');
const controller = require('./aiQuestionGeneration.controller');

const makeResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis()
});

describe('AI Question Generation Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return sanitized settings to client', async () => {
      aiService.getClientSafeSettings.mockResolvedValue({
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        has_api_key: true,
        api_key_masked: '••••••••••••1234',
        is_enabled: true
      });

      const req = {};
      const res = makeResponse();

      await controller.getSettings(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          provider: 'gemini',
          has_api_key: true,
          api_key_masked: '••••••••••••1234'
        })
      }));
    });
  });

  describe('updateSettings', () => {
    it('should call updateSettings and return updated data', async () => {
      aiService.updateSettings.mockResolvedValue({
        provider: 'gemini',
        model: 'gemini-2.0-flash',
        is_enabled: true
      });

      const req = {
        body: { model: 'gemini-2.0-flash' },
        user: { id: 'admin-123' }
      };
      const res = makeResponse();

      await controller.updateSettings(req, res);

      expect(aiService.updateSettings).toHaveBeenCalledWith({ model: 'gemini-2.0-flash' }, 'admin-123');
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'AI settings updated successfully'
      }));
    });
  });

  describe('generateQuestions', () => {
    it('should reject requests missing module identification', async () => {
      const req = { body: {} };
      const res = makeResponse();

      await controller.generateQuestions(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: expect.stringMatching(/Module is required/i)
      }));
    });

    it('should return generated questions when parameters are valid', async () => {
      aiService.generateQuestions.mockResolvedValue({
        module_name: 'Quantitative Aptitude',
        topic_name: 'Percentages',
        questions: [{ text: 'What is 20% of 80?', options: ['16', '20', '24', '18'], correct_answer: '16' }]
      });

      const req = {
        body: { module_id: 'aptitude', module_name: 'Quantitative Aptitude', topic_name: 'Percentages' },
        user: { id: 'admin1' }
      };
      const res = makeResponse();

      await controller.generateQuestions(req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringMatching(/Generated 1 questions successfully/i)
      }));
    });
  });

  describe('saveApproved', () => {
    it('should reject empty question list', async () => {
      const req = { body: { questions: [] } };
      const res = makeResponse();

      await controller.saveApproved(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should call saveApprovedQuestions and return 201', async () => {
      aiService.saveApprovedQuestions.mockResolvedValue({
        success: true,
        count: 2,
        questions: [{ _id: '1' }, { _id: '2' }]
      });

      const req = {
        body: { questions: [{ text: 'Q1' }, { text: 'Q2' }] },
        user: { id: 'admin1' }
      };
      const res = makeResponse();

      await controller.saveApproved(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: expect.stringMatching(/Successfully saved 2 questions/i)
      }));
    });
  });
});

