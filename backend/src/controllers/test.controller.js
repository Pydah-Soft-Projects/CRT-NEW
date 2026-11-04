const Test = require('../models/Test');
const Question = require('../models/Question');
const Result = require('../models/Result');
const Student = require('../models/Student');
const ExamAttempt = require('../models/ExamAttempt');
const s3Service = require('../services/s3.service');
const aiService = require('../services/ai.service');
const questionBankService = require('../services/questionBank.service');
const sdmsService = require('../services/sdms.service');
const { testIncludesSdmsScope } = require('../services/sdmsTestScope.service');

const getResultIdentity = (req) => {
  if (req.user.auth_source === 'sdms') {
    return { user_id: null, student_id: null, sdms_student_id: req.user.sdms_student_id };
  }
  return {
    user_id: req.user.id || req.user._id,
    student_id: req.user.id || req.user._id,
    sdms_student_id: null
  };
};

exports.getModules = async (req, res) => {
  return res.json({
    success: true,
    data: [
      { id: 'crt', name: 'CRT Modules', description: 'Aptitude, Reasoning, and Technical preparation' },
      { id: 'versant', name: 'Versant English', description: 'Comprehensive communication assessment' },
      { id: 'listening', name: 'Listening Comprehension', description: 'Audio comprehension test' },
      { id: 'speaking', name: 'Speaking Proficiency', description: 'Pronunciation and fluency assessment' },
      { id: 'reading', name: 'Reading Comprehension', description: 'Text understanding test' },
      { id: 'writing', name: 'Writing Ability', description: 'Grammar and written expression' },
      { id: 'grammar', name: 'Grammar Mastery', description: 'Structured grammar practice' },
      { id: 'vocabulary', name: 'Vocabulary Knowledge', description: 'Word power assessment' }
    ]
  });
};

exports.getLevels = async (req, res) => {
  const { module_id } = req.query;
  return res.json({
    success: true,
    data: [
      { id: 1, name: 'Beginner (Level 1-3)', level: 1 },
      { id: 2, name: 'Intermediate (Level 4-6)', level: 2 },
      { id: 3, name: 'Advanced (Level 7-9)', level: 3 }
    ]
  });
};

/**
 * Auto-generate 25 Practice Questions for CRT / VERSANT
 */
