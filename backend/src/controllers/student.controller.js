const Student = require('../models/Student');
const Test = require('../models/Test');
const Result = require('../models/Result');
const ExamAttempt = require('../models/ExamAttempt');
const questionBankService = require('../services/questionBank.service');
const sdmsService = require('../services/sdms.service');
const { toStudentTest } = require('../services/studentTestView.service');

const getUserId = (req) => req.user.auth_source === 'sdms' ? null : (req.user.id || req.user._id);
const getStudentIdentityFilter = (req) => req.user.auth_source === 'sdms'
  ? { sdms_student_id: req.user.sdms_student_id }
  : { user_id: getUserId(req) };
const getStudentIdentityFields = getStudentIdentityFilter;

const isAssignedToStudent = async (test, req) => {
  const targetColleges = test.target_college_ids || [];
  const targetCourses = test.target_course_ids || [];
  const targetBranches = test.target_branch_ids || [];
  const targetYears = test.target_years || [];
  const targetSemesters = test.target_semesters || [];
  const targetSections = test.target_sections || [];

  if (req.user.auth_source === 'sdms') {
    const matchesNumber = (targets, actual) => (
      !targets.length || (actual !== null && actual !== undefined && targets.includes(Number(actual)))
    );
    if (
      !matchesNumber(targetColleges, req.user.college_id) ||
      !matchesNumber(targetCourses, req.user.course_id) ||
      !matchesNumber(targetBranches, req.user.branch_id) ||
      !matchesNumber(targetYears, req.user.year) ||
      !matchesNumber(targetSemesters, req.user.semester) ||
      (targetSections.length && !targetSections.includes(String(req.user.section || '').trim()))
    ) return false;
  } else if (targetColleges.length || targetCourses.length || targetBranches.length ||
    targetYears.length || targetSemesters.length || targetSections.length) {
    const student = await Student.findOne({ user_id: getUserId(req) });
    const actualValues = [
      [targetColleges, student?.college_id],
      [targetCourses, student?.course_id],
      [targetBranches, student?.branch_id],
      [targetYears, student?.year],
      [targetSemesters, student?.semester]
    ];
    if (actualValues.some(([targets, actual]) => (
      targets.length && (actual === undefined || !targets.includes(Number(actual)))
    ))) return false;
    if (targetSections.length && !targetSections.includes(String(student?.section || '').trim())) return false;
  }

  const targetsCampus = (test.target_campus_ids || []).map(String);
  const targetsBatch = (test.target_batch_ids || []).map(String);
  if (!targetsCampus.length && !targetsBatch.length) return true;

  const student = req.user.auth_source === 'sdms'
    ? null
    : await Student.findOne({ user_id: getUserId(req) });
  const campusId = String(student?.campus_id || req.user.campus_id || '');
  const batchId = String(student?.batch_id || req.user.batch_id || '');
  return (
    (!targetsCampus.length || targetsCampus.includes(campusId)) &&
    (!targetsBatch.length || targetsBatch.includes(batchId))
  );
};

