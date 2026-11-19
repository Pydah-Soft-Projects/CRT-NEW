const { encryptText, decryptText, maskApiKey } = require('../utils/encryption');

jest.mock('axios');
jest.mock('../models/AiSettings', () => {
  const mockSettingsDoc = {
    provider: 'groq',
    model: 'llama-3.3-70b-versatile',
    groq_model: 'llama-3.3-70b-versatile',
    gemini_model: 'gemini-1.5-flash',
    groq_api_key_encrypted: '',
    groq_api_key_iv: '',
    groq_api_key_tag: '',
    groq_api_key_masked: '',
    gemini_api_key_encrypted: '',
    gemini_api_key_iv: '',
    gemini_api_key_tag: '',
    gemini_api_key_masked: '',
    is_enabled: true,
    default_question_count: 10,
    max_question_count: 50,
    default_difficulty: 'Level 1',
    default_question_type: 'mcq',
    enable_question_review: true,
    connection_status: 'untested',
    groq_connection_status: 'untested',
    gemini_connection_status: 'untested',
    last_tested_at: null,
    last_error_message: '',
    rate_limit_per_minute: 25,
    usage_stats: { total_generated: 0, total_requests: 0 },
    save: jest.fn().mockResolvedValue(true)
  };

  const AiSettings = jest.fn(function () {
    return mockSettingsDoc;
  });
  AiSettings.findOne = jest.fn().mockReturnValue({
    sort: jest.fn().mockResolvedValue(mockSettingsDoc)
  });

  return AiSettings;
});

jest.mock('../models/Question', () => {
  const Question = jest.fn(function (data) {
    Object.assign(this, data);
    this._id = 'mock_q_id';
    this.save = jest.fn().mockResolvedValue(this);
  });
  Question.find = jest.fn().mockReturnValue({
    sort: jest.fn().mockReturnValue({
      limit: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([
            { text: 'Existing sample question in database?' }
          ])
        })
      })
    })
  });
  Question.insertMany = jest.fn().mockImplementation((docs) => {
    return Promise.resolve(docs.map((d, i) => ({ ...d, _id: `inserted_${i}` })));
  });
  return Question;
});

const axios = require('axios');
const aiService = require('./ai-question-generation.service');