exports.getAutoPracticeQuestions = async (req, res) => {
  try {
    const moduleType = req.query.module || req.body.module || 'crt';
    const topic = req.query.topic || req.body.topic || 'aptitude';
    const count = parseInt(req.query.count || req.body.count || 25, 10);

    const result = await questionBankService.getAutoPracticeQuestions(moduleType, topic, count);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create Online Test with 3-Step Wizard Data
 */
exports.createOnlineTest = async (req, res) => {
  try {
    const {
      title,
      description,
      module_id,
      subcategory,
      duration,
      startDateTime,
      endDateTime,
      target_campus_ids,
      target_batch_ids,
      target_college_ids,
      target_course_ids,
      target_branch_ids,
      target_years,
      target_semesters,
      target_sections,
      questions,
      test_type
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Test title is required' });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one question is required' });
    }

    const targetCollegeIds = Array.isArray(target_college_ids) ? target_college_ids.map(Number) : [];
    const targetCourseIds = Array.isArray(target_course_ids) ? target_course_ids.map(Number) : [];
    if (
      (Array.isArray(target_campus_ids) && target_campus_ids.length) ||
      (Array.isArray(target_batch_ids) && target_batch_ids.length)
    ) {
      return res.status(400).json({
        success: false,
        message: 'Online exams must target SDMS colleges, courses, branches, years, semesters, and sections.'
      });
    }
    if ([...targetCollegeIds, ...targetCourseIds].some((id) => !Number.isSafeInteger(id) || id <= 0)) {
      return res.status(400).json({ success: false, message: 'SDMS target IDs must be positive integers.' });
    }
    if (req.sdmsScope?.collegeId) {
      if (targetCollegeIds.some((id) => id !== req.sdmsScope.collegeId)) {
        return res.status(403).json({ success: false, message: 'You cannot create an exam outside your assigned SDMS college.' });
      }
      targetCollegeIds.splice(0, targetCollegeIds.length, req.sdmsScope.collegeId);
    }
    if (req.sdmsScope?.courseId) {
      if (targetCourseIds.some((id) => id !== req.sdmsScope.courseId)) {
        return res.status(403).json({ success: false, message: 'You cannot create an exam outside your assigned SDMS course.' });
      }
      targetCourseIds.splice(0, targetCourseIds.length, req.sdmsScope.courseId);
    }

    const test = new Test({
      title: title.trim(),
      description: description || '',
      module_id: (module_id || 'CRT').toUpperCase(),
      subcategory: subcategory || 'general',
      test_type: test_type || 'online_exam',
      duration: parseInt(duration, 10) || 30,
      startDateTime: startDateTime ? new Date(startDateTime) : new Date(),
      endDateTime: endDateTime ? new Date(endDateTime) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      target_campus_ids: Array.isArray(target_campus_ids) ? target_campus_ids : [],
      target_batch_ids: Array.isArray(target_batch_ids) ? target_batch_ids : [],
      target_college_ids: targetCollegeIds,
      target_course_ids: targetCourseIds,
      target_branch_ids: Array.isArray(target_branch_ids) ? target_branch_ids.map(Number) : [],
      target_years: Array.isArray(target_years) ? target_years.map(Number) : [],
      target_semesters: Array.isArray(target_semesters) ? target_semesters.map(Number) : [],
      target_sections: Array.isArray(target_sections) ? target_sections.map(String) : [],
      questions: questions,
      status: 'active',
      created_by: req.user ? (req.user.id || req.user._id) : null
    });

    await test.save();

    return res.status(201).json({
      success: true,
      message: 'Online test created and published successfully',
      data: test
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a test by ID
 */
exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    if (req.user.role !== 'superadmin') {
      const scope = req.sdmsScope || {};
      if (
        !testIncludesSdmsScope(test, scope) ||
        (scope.collegeId && !(test.target_college_ids || []).map(Number).includes(scope.collegeId)) ||
        (scope.courseId && !(test.target_course_ids || []).map(Number).includes(scope.courseId))
      ) {
        return res.status(403).json({ success: false, message: 'This test is outside your management scope.' });
      }
    }
    await Test.deleteOne({ _id: test._id });
    return res.json({ success: true, message: 'Test deleted successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Calculate Student Count for target selection
 */
exports.getStudentCount = async (req, res) => {
  try {
    const b = req.body || {};
    const collegeIds = req.sdmsScope?.collegeIds || (req.sdmsScope?.collegeId ? [req.sdmsScope.collegeId] : null) || (b.college_ids || b.target_college_ids || b.college_id || null);
    const courseIds = req.sdmsScope?.courseIds || (req.sdmsScope?.courseId ? [req.sdmsScope.courseId] : null) || (b.course_ids || b.target_course_ids || b.course_id || null);
    const branchIds = b.branch_ids || b.target_branch_ids || b.branch_id || null;
    const years = b.years || b.target_years || b.year || null;
    const semesters = b.semesters || b.target_semesters || b.semester || null;
    const sections = b.sections || b.target_sections || b.section || null;

    const result = await sdmsService.getFilteredStudents({
      collegeId: collegeIds,
      courseId: courseIds,
      branchId: branchIds,
      year: years,
      semester: semesters,
      section: sections,
      page: 1,
      limit: 1,
      includePhoto: false,
      loginEnabledOnly: true
    });
    return res.json({ success: true, source: 'rds', count: result.pagination.total });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadQuestions = async (req, res) => {
  try {
    const { module_id, level_id } = req.body;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No CSV file uploaded' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(l => l.trim().length > 0);
    
    let createdCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      if (parts.length >= 2) {
        const questionText = parts[0].trim();
        const correctAnswer = parts[1].trim();
        const options = parts.slice(2).map(o => o.trim());

        const q = new Question({
          text: questionText,
          module_id: module_id || 'reading',
          level_id: level_id ? parseInt(level_id) : 1,
          correct_answer: correctAnswer,
          options: options.length ? options : [correctAnswer]
        });
        await q.save();
        createdCount++;
      }
    }

    return res.json({
      success: true,
      message: `Uploaded ${createdCount} questions successfully.`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTestFromBank = async (req, res) => {
  try {
    const test = new Test(req.body);
    await test.save();
    return res.status(201).json({ success: true, data: test });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllTests = async (req, res) => {
  try {
    const scope = req.sdmsScope || {};
    const andConditions = [];
    if (req.user && req.user.role !== 'superadmin') {
      const scopeColIds = scope.collegeIds || (scope.collegeId ? [scope.collegeId] : (req.user?.sdms_college_ids?.length ? req.user.sdms_college_ids : (req.user?.sdms_college_id ? [req.user.sdms_college_id] : [])));
      const scopeCourseIds = scope.courseIds || (scope.courseId ? [scope.courseId] : (req.user?.sdms_course_ids?.length ? req.user.sdms_course_ids : (req.user?.sdms_course_id ? [req.user.sdms_course_id] : [])));
      const scopeBranchIds = scope.branchIds || (scope.branchId ? [scope.branchId] : (req.user?.sdms_branch_ids?.length ? req.user.sdms_branch_ids : (req.user?.sdms_branch_id ? [req.user.sdms_branch_id] : [])));
      const scopeYears = scope.years || (scope.year ? [scope.year] : (req.user?.sdms_years?.length ? req.user.sdms_years : (req.user?.sdms_year ? [req.user.sdms_year] : [])));

      if (scopeColIds && scopeColIds.length > 0) {
        andConditions.push({
          $or: [
            { target_college_ids: { $in: scopeColIds.map(Number) } },
            { target_college_ids: { $size: 0 } },
            { target_college_ids: { $exists: false } }
          ]
        });
      }
      if (scopeCourseIds && scopeCourseIds.length > 0) {
        andConditions.push({
          $or: [
            { target_course_ids: { $in: scopeCourseIds.map(Number) } },
            { target_course_ids: { $size: 0 } },
            { target_course_ids: { $exists: false } }
          ]
        });
      }
      if (scopeBranchIds && scopeBranchIds.length > 0) {
        andConditions.push({
          $or: [
            { target_branch_ids: { $in: scopeBranchIds.map(Number) } },
            { target_branch_ids: { $size: 0 } },
            { target_branch_ids: { $exists: false } }
          ]
        });
      }
      if (scopeYears && scopeYears.length > 0) {
        andConditions.push({
          $or: [
            { target_years: { $in: scopeYears.map(Number) } },
            { target_years: { $size: 0 } },
            { target_years: { $exists: false } }
          ]
        });
      }
    }
    const filter = andConditions.length ? { $and: andConditions } : {};
    const tests = await Test.find(filter).sort({ created_at: -1 }).lean();
    const formatted = tests.map(t => ({
      ...t,
      question_count: Array.isArray(t.questions) ? t.questions.length : 0
    }));
    return res.json({ success: true, data: formatted });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getQuestions = async (req, res) => {
  try {
    const { module_id, level_id } = req.query;
    const filter = {};
    if (module_id) filter.module_id = module_id;
    if (level_id) filter.level_id = parseInt(level_id);

    const questions = await Question.find(filter);
    return res.json({ success: true, data: questions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitPracticeTest = async (req, res) => {
  try {
    const { test_id, module_id, answers, reference_text } = req.body;
    let audioUrl = '';
    let transcription = '';
    let aiEval = null;

    if (req.file) {
      // Upload speaking recording to AWS S3
      const fileKey = `speaking/${req.user.id || 'std'}_${Date.now()}.wav`;
      audioUrl = await s3Service.uploadFile(req.file.buffer, fileKey, req.file.mimetype || 'audio/wav');

      // Send audio to Python AI server for Whisper transcription
      const transcribeRes = await aiService.transcribeAudio(req.file.buffer, req.file.originalname);
      transcription = transcribeRes.transcription || '';

      // Evaluate pronunciation against reference text
      if (reference_text || req.body.prompt_text) {
        aiEval = await aiService.evaluatePronunciation(reference_text || req.body.prompt_text, transcription);
      }
    }

    const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : (answers || []);
    let score = 0;
    if (aiEval && typeof aiEval.overall_score === 'number') {
      score = aiEval.overall_score;
    }

    const resultIdentity = getResultIdentity(req);
    const studentDoc = resultIdentity.sdms_student_id
      ? null
      : await Student.findOne({ user_id: req.user.id || req.user._id });

    const result = new Result({
      ...resultIdentity,
      student_id: studentDoc ? studentDoc._id : resultIdentity.student_id,
      test_id: test_id || null,
      module_id: module_id || 'speaking',
      score: score,
      percentage: score,
      answers: Array.isArray(parsedAnswers) ? parsedAnswers.map(ans => ({
        ...(typeof ans === 'object' ? ans : { answer: ans }),
        student_audio_url: ans.student_audio_url || audioUrl,
        audio_url: ans.audio_url || audioUrl
      })) : [{ student_audio_url: audioUrl, audio_url: audioUrl, transcription }],
      speaking_audio_url: audioUrl,
      transcription: transcription,
      ai_evaluation: aiEval ? {
        accuracy_score: aiEval.accuracy_score,
        fluency_score: aiEval.fluency_score,
        overall_score: aiEval.overall_score
      } : { accuracy_score: score, fluency_score: score, overall_score: score }
    });

    await result.save();

    return res.json({
      success: true,
      data: result,
      score,
      audioUrl,
      transcription,
      evaluation: aiEval
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 1-to-1 Audio -> Text API
 * Transcribe speaking practice audio for immediate student feedback
 */
exports.transcribeAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file required' });
    }

    const transcribeRes = await aiService.transcribeAudio(
      req.file.buffer,
      req.file.originalname,
      req.body.language || 'en'
    );

    return res.json({
      success: transcribeRes.success !== false,
      transcript: transcribeRes.transcript || transcribeRes.transcription || transcribeRes.text,
      transcription: transcribeRes.transcription || transcribeRes.text,
      text: transcribeRes.text || transcribeRes.transcription
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Validate Student Transcript against Reference Text
 */
exports.validateTranscript = async (req, res) => {
  try {
    const { original_sentence, reference_text, student_transcript, transcribed_text } = req.body;
    const refText = original_sentence || reference_text || '';
    const transText = student_transcript || transcribed_text || '';

    const evaluation = aiService.evaluatePronunciation(refText, transText);

    return res.json({
      success: true,
      ...evaluation
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * 1-to-1 Text -> Voice API
 * Generate TTS speech voice audio from given text
 */
exports.generateTTS = async (req, res) => {
  try {
    const { text, language, accent, format } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const ttsResult = await aiService.generateTTS(text, language || 'en', accent || 'com', format || 'base64');
    return res.json(ttsResult);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};



/**
 * Submit and Grade Multi-question Speaking / Listening Exam
 * Receives multiple student audio recordings, transcribes via Whisper, grades via aiService
 */
exports.submitSpeakingExam = async (req, res) => {
  let claimedAttempt = null;
  try {
    const testId = req.params.id || req.body.test_id;
    const timeTakenMs = req.body.time_taken_ms;
    const resultIdentity = req.user ? getResultIdentity(req) : null;
    const userId = req.user?.auth_source === 'sdms' ? null : (req.user ? (req.user.id || req.user._id) : null);
    const attemptIdentity = req.user?.auth_source === 'sdms'
      ? { sdms_student_id: req.user.sdms_student_id }
      : { user_id: userId };
    const studentDoc = userId ? await Student.findOne({ user_id: userId }) : null;

    let test = null;
    let questions = [];

    if (testId) {
      test = await Test.findById(testId);
      if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
      questions = Array.isArray(test.questions) ? test.questions : [];

      const attemptId = req.body.attempt_id;
      claimedAttempt = await ExamAttempt.findOneAndUpdate(
        {
          _id: attemptId,
          ...attemptIdentity,
          test_id: test._id,
          status: 'in_progress',
          expires_at: { $gte: new Date() }
        },
        { $set: { status: 'submitting' } },
        { new: true }
      );
      if (!claimedAttempt) {
        return res.status(409).json({
          success: false,
          message: 'The exam attempt is missing, expired, or already submitted.'
        });
      }
    }

    // Fallback: if questions passed in request body
    if (!test && questions.length === 0 && req.body.questions) {
      try {
        questions = typeof req.body.questions === 'string' ? JSON.parse(req.body.questions) : req.body.questions;
      } catch {
        return res.status(400).json({ success: false, message: 'Questions must be valid JSON.' });
      }
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      if (claimedAttempt) {
        await ExamAttempt.updateOne({ _id: claimedAttempt._id, status: 'submitting' }, { $set: { status: 'in_progress' } });
        claimedAttempt = null;
      }
      return res.status(400).json({ success: false, message: 'This assessment has no questions to grade.' });
    }

    const files = req.files || [];
    const base64Recordings = req.body.recordings ? (typeof req.body.recordings === 'string' ? JSON.parse(req.body.recordings) : req.body.recordings) : {};
    const textAnswers = req.body.answers ? (typeof req.body.answers === 'string' ? JSON.parse(req.body.answers) : req.body.answers) : {};

    const evaluatedQuestions = [];
    let totalScoreSum = 0;
    let totalAccuracySum = 0;
    let totalFluencySum = 0;
    let totalCompletenessSum = 0;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const qKey = q.question_id ?? q._id ?? q.id ?? i;
      const refText = String(q.reference_text || q.text || q.sentence || q.prompt || '').trim();

      // Find matching audio file or base64
      let audioBuffer = null;
      let filename = `answer_${qKey}.wav`;

      const matchedFile = files.find(f =>
        f.fieldname === `question_${qKey}` || 
        f.fieldname === `answer_${qKey}` || 
        f.fieldname === `file_${i}` || 
        f.fieldname === `audio_${i}`
      );

      if (matchedFile && matchedFile.buffer) {
        audioBuffer = matchedFile.buffer;
        filename = matchedFile.originalname || filename;
      } else if (base64Recordings[qKey] || base64Recordings[i]) {
        const b64 = base64Recordings[qKey] || base64Recordings[i];
        if (typeof b64 === 'string') {
          const cleanB64 = b64.replace(/^data:audio\/\w+;base64,/, '');
          audioBuffer = Buffer.from(cleanB64, 'base64');
        }
      } else if (req.body[`question_${qKey}`] && typeof req.body[`question_${qKey}`] === 'string' && req.body[`question_${qKey}`].startsWith('data:audio')) {
        const cleanB64 = req.body[`question_${qKey}`].replace(/^data:audio\/\w+;base64,/, '');
        audioBuffer = Buffer.from(cleanB64, 'base64');
      }

      let transcription = '';
      let evalData = null;
      let studentAudioUrl = '';

      const needsSpeechRecording =
        String(test?.module_id || '').toUpperCase() === 'SPEAKING' ||
        String(test?.subcategory || '').toLowerCase().includes('speaking') ||
        q.question_type === 'audio_to_text' ||
        q.question_type === 'audio_interactive' ||
        q.question_type === 'speaking' ||
        q.conversion_type === 'audio_to_text' ||
        q.conversion_type === 'both';

      if (audioBuffer && audioBuffer.length > 0) {
        try {
          const ext = filename.split('.').pop() || 'wav';
          const fileKey = `speaking/${req.user?.id || 'std'}_${test?._id || 'exam'}_q${i}_${Date.now()}.${ext}`;
          const mimeType = ext === 'webm' ? 'audio/webm' : (ext === 'mp4' ? 'audio/mp4' : 'audio/wav');
          studentAudioUrl = await s3Service.uploadFile(audioBuffer, fileKey, mimeType);
        } catch (uploadErr) {
          console.error(`[submitSpeakingExam] Upload audio error for q${i + 1}:`, uploadErr);
        }
      }

      if (needsSpeechRecording && audioBuffer && audioBuffer.length > 0) {
        const transcribeRes = await aiService.transcribeAudio(audioBuffer, filename);
        if (transcribeRes.success === false) {
          const error = new Error(`Speech transcription failed for question ${i + 1}.`);
          error.statusCode = 503;
          throw error;
        }
        transcription = transcribeRes.transcription || transcribeRes.text || '';
        evalData = aiService.evaluatePronunciation(refText, transcription);
      } else if (needsSpeechRecording && test) {
        const error = new Error(`An audio recording is required for question ${i + 1}.`);
        error.statusCode = 400;
        throw error;
      } else if (test) {
        const studentAnswer = textAnswers[qKey] || req.body[`question_${qKey}`] || '';
        const correctAnswer = q.correct_answer;
        const isCorrect = studentAnswer !== '' && correctAnswer !== undefined &&
          String(studentAnswer).trim().toLowerCase() === String(correctAnswer).trim().toLowerCase();
        const mcqScore = isCorrect ? 100 : 0;
        evalData = {
          accuracy_score: mcqScore,
          fluency_score: mcqScore,
          completeness_score: mcqScore,
          overall_score: mcqScore,
          word_feedback: []
        };
        transcription = String(studentAnswer);
      } else {
        const textAns = textAnswers[qKey] || req.body[`question_${qKey}`] || '';
        if (textAns && typeof textAns === 'string' && !textAns.startsWith('data:audio')) {
          transcription = textAns;
          evalData = aiService.evaluatePronunciation(refText, textAns);
        } else {
          evalData = {
            accuracy_score: 0,
            fluency_score: 0,
            completeness_score: 0,
            overall_score: 0,
            word_feedback: []
          };
        }
      }

      const qAccuracy = evalData.accuracy_score || 0;
      const qFluency = evalData.fluency_score || 0;
      const qCompleteness = evalData.completeness_score || 0;
      const qOverall = evalData.overall_score || 0;

      totalScoreSum += qOverall;
      totalAccuracySum += qAccuracy;
      totalFluencySum += qFluency;
      totalCompletenessSum += qCompleteness;

      evaluatedQuestions.push({
        question_id: qKey,
        question_index: i + 1,
        question_text: refText,
        question_type: q.question_type || (needsSpeechRecording ? 'speaking' : 'mcq'),
        student_answer: transcription,
        student_audio_url: studentAudioUrl,
        audio_url: studentAudioUrl,
        is_correct: qOverall >= 60,
        marks_obtained: qOverall,
        max_marks: 100,
        sentence: refText,
        reference_text: refText,
        prompt: q.text || refText,
        transcription: transcription,
        accuracy_score: qAccuracy,
        fluency_score: qFluency,
        completeness_score: qCompleteness,
        overall_score: qOverall,
        word_feedback: evalData.word_feedback || [],
        passed: qOverall >= 60
      });
    }

    const count = Math.max(questions.length, 1);
    const avgScore = Math.round(totalScoreSum / count);
    const correctCount = evaluatedQuestions.filter((answer) => answer.is_correct).length;
    const avgAccuracy = Math.round(totalAccuracySum / count);
    const avgFluency = Math.round(totalFluencySum / count);
    const avgCompleteness = Math.round(totalCompletenessSum / count);

    const result = new Result({
      ...(resultIdentity || {}),
      student_id: studentDoc ? studentDoc._id : (userId || null),
      user_id: userId,
      test_id: test ? test._id : null,
      test_name: test?.title || '',
      test_type: test?.test_type || '',
      module_id: test?.module_id || req.body.module_id || 'SPEAKING',
      score: avgScore,
      percentage: avgScore,
      correct_answers: correctCount,
      duration: test?.duration || 0,
      time_taken_ms: Number.isFinite(Number(timeTakenMs)) ? Math.max(0, Number(timeTakenMs)) : 0,
      total_questions: questions.length,
      answers: evaluatedQuestions,
      speaking_audio_url: evaluatedQuestions.find(eq => eq.student_audio_url)?.student_audio_url || '',
      transcription: evaluatedQuestions.map(eq => eq.transcription).filter(Boolean).join(' | '),
      ai_evaluation: {
        accuracy_score: avgAccuracy,
        fluency_score: avgFluency,
        overall_score: avgScore,
        pronunciation_breakdown: {
          completeness_score: avgCompleteness,
          questions: evaluatedQuestions
        }
      },
      submitted_at: new Date()
    });

    if (resultIdentity) {
      await result.save();
    }
    if (claimedAttempt) {
      await ExamAttempt.updateOne(
        { _id: claimedAttempt._id, status: 'submitting' },
        { $set: { status: 'submitted', result_id: result._id } }
      );
      claimedAttempt = null;
    }

    return res.json({
      success: true,
      message: 'Speaking assessment submitted and evaluated successfully',
      data: {
        resultId: result._id,
        score: avgScore,
        percentage: avgScore,
        accuracy_score: avgAccuracy,
        fluency_score: avgFluency,
        completeness_score: avgCompleteness,
        totalQuestions: questions.length,
        evaluatedCount: evaluatedQuestions.length,
        answers: evaluatedQuestions,
        ai_evaluation: result.ai_evaluation
      }
    });
  } catch (error) {
    console.error('[submitSpeakingExam Error]:', error);
    if (claimedAttempt) {
      await ExamAttempt.updateOne(
        { _id: claimedAttempt._id, status: 'submitting' },
        { $set: { status: 'in_progress' } }
      );
    }
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Speaking assessment could not be completed.'
    });
  }
};