exports.getStudentTests = async (req, res) => {
  try {
    const { module, category } = req.query;
    const filter = { status: 'active' };
    if (module) filter.module_id = new RegExp(module, 'i');
    if (category) filter.subcategory = new RegExp(category, 'i');

    const tests = await Test.find(filter).sort({ created_at: -1 });
    const assignedTests = [];
    for (const test of tests) {
      if (await isAssignedToStudent(test, req)) assignedTests.push(toStudentTest(test));
    }
    return res.json({ success: true, data: assignedTests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOnlineExams = async (req, res) => {
  try {
    const tests = await Test.find({ status: 'active', test_type: 'online_exam' })
      .sort({ startDateTime: 1, created_at: -1 })
      .lean();
    const assignedTests = [];
    for (const test of tests) {
      if (await isAssignedToStudent(test, req)) assignedTests.push(toStudentTest(test));
    }
    return res.json({ success: true, data: assignedTests });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompletedExams = async (req, res) => {
  try {
    const completedIds = await Result.distinct('test_id', {
      ...getStudentIdentityFilter(req),
      test_id: { $ne: null }
    });
    return res.json({ success: true, data: completedIds });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.startTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.status !== 'active') {
      return res.status(409).json({ success: false, message: 'This test is not active.' });
    }
    if (!(await isAssignedToStudent(test, req))) {
      return res.status(403).json({ success: false, message: 'This test is not assigned to your campus or batch.' });
    }

    const now = new Date();
    if (test.startDateTime && now < new Date(test.startDateTime)) {
      return res.status(409).json({ success: false, message: 'This test is not open yet.' });
    }
    if (test.endDateTime && now > new Date(test.endDateTime)) {
      return res.status(409).json({ success: false, message: 'This test has closed.' });
    }

    const ownerFilter = getStudentIdentityFilter(req);
    if (await Result.exists({ ...ownerFilter, test_id: test._id })) {
      return res.status(409).json({ success: false, message: 'This test has already been completed.' });
    }

    let attempt = await ExamAttempt.findOne({ ...ownerFilter, test_id: test._id });
    if (attempt?.status === 'submitted' || attempt?.status === 'submitting') {
      return res.status(409).json({ success: false, message: 'This test has already been submitted.' });
    }

    if (!attempt) {
      const durationMs = Math.max(Number(test.duration) || 30, 1) * 60 * 1000;
      attempt = new ExamAttempt({
        ...getStudentIdentityFields(req),
        test_id: test._id,
        started_at: now,
        expires_at: new Date(now.getTime() + durationMs + 120000)
      });
      try {
        await attempt.save();
      } catch (error) {
        if (error.code !== 11000) throw error;
        attempt = await ExamAttempt.findOne({ ...ownerFilter, test_id: test._id });
        if (!attempt || attempt.status !== 'in_progress') {
          return res.status(409).json({ success: false, message: 'This test has already been submitted.' });
        }
      }
    }
    if (new Date(attempt.expires_at) < now) {
      return res.status(409).json({ success: false, message: 'This exam attempt has expired.' });
    }

    return res.json({
      success: true,
      message: 'Exam session started',
      data: {
        _id: test._id,
        title: test.title,
        duration: test.duration,
        attempt_id: String(attempt._id),
        started_at: attempt.started_at,
        expires_at: attempt.expires_at,
        questions: toStudentTest(test).questions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitOnlineExam = async (req, res) => {
  let claimedAttempt = null;
  try {
    const testId = req.params.id;
    const { answers, attempt_id: attemptId, time_taken_ms: timeTakenMs } = req.body;
    const test = await Test.findById(testId);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (!(await isAssignedToStudent(test, req))) {
      return res.status(403).json({ success: false, message: 'This test is not assigned to your campus or batch.' });
    }

    const ownerFilter = getStudentIdentityFilter(req);
    claimedAttempt = await ExamAttempt.findOneAndUpdate(
      {
        _id: attemptId,
        ...ownerFilter,
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

    let correctCount = 0;
    const questions = test.questions || [];
    const totalQuestions = questions.length;
    if (!totalQuestions) {
      await ExamAttempt.updateOne({ _id: claimedAttempt._id, status: 'submitting' }, { $set: { status: 'in_progress' } });
      claimedAttempt = null;
      return res.status(400).json({ success: false, message: 'This test has no questions to grade.' });
    }

    const answersMap = {};
    if (Array.isArray(answers)) {
      answers.forEach(a => {
        if (a && a.question_id !== undefined) answersMap[a.question_id] = a.selected_answer;
        else if (a && a.id !== undefined) answersMap[a.id] = a.answer;
      });
    } else if (typeof answers === 'object' && answers !== null) {
      Object.assign(answersMap, answers);
    }

    const detailedResults = questions.map((q, idx) => {
      const qKey = q.question_id ?? q._id ?? q.id ?? idx;
      const userAns = answersMap[qKey] !== undefined ? answersMap[qKey] : answersMap[idx];
      const correctAns = q.correct_answer;
      const isCorrect = userAns !== undefined && correctAns !== undefined &&
        String(userAns).trim().toLowerCase() === String(correctAns).trim().toLowerCase();
      if (isCorrect) correctCount++;
      return {
        question_id: String(qKey),
        question_text: q.question_text || q.text || q.question || '',
        question_type: q.question_type || 'mcq',
        student_answer: userAns === undefined ? '' : String(userAns),
        correct_answer: correctAns === undefined ? '' : String(correctAns),
        correct_answer_text: correctAns === undefined ? '' : String(correctAns),
        is_correct: isCorrect,
        marks_obtained: isCorrect ? 1 : 0,
        max_marks: 1
      };
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const userId = getUserId(req);
    const student = userId ? await Student.findOne({ user_id: userId }) : null;

    const result = new Result({
      student_id: student ? student._id : (userId || null),
      user_id: userId || null,
      sdms_student_id: req.user.auth_source === 'sdms' ? req.user.sdms_student_id : null,
      test_id: test._id,
      module_id: test.module_id,
      test_name: test.title,
      test_type: test.test_type,
      duration: test.duration,
      time_taken_ms: Number.isFinite(Number(timeTakenMs)) ? Math.max(0, Number(timeTakenMs)) : 0,
      score: score,
      percentage: score,
      correct_answers: correctCount,
      total_questions: totalQuestions,
      answers: detailedResults,
      submitted_at: new Date()
    });
    await result.save();
    await ExamAttempt.updateOne(
      { _id: claimedAttempt._id, status: 'submitting' },
      { $set: { status: 'submitted', result_id: result._id } }
    );
    claimedAttempt = null;

    return res.json({
      success: true,
      message: 'Exam submitted successfully',
      data: {
        resultId: result._id,
        score,
        percentage: score,
        correctCount,
        totalQuestions
      }
    });
  } catch (error) {
    if (claimedAttempt) {
      await ExamAttempt.updateOne(
        { _id: claimedAttempt._id, status: 'submitting' },
        { $set: { status: 'in_progress' } }
      );
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAutoPracticeQuestions = async (req, res) => {
  try {
    const moduleType = req.query.module || 'crt';
    const topic = req.query.topic || 'aptitude';
    const count = parseInt(req.query.count || 25, 10);
    const level = req.query.level ? parseInt(req.query.level, 10) : null;
    const testNumber = parseInt(req.query.test_number || req.query.testNumber || 1, 10);

    // Collect question IDs already attempted by this student to prevent repeat questions
    const studentIdentity = getStudentIdentityFilter(req);
    const prevAttempts = await Result.find({
      ...studentIdentity,
      test_type: 'practice',
      module_id: new RegExp('^' + moduleType, 'i')
    }).select('answers.question_id');

    const usedIds = [];
    prevAttempts.forEach(att => {
      if (Array.isArray(att.answers)) {
        att.answers.forEach(a => {
          if (a.question_id) usedIds.push(String(a.question_id));
        });
      }
    });

    if (req.query.exclude_ids) {
      req.query.exclude_ids.split(',').forEach(id => {
        if (id.trim()) usedIds.push(id.trim());
      });
    }

    const questions = await questionBankService.getAutoPracticeQuestions(
      moduleType,
      topic,
      count,
      level,
      usedIds,
      testNumber
    );

    return res.json({
      success: true,
      data: questions,
      count: questions.length,
      test_number: testNumber
    });
  } catch (error) {
    console.error('Error in getAutoPracticeQuestions:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTestDetails = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    if (!(await isAssignedToStudent(test, req))) {
      return res.status(403).json({ success: false, message: 'This test is not assigned to your campus or batch.' });
    }
    return res.json({ success: true, data: toStudentTest(test) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnlockedModules = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const student = req.user.auth_source === 'sdms' ? null : await Student.findOne({ user_id: userId });

    const modules = student ? student.authorized_modules : ['listening', 'speaking', 'reading', 'writing', 'grammar', 'vocabulary'];
    const levels = student ? student.authorized_levels : [1];

    return res.json({
      success: true,
      data: {
        unlocked_modules: modules,
        unlocked_levels: levels
      },
      unlocked_modules: modules,
      unlocked_levels: levels
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGrammarProgress = async (req, res) => {
  try {
    const results = await Result.find({ ...getStudentIdentityFilter(req), module_id: 'grammar' });
    const averageScore = results.length
      ? Math.round((results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length) * 10) / 10
      : 0;

    return res.json({
      success: true,
      data: {
        completed_topics: results.length,
        average_score: averageScore,
        history: results
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTestResultById = async (req, res) => {
  try {
    const result = await Result.findOne({ _id: req.params.id, ...getStudentIdentityFilter(req) }).lean();
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    const test = result.test_id ? await Test.findById(result.test_id).select('title duration test_type').lean() : null;
    return res.json({
      success: true,
      data: {
        ...result,
        test_name: result.test_name || test?.title || String(result.module_id || 'Test'),
        duration: result.duration || test?.duration,
        score_percentage: result.percentage ?? result.score ?? 0,
        average_score: result.percentage ?? result.score ?? 0,
        detailed_results: Array.isArray(result.answers) ? result.answers : []
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTestHistory = async (req, res) => {
  try {
    const query = req.query || {};
    const filter = { ...getStudentIdentityFilter(req) };
    if (query.include_practice !== 'true') {
      filter.test_type = { $ne: 'practice' };
    }
    const results = await Result.find(filter)
      .sort({ submitted_at: -1, _id: -1 })
      .limit(500)
      .lean();
    const testIds = [...new Set(results.map((result) => result.test_id).filter(Boolean).map(String))];
    const tests = testIds.length ? await Test.find({ _id: { $in: testIds } }).select('title test_type module_id').lean() : [];
    const testsById = new Map(tests.map((test) => [String(test._id), test]));
    const groups = new Map();

    for (const result of results) {
      const test = result.test_id ? testsById.get(String(result.test_id)) : null;
      const testType = (result.test_type || test?.test_type) === 'online_exam' ? 'online' : 'practice';
      if (query.include_practice !== 'true' && testType === 'practice') {
        continue;
      }
      const groupId = String(result.test_id || result.module_id || 'online_exam');
      if (!groups.has(groupId)) {
        groups.set(groupId, {
          test_id: groupId,
          test_name: result.test_name || test?.title || result.module_id || 'Online Exam',
          module_name: result.module_id || test?.module_id || 'Test',
          test_type: testType,
          attempts: []
        });
      }

      const detailedResults = Array.isArray(result.answers) ? result.answers : [];
      const correctAnswers = result.correct_answers ?? detailedResults.filter((answer) => answer.is_correct).length;
      groups.get(groupId).attempts.push({
        ...result,
        test_id: groupId,
        test_name: result.test_name || test?.title || result.module_id || 'Online Exam',
        correct_answers: correctAnswers,
        total_questions: result.total_questions || detailedResults.length,
        score_percentage: result.percentage ?? result.score ?? 0,
        detailed_results: detailedResults
      });
    }

    const data = [...groups.values()].map((group) => {
      const latestAttempt = group.attempts[0];
      return {
        ...group,
        attempt_count: group.attempts.length,
        latest_submitted_at: latestAttempt?.submitted_at,
        latest_correct_answers: latestAttempt?.correct_answers || 0,
        total_questions: latestAttempt?.total_questions || 0
      };
    });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.submitPracticeTest = async (req, res) => {
  try {
    const { module_id, subcategory, topic, level, test_number, answers, questions, time_taken_seconds } = req.body;
    
    let correctCount = 0;
    const qList = Array.isArray(questions) ? questions : [];
    const detailedAnswers = qList.map((q, idx) => {
      const qId = q.question_id || q._id || q.id || String(idx);
      const userAns = answers ? answers[qId] : undefined;
      const isCorrect = userAns !== undefined && q.correct_answer !== undefined &&
        String(userAns).trim().toLowerCase() === String(q.correct_answer).trim().toLowerCase();
      if (isCorrect) correctCount++;
      return {
        question_id: qId,
        question_text: q.question || q.text || '',
        selected_answer: userAns,
        correct_answer: q.correct_answer,
        is_correct: isCorrect,
        explanation: q.explanation || ''
      };
    });

    const totalQuestions = qList.length || 25;
    const score = Math.round((correctCount / totalQuestions) * 100);

    const modName = (module_id || 'CRT').toUpperCase();
    const subcatName = (subcategory || topic || 'General')
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase());
    const lvlNum = level || 1;
    const testNum = parseInt(test_number, 10) || 1;
    const testTitle = `${modName} - ${subcatName} (Level ${lvlNum}) Practice Test ${testNum}`;

    const identity = getStudentIdentityFields(req);
    const result = new Result({
      ...identity,
      test_id: null,
      test_name: testTitle,
      module_id: modName,
      subcategory: (subcategory || topic || 'general').toLowerCase(),
      level_id: lvlNum,
      test_number: testNum,
      test_type: 'practice',
      score,
      percentage: score,
      total_questions: totalQuestions,
      correct_answers: correctCount,
      answers: detailedAnswers,
      duration: time_taken_seconds ? Math.round(time_taken_seconds / 60) : 30,
      time_taken_ms: (time_taken_seconds || 0) * 1000,
      submitted_at: new Date()
    });

    await result.save();

    return res.status(201).json({
      success: true,
      message: 'Practice test submitted and recorded successfully',
      data: result
    });
  } catch (error) {
    console.error('Error submitting practice test:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTestDetails = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ success: false, message: 'Test not found' });
    if (test.status !== 'active') {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }
    if (!(await isAssignedToStudent(test, req))) {
      return res.status(403).json({ success: false, message: 'This test is not assigned to your campus or batch.' });
    }
    return res.json({ success: true, data: toStudentTest(test) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnlockedModules = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const student = req.user.auth_source === 'sdms' ? null : await Student.findOne({ user_id: userId });

    const modules = student ? student.authorized_modules : ['listening', 'speaking', 'reading', 'writing', 'grammar', 'vocabulary'];
    const levels = student ? student.authorized_levels : [1];

    return res.json({
      success: true,
      data: {
        unlocked_modules: modules,
        unlocked_levels: levels
      },
      unlocked_modules: modules,
      unlocked_levels: levels
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGrammarProgress = async (req, res) => {
  try {
    const results = await Result.find({ ...getStudentIdentityFilter(req), module_id: 'grammar' });
    const averageScore = results.length
      ? Math.round((results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length) * 10) / 10
      : 0;

    return res.json({
      success: true,
      data: {
        completed_topics: results.length,
        average_score: averageScore,
        history: results
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTestResultById = async (req, res) => {
  try {
    const result = await Result.findOne({ _id: req.params.id, ...getStudentIdentityFilter(req) }).lean();
    if (!result) return res.status(404).json({ success: false, message: 'Result not found' });
    const test = result.test_id ? await Test.findById(result.test_id).select('title duration test_type').lean() : null;
    return res.json({
      success: true,
      data: {
        ...result,
        test_name: result.test_name || test?.title || String(result.module_id || 'Test'),
        duration: result.duration || test?.duration,
        score_percentage: result.percentage ?? result.score ?? 0,
        average_score: result.percentage ?? result.score ?? 0,
        detailed_results: Array.isArray(result.answers) ? result.answers : []
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const studentIdentity = getStudentIdentityFilter(req);
    let profileData = {};

    if (req.user.auth_source === 'sdms') {
      try {
        const sdmsStudent = await sdmsService.getStudentIdentityById(req.user.sdms_student_id);
        if (sdmsStudent) {
          profileData = {
            name: sdmsStudent.name || req.user.name,
            email: sdmsStudent.email || req.user.email,
            roll_number: sdmsStudent.roll_number || req.user.username,
            campus: sdmsStudent.college_name || 'SDMS Campus',
            course: sdmsStudent.course_name || (req.user.course_id ? `Course ${req.user.course_id}` : 'General'),
            batch: sdmsStudent.batch_name || (sdmsStudent.branch_name ? `${sdmsStudent.branch_name} (Year ${sdmsStudent.year || 1})` : `Year ${req.user.year || 1}`),
            branch: sdmsStudent.branch_name || '',
            year: sdmsStudent.year || req.user.year,
            semester: sdmsStudent.semester || req.user.semester,
            section: sdmsStudent.section || req.user.section,
            mobile_number: sdmsStudent.mobile_number || 'N/A'
          };
        }
      } catch (err) {
        console.warn('SDMS profile lookup fallback to token data:', err.message);
      }

      if (!profileData.name) {
        profileData = {
          name: req.user.name || req.user.username || 'Student',
          email: req.user.email || '',
          roll_number: req.user.username || String(req.user.sdms_student_id),
          campus: req.user.college_name || 'SDMS Campus',
          course: req.user.course_name || (req.user.course_id ? `Course ${req.user.course_id}` : 'General'),
          batch: req.user.batch || (req.user.branch_id ? `Branch ${req.user.branch_id}` : 'SDMS Batch'),
          branch: req.user.branch_name || '',
          year: req.user.year || 1,
          semester: req.user.semester || 1,
          section: req.user.section || 'A',
          mobile_number: 'N/A'
        };
      }
    } else {
      const userId = getUserId(req);
      const student = await Student.findOne({ user_id: userId })
        .populate('campus_id', 'name')
        .populate('batch_id', 'name')
        .lean();

      profileData = {
        name: student?.name || req.user.name || req.user.username || 'Student',
        email: student?.email || req.user.email || '',
        roll_number: student?.roll_number || student?.student_id || req.user.username || '',
        campus: student?.campus_id?.name || student?.college_name || 'Main Campus',
        course: student?.course_name || 'General',
        batch: student?.batch_id?.name || (student?.branch_name ? `${student.branch_name} Year ${student.year || 1}` : 'Default Batch'),
        branch: student?.branch_name || '',
        year: student?.year || 1,
        semester: student?.semester || 1,
        section: student?.section || 'A',
        mobile_number: student?.mobile_number || 'N/A'
      };
    }

    // Gather Practice Test Analytics
    const practiceResults = await Result.find({
      ...studentIdentity,
      test_type: 'practice'
    }).sort({ submitted_at: -1 }).lean();

    const totalPracticeTests = practiceResults.length;
    let totalQuestions = 0;
    let totalCorrect = 0;
    let scoredWellCount = 0; // >= 60%
    let bestScore = 0;
    let sumScore = 0;

    const moduleMap = {};

    const normalizeModuleName = (mod, subcat, testName) => {
      const text = `${mod || ''} ${subcat || ''} ${testName || ''}`.toLowerCase();
      if (text.includes('aptitude') || text.includes('math') || text.includes('number') || text.includes('percent')) {
        return { key: 'quantitative', name: 'Quantitative Aptitude', category: 'CRT' };
      }
      if (text.includes('reasoning') || text.includes('syllogism') || text.includes('puzzle') || text.includes('series')) {
        return { key: 'reasoning', name: 'Logical Reasoning', category: 'CRT' };
      }
      if (text.includes('technical') || text.includes('cs') || text.includes('data structure') || text.includes('dbms') || text.includes('algorithm')) {
        return { key: 'technical', name: 'Technical & CS', category: 'CRT' };
      }
      if (text.includes('grammar') || text.includes('tense') || text.includes('clause') || text.includes('verb')) {
        return { key: 'grammar', name: 'Grammar Mastery', category: 'Versant' };
      }
      if (text.includes('read') || text.includes('comprehension') || text.includes('passage')) {
        return { key: 'reading', name: 'Reading Comprehension', category: 'Versant' };
      }
      if (text.includes('listen') || text.includes('dialogue') || text.includes('audio')) {
        return { key: 'listening', name: 'Listening Skills', category: 'Versant' };
      }
      if (text.includes('speak') || text.includes('fluency') || text.includes('repeat')) {
        return { key: 'speaking', name: 'Speaking Proficiency', category: 'Versant' };
      }
      if (text.includes('writ') || text.includes('email') || text.includes('memo') || text.includes('paragraph')) {
        return { key: 'writing', name: 'Written Expression', category: 'Versant' };
      }
      if (text.includes('vocab') || text.includes('idiom') || text.includes('synonym') || text.includes('antonym')) {
        return { key: 'vocabulary', name: 'Vocabulary & Idioms', category: 'Versant' };
      }
      const rawName = (mod || 'General').toUpperCase();
      return { key: rawName.toLowerCase(), name: rawName, category: 'Practice' };
    };

    for (const r of practiceResults) {
      const pct = Number.isFinite(Number(r.percentage ?? r.score)) ? Math.round(Number(r.percentage ?? r.score)) : 0;
      const qCount = r.total_questions || (Array.isArray(r.answers) ? r.answers.length : 25);
      const cCount = r.correct_answers || 0;

      totalQuestions += qCount;
      totalCorrect += cCount;
      sumScore += pct;
      if (pct >= 60) scoredWellCount++;
      if (pct > bestScore) bestScore = pct;

      const norm = normalizeModuleName(r.module_id, r.subcategory, r.test_name);
      if (!moduleMap[norm.key]) {
        moduleMap[norm.key] = {
          key: norm.key,
          name: norm.name,
          category: norm.category,
          tests_attempted: 0,
          scored_well_count: 0,
          sum_score: 0,
          best_score: 0,
          total_questions: 0,
          correct_answers: 0,
          levels: { 1: 0, 2: 0, 3: 0 },
          latest_attempt_at: null,
          latest_score: null
        };
      }

      const modEntry = moduleMap[norm.key];
      modEntry.tests_attempted += 1;
      modEntry.sum_score += pct;
      if (pct >= 60) modEntry.scored_well_count += 1;
      if (pct > modEntry.best_score) modEntry.best_score = pct;
      modEntry.total_questions += qCount;
      modEntry.correct_answers += cCount;
      if (!modEntry.latest_attempt_at) {
        modEntry.latest_attempt_at = r.submitted_at;
        modEntry.latest_score = pct;
      }
      const lvl = r.level_id || 1;
      if (modEntry.levels[lvl] !== undefined) {
        modEntry.levels[lvl] += 1;
      }
    }

    const moduleAnalytics = Object.values(moduleMap).map(m => ({
      key: m.key,
      name: m.name,
      category: m.category,
      tests_attempted: m.tests_attempted,
      scored_well_count: m.scored_well_count,
      scored_well_rate: m.tests_attempted > 0 ? Math.round((m.scored_well_count / m.tests_attempted) * 100) : 0,
      average_score: m.tests_attempted > 0 ? Math.round(m.sum_score / m.tests_attempted) : 0,
      best_score: m.best_score,
      latest_score: m.latest_score,
      latest_attempt_at: m.latest_attempt_at,
      total_questions: m.total_questions,
      correct_answers: m.correct_answers,
      accuracy: m.total_questions > 0 ? Math.round((m.correct_answers / m.total_questions) * 100) : 0,
      levels: m.levels
    }));

    moduleAnalytics.sort((a, b) => b.tests_attempted - a.tests_attempted);

    const onlineExamsCount = await Result.countDocuments({
      ...studentIdentity,
      test_type: { $ne: 'practice' }
    });

    const analytics = {
      total_practice_tests: totalPracticeTests,
      scored_well_count: scoredWellCount,
      scored_well_rate: totalPracticeTests > 0 ? Math.round((scoredWellCount / totalPracticeTests) * 100) : 0,
      average_score: totalPracticeTests > 0 ? Math.round(sumScore / totalPracticeTests) : 0,
      best_score: bestScore,
      total_questions_attempted: totalQuestions,
      total_correct_answers: totalCorrect,
      overall_accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      total_online_exams: onlineExamsCount,
      modules: moduleAnalytics
    };

    return res.json({
      success: true,
      data: {
        ...profileData,
        analytics
      }
    });
  } catch (error) {
    console.error('Error in getProfile:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { email, mobile_number } = req.body;
    const userId = getUserId(req);

    if (req.user.auth_source === 'sdms') {
      return res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { email }
      });
    }

    if (userId) {
      const student = await Student.findOne({ user_id: userId });
      if (student) {
        if (email) student.email = email;
        if (mobile_number) student.mobile_number = mobile_number;
        await student.save();
      }
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    const studentIdentity = getStudentIdentityFilter(req);
    const allResults = await Result.find(studentIdentity)
      .sort({ submitted_at: -1 })
      .lean();

    const totalTestsCompleted = allResults.length;
    const onlineResults = allResults.filter(r => r.test_type === 'online_exam' || Boolean(r.test_id));
    const practiceResults = allResults.filter(r => r.test_type === 'practice' || !r.test_id);

    const highestScore = totalTestsCompleted > 0
      ? Math.max(...allResults.map(r => Number(r.percentage ?? r.score ?? 0)))
      : 0;

    const sumScore = allResults.reduce((acc, r) => acc + Number(r.percentage ?? r.score ?? 0), 0);
    const averageScore = totalTestsCompleted > 0 ? Math.round(sumScore / totalTestsCompleted) : 0;
    const practiceScoredWell = practiceResults.filter(r => Number(r.percentage ?? r.score ?? 0) >= 60).length;

    const targetTests = 10;
    const overallProgress = Math.min(100, Math.round((totalTestsCompleted / targetTests) * 100));

    const coreModules = [
      { id: 'quantitative', name: 'Quantitative Aptitude', category: 'CRT', icon: 'Calculator' },
      { id: 'reasoning', name: 'Logical Reasoning', category: 'CRT', icon: 'BrainCircuit' },
      { id: 'technical', name: 'Technical & CS', category: 'CRT', icon: 'Code' },
      { id: 'grammar', name: 'Grammar Mastery', category: 'Versant', icon: 'BrainCircuit' },
      { id: 'reading', name: 'Reading Comprehension', category: 'Versant', icon: 'BookOpen' },
      { id: 'listening', name: 'Listening Skills', category: 'Versant', icon: 'Headphones' },
      { id: 'speaking', name: 'Speaking Proficiency', category: 'Versant', icon: 'Mic' },
      { id: 'writing', name: 'Written Expression', category: 'Versant', icon: 'PenTool' },
      { id: 'vocabulary', name: 'Vocabulary & Idioms', category: 'Versant', icon: 'Bookmark' }
    ];

    const moduleStats = coreModules.map(mod => {
      const matchResults = allResults.filter(r => {
        const text = `${r.module_id || ''} ${r.subcategory || ''} ${r.test_name || ''}`.toLowerCase();
        if (mod.id === 'quantitative') return text.includes('aptitude') || text.includes('math') || text.includes('number') || text.includes('percent');
        if (mod.id === 'reasoning') return text.includes('reasoning') || text.includes('syllogism') || text.includes('puzzle') || text.includes('series');
        if (mod.id === 'technical') return text.includes('technical') || text.includes('cs') || text.includes('data structure') || text.includes('dbms') || text.includes('algorithm');
        if (mod.id === 'grammar') return text.includes('grammar') || text.includes('tense') || text.includes('clause') || text.includes('verb');
        if (mod.id === 'reading') return text.includes('read') || text.includes('comprehension') || text.includes('passage');
        if (mod.id === 'listening') return text.includes('listen') || text.includes('dialogue') || text.includes('audio');
        if (mod.id === 'speaking') return text.includes('speak') || text.includes('fluency') || text.includes('repeat');
        if (mod.id === 'writing') return text.includes('writ') || text.includes('email') || text.includes('memo') || text.includes('paragraph');
        if (mod.id === 'vocabulary') return text.includes('vocab') || text.includes('idiom') || text.includes('synonym') || text.includes('antonym');
        return false;
      });

      const attempts = matchResults.length;
      const best = attempts > 0 ? Math.max(...matchResults.map(r => Number(r.percentage ?? r.score ?? 0))) : 0;
      const sum = matchResults.reduce((acc, r) => acc + Number(r.percentage ?? r.score ?? 0), 0);
      const avg = attempts > 0 ? Math.round(sum / attempts) : 0;
      const scoredWell = matchResults.filter(r => Number(r.percentage ?? r.score ?? 0) >= 60).length;

      return {
        ...mod,
        attempts_count: attempts,
        highest_score: best,
        average_score: avg,
        scored_well_count: scoredWell,
        status: attempts >= 3 ? 'completed' : attempts > 0 ? 'in_progress' : 'not_started',
        progress_percentage: Math.min(100, attempts * 25)
      };
    });

    const recentActivities = allResults.slice(0, 6).map(r => ({
      _id: r._id,
      test_name: r.test_name || r.module_id || 'Assessment',
      test_type: r.test_type || (r.test_id ? 'online_exam' : 'practice'),
      score: r.percentage ?? r.score ?? 0,
      correct_answers: r.correct_answers || 0,
      total_questions: r.total_questions || (Array.isArray(r.answers) ? r.answers.length : 25),
      submitted_at: r.submitted_at
    }));

    const responseData = {
      overall_progress: overallProgress,
      total_tests_completed: totalTestsCompleted,
      online_exams_count: onlineResults.length,
      practice_tests_count: practiceResults.length,
      highest_score: highestScore,
      average_score: averageScore,
      practice_scored_well: practiceScoredWell,
      modules: moduleStats,
      recent_activities: recentActivities
    };

    return res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error in getDashboardSummary:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