describe('AI Question Generation Service - Groq & Gemini Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (axios.get) {
      axios.get.mockResolvedValue({ status: 200, data: { data: [{ id: 'openai/gpt-oss-120b' }] } });
    }
  });

  describe('1. Security & Encryption Utility Tests', () => {
    it('should encrypt and decrypt plaintext accurately', () => {
      const plainText = 'gsk_test1234567890abcdefGroqKey';
      const encResult = encryptText(plainText);

      expect(encResult).toHaveProperty('encrypted');
      expect(encResult).toHaveProperty('iv');
      expect(encResult).toHaveProperty('tag');
      expect(encResult.encrypted).not.toEqual(plainText);

      const decrypted = decryptText(encResult.encrypted, encResult.iv, encResult.tag);
      expect(decrypted).toEqual(plainText);
    });

    it('should return null when decrypting tampered ciphertext', () => {
      const plainText = 'gsk_Secret123';
      const encResult = encryptText(plainText);

      const tamperedCipher = encResult.encrypted.slice(0, -2) + '00';
      const decrypted = decryptText(tamperedCipher, encResult.iv, encResult.tag);
      expect(decrypted).toBeNull();
    });

    it('should correctly mask API keys without leaking full credentials', () => {
      const apiKey = 'gsk_BN1234567890abcdef9988';
      const masked = maskApiKey(apiKey);

      expect(masked).toContain('••••');
      expect(masked.endsWith('9988')).toBe(true);
      expect(masked).not.toContain('gsk_BN');
    });
  });

  describe('2. Groq Connection Testing & Error Handling', () => {
    it('should return error when no Groq API key is provided or configured', async () => {
      const result = await aiService.testConnection({ provider: 'groq', api_key: '' });
      expect(result.success).toBe(false);
      expect(result.provider).toBe('Groq');
      expect(result.message).toMatch(/No Groq API key provided/i);
    });

    it('should return success when Groq responds with 200 OK', async () => {
      axios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          choices: [
            { message: { content: 'OK' } }
          ]
        }
      });

      const result = await aiService.testConnection({
        provider: 'groq',
        api_key: 'gsk_mock_valid_key',
        model: 'llama-3.3-70b-versatile'
      });

      expect(result.success).toBe(true);
      expect(result.provider).toBe('Groq');
      expect(result.status).toBe('connected');
      expect(result.message).toContain('Successfully connected to Groq');
    });

    it('should handle invalid Groq API key (401) error properly', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 401,
          data: {
            error: { message: 'Invalid API Key' }
          }
        }
      });

      const result = await aiService.testConnection({
        provider: 'groq',
        api_key: 'gsk_invalid_key',
        model: 'llama-3.3-70b-versatile'
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('error');
      expect(result.message).toMatch(/Invalid Groq API key/i);
    });

    it('should handle Groq rate limit (429) gracefully', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 429,
          data: {
            error: { message: 'Rate limit reached' }
          }
        }
      });

      const result = await aiService.testConnection({
        provider: 'groq',
        api_key: 'gsk_rate_limited_key',
        model: 'llama-3.3-70b-versatile'
      });

      expect(result.success).toBe(false);
      expect(result.message).toMatch(/rate limit or quota exceeded/i);
    });
  });

  describe('3. Groq Question Generation, Schema & Deduplication', () => {
    it('should generate MCQs via Groq OpenAI-compatible format with deduplication', async () => {
      process.env.GROQ_API_KEY = 'gsk_test_generation_key_123';

      const mockGroqJson = JSON.stringify({
        module: 'Quantitative Aptitude',
        topic: 'Time & Work',
        difficulty: 'Level 1',
        questions: [
          {
            question: 'Pipe A can fill a tank in 4 hours and Pipe B can fill it in 6 hours. Together how long will they take?',
            options: ['2.4 hours', '3.5 hours', '5 hours', '10 hours'],
            correctAnswer: '2.4 hours',
            correctAnswerLetter: 'A',
            explanation: '1/4 + 1/6 = 5/12 per hour. Total time = 12/5 = 2.4 hours.'
          },
          {
            question: 'Existing sample question in database?',
            options: ['Opt 1', 'Opt 2', 'Opt 3', 'Opt 4'],
            correctAnswer: 'Opt 1',
            correctAnswerLetter: 'A',
            explanation: 'Duplicate test'
          }
        ]
      });

      axios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          choices: [
            {
              message: { content: mockGroqJson }
            }
          ]
        }
      });

      const genResult = await aiService.generateQuestions({
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        module_name: 'Quantitative Aptitude',
        module_id: 'aptitude',
        topic_name: 'Time & Work',
        difficulty: 'Level 1',
        num_questions: 2,
        avoid_duplicates: true
      }, { id: 'admin1', username: 'superadmin' });

      expect(genResult).toHaveProperty('questions');
      expect(genResult.provider).toBe('Groq');
      expect(genResult.questions.length).toBe(2);

      // Verify valid question structure
      const q1 = genResult.questions[0];
      expect(q1.text).toContain('Pipe A can fill a tank');
      expect(q1.options.length).toBe(4);
      expect(q1.correct_answer).toBe('2.4 hours');
      expect(q1.is_duplicate).toBe(false);

      // Verify duplicate question detection
      const q2 = genResult.questions[1];
      expect(q2.is_duplicate).toBe(true);
      expect(q2.duplicate_reason).toMatch(/already exists/i);
    });
  });

  describe('4. Gemini Compatibility Verification', () => {
    it('should still support Gemini provider when selected', async () => {
      process.env.GEMINI_API_KEY = 'AIzaSyTestGeminiKey';

      axios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          candidates: [{ content: { parts: [{ text: 'OK' }] } }]
        }
      });

      const geminiTest = await aiService.testConnection({
        provider: 'gemini',
        model: 'gemini-1.5-flash',
        api_key: 'AIzaSyTestGeminiKey'
      });

      expect(geminiTest.success).toBe(true);
      expect(geminiTest.provider).toBe('Google Gemini');
      expect(geminiTest.status).toBe('connected');
    });
  });
});
