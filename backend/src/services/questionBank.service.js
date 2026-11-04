const Question = require('../models/Question');

/**
 * Fisher-Yates array shuffle helper
 */
function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

class QuestionBankService {
  /**
   * Retrieves practice/exam questions strictly from the MongoDB database.
   * All questions are dynamically queried from the Question collection.
   * Supports excluding already-used questions to prevent repetition across practice tests.
   *
   * @param {string} moduleType - e.g. 'CRT' or 'VERSANT'
   * @param {string} topic - e.g. 'aptitude', 'reasoning', 'technical', 'grammar', 'reading'
   * @param {number} count - number of questions requested (default 25)
   * @param {number|null} level - 1, 2, or 3
   * @param {Array<string>} excludeIds - question IDs already seen in previous tests
   * @param {number} testNumber - practice test index (1, 2, 3...)
   */
  async getAutoPracticeQuestions(moduleType = 'crt', topic = 'aptitude', count = 25, level = null, excludeIds = [], testNumber = 1) {
    const normalizedModule = String(moduleType || 'crt').toLowerCase().trim();
    const normalizedTopic = String(topic || 'aptitude').toLowerCase().trim();

    let resolvedModule = normalizedModule.includes('crt') ? 'crt' : 'versant';
    let resolvedTopic = normalizedTopic;

    if (resolvedTopic.startsWith('crt_')) {
      resolvedTopic = resolvedTopic.replace('crt_', '');
      resolvedModule = 'crt';
    } else if (resolvedTopic.startsWith('versant_')) {
      resolvedTopic = resolvedTopic.replace('versant_', '');
      resolvedModule = 'versant';
    }

    const targetCount = Math.min(Math.max(parseInt(count, 10) || 25, 1), 100);
    const parsedLevel = level ? parseInt(level, 10) : null;

    let questionsFromDb = [];
    try {
      // Build search query matching the database fields
      const orConditions = [
        { subcategory: new RegExp(`^${resolvedTopic}$`, 'i') },
        { topic_id: resolvedTopic },
        { module_id: new RegExp(`^${resolvedTopic}$`, 'i') }
      ];

      // If generic query, match by parent module
      if (resolvedTopic === 'general' || resolvedTopic === 'all') {
        orConditions.push({ module_id: new RegExp(`^${resolvedModule}`, 'i') });
      }

      // If level is specified, try matching with level_id first
      if (parsedLevel) {
        questionsFromDb = await Question.find({
          $and: [
            { $or: orConditions },
            { level_id: parsedLevel }
          ]
        }).lean();
      }

      // If no questions found for that specific level or no level specified, search without level constraint
      if (!questionsFromDb || questionsFromDb.length === 0) {
        questionsFromDb = await Question.find({ $or: orConditions }).lean();
      }

      // If still no questions found by exact subcategory, fallback to module level
      if ((!questionsFromDb || questionsFromDb.length === 0) && resolvedModule) {
        const fallbackQuery = parsedLevel
          ? { module_id: new RegExp(`^${resolvedModule}`, 'i'), level_id: parsedLevel }
          : { module_id: new RegExp(`^${resolvedModule}`, 'i') };
        questionsFromDb = await Question.find(fallbackQuery).lean();
        
        if (!questionsFromDb || questionsFromDb.length === 0) {
          questionsFromDb = await Question.find({ module_id: new RegExp(`^${resolvedModule}`, 'i') }).lean();
        }
      }
    } catch (err) {
      console.error('[QuestionBankService] MongoDB database query error:', err.message);
      questionsFromDb = [];
    }

    // Map database documents to clean question objects with both text and question normalized
    const mappedQuestions = (questionsFromDb || []).map((q, idx) => {
      const qSub = String(q.subcategory || resolvedTopic || '').toLowerCase();
      const qMod = String(q.module_id || resolvedModule || '').toLowerCase();
      const isSpeakingTopic = qSub.includes('speaking') || qMod.includes('speaking');
      const isListeningTopic = qSub.includes('listening') || qMod.includes('listening');
      const hasOpts = Array.isArray(q.options) && q.options.length >= 2;

      let resolvedQType = q.question_type;
      let resolvedConvType = q.conversion_type || 'none';

      if (!resolvedQType || resolvedQType === 'mcq') {
        if (isSpeakingTopic) {
          resolvedQType = 'audio_to_text';
          resolvedConvType = 'audio_to_text';
        } else if (isListeningTopic) {
          resolvedQType = hasOpts ? 'text_to_audio' : 'audio';
          resolvedConvType = hasOpts ? 'text_to_audio' : 'both';
        } else {
          resolvedQType = 'mcq';
        }
      }

      return {
        id: q._id ? q._id.toString() : `db_${idx + 1}`,
        _id: q._id ? q._id.toString() : `db_${idx + 1}`,
        question_id: q._id ? q._id.toString() : `db_${idx + 1}`,
        text: q.text || q.question || '',
        question: q.text || q.question || '',
        options: hasOpts ? q.options : [],
        correct_answer: q.correct_answer || (resolvedQType === 'audio_to_text' ? (q.reference_text || q.text || q.question) : ''),
        question_type: resolvedQType,
        conversion_type: resolvedConvType,
        reference_text: q.reference_text || (resolvedQType === 'audio_to_text' ? (q.text || q.question || '') : ''),
        audio_script: q.audio_script || (isListeningTopic ? (q.text || q.question || '') : ''),
        audio_url: q.audio_url || '',
        module_id: q.module_id || resolvedModule.toUpperCase(),
        subcategory: q.subcategory || resolvedTopic,
        topic_id: q.topic_id || q.subcategory || resolvedTopic,
        level_id: q.level_id || parsedLevel || 1,
        level_name: q.level_name || `Level ${q.level_id || parsedLevel || 1}`,
        explanation: q.explanation || q.expected_output || '',
        time_limit_seconds: q.time_limit_seconds || (isSpeakingTopic ? 30 : 60)
      };
    });

    // Filter out already attempted question IDs to prevent repeating questions
    const excludeSet = new Set((Array.isArray(excludeIds) ? excludeIds : []).map(String));
    const unattemptedQuestions = mappedQuestions.filter(
      q => !excludeSet.has(String(q.id)) && !excludeSet.has(String(q._id)) && !excludeSet.has(String(q.question_id))
    );

    let candidateQuestions = [];
    if (unattemptedQuestions.length >= targetCount) {
      // Fresh, unrepeated questions available for this practice test
      const shuffledFresh = shuffleArray(unattemptedQuestions);
      candidateQuestions = shuffledFresh.slice(0, targetCount);
    } else if (unattemptedQuestions.length > 0) {
      // Use all remaining fresh questions first, then backfill non-repeating questions
      const freshShuffled = shuffleArray(unattemptedQuestions);
      const remainingNeeded = targetCount - freshShuffled.length;
      const seenQuestions = mappedQuestions.filter(q => !unattemptedQuestions.some(u => String(u.id) === String(q.id)));
      const backfill = shuffleArray(seenQuestions).slice(0, remainingNeeded);
      candidateQuestions = [...freshShuffled, ...backfill];
    } else {
      // All questions have been seen across tests; partition by testNumber so tests don't overlap
      const testNum = Math.max(parseInt(testNumber, 10) || 1, 1);
      const totalAvailable = mappedQuestions.length;
      if (totalAvailable <= targetCount) {
        candidateQuestions = shuffleArray(mappedQuestions);
      } else {
        const offset = ((testNum - 1) * targetCount) % totalAvailable;
        const cycled = [...mappedQuestions.slice(offset), ...mappedQuestions.slice(0, offset)];
        candidateQuestions = cycled.slice(0, targetCount);
      }
    }

    return {
      success: true,
      source: 'database',
      module: resolvedModule.toUpperCase(),
      topic: resolvedTopic,
      count: candidateQuestions.length,
      total_in_db: mappedQuestions.length,
      unattempted_in_db: unattemptedQuestions.length,
      questions: candidateQuestions
    };
  }

  /**
   * Return questions for the question bank selector in Test Creation
   */
  async getQuestionsByTopic(moduleType, topic, count = 25) {
    return this.getAutoPracticeQuestions(moduleType, topic, count);
  }
}

module.exports = new QuestionBankService();
