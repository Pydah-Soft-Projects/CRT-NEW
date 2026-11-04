const s3Service = require('../services/s3.service');
const mongoose = require('mongoose');
const Result = require('../models/Result');
const Test = require('../models/Test');
const Student = require('../models/Student');
const User = require('../models/User');
const sdmsService = require('../services/sdms.service');
const { testIncludesSdmsScope } = require('../services/sdmsTestScope.service');

const getReportingScope = (req) => {
  const scope = req.sdmsScope || {};
  const cleanIds = (arr, single) => {
    let list = [];
    if (Array.isArray(arr)) {
      list = arr.map(Number).filter(n => Number.isSafeInteger(n) && n > 0);
    }
    if (list.length === 0 && single !== null && single !== undefined && single !== '' && single !== 'null') {
      const n = Number(single);
      if (Number.isSafeInteger(n) && n > 0) list = [n];
    }
    return list;
  };

  const collegeIds = scope.collegeIds || cleanIds(req.user?.sdms_college_ids, req.user?.sdms_college_id || req.query?.college_id || req.query?.campus_id);
  const courseIds = scope.courseIds || cleanIds(req.user?.sdms_course_ids, req.user?.sdms_course_id || req.query?.course_id);
  const branchIds = scope.branchIds || cleanIds(req.user?.sdms_branch_ids, req.user?.sdms_branch_id || req.query?.branch_id);
  const years = scope.years || cleanIds(req.user?.sdms_years, req.user?.sdms_year || req.query?.year);

  const collegeId = scope.collegeId || collegeIds[0] || null;
  const courseId = scope.courseId || courseIds[0] || null;

  return {
    collegeId,
    courseId,
    collegeIds: collegeIds.length ? collegeIds : null,
    courseIds: courseIds.length ? courseIds : null,
    branchIds: branchIds.length ? branchIds : null,
    years: years.length ? years : null
  };
};

/**
 * GET /practice-tests-by-module
 * Returns practice tests categorized by module_id
 */
exports.getPracticeTestsByModule = async (req, res) => {
  try {
    const scope = getReportingScope(req);

    // 1. Fetch tests from Test collection
    const allTests = await Test.find({ status: { $ne: 'archived' } }).sort({ created_at: -1 }).lean().catch(() => []);
    
    // Filter tests by SDMS scope if scoped
    const visibleTests = allTests.filter(t => testIncludesSdmsScope(t, scope));

    const moduleTests = {};
    const standardModules = ['CRT', 'APTITUDE', 'REASONING', 'GRAMMAR', 'VOCABULARY', 'READING', 'WRITING', 'LISTENING', 'SPEAKING'];
    standardModules.forEach(mod => {
      moduleTests[mod] = [];
    });

    const seenTitles = new Set();

    visibleTests.forEach(test => {
      const modId = (test.module_id || 'CRT').toUpperCase();
      if (!moduleTests[modId]) moduleTests[modId] = [];
      const testIdStr = String(test._id);
      seenTitles.add((test.title || '').trim().toLowerCase());

      moduleTests[modId].push({
        test_id: testIdStr,
        test_name: test.title,
        subcategory: test.subcategory || 'Practice Test',
        total_questions: Array.isArray(test.questions) ? test.questions.length : 0,
        module_id: modId,
        test_type: test.test_type || 'practice',
        duration: test.duration || 30
      });
    });

    // 2. Also look at Result collection for student practice submissions
    const practiceResults = await Result.find({}).sort({ submitted_at: -1 }).limit(1000).lean().catch(() => []);
    
    for (const r of practiceResults) {
      const rawTitle = (r.test_name || '').trim();
      if (!rawTitle) continue;
      const lowerTitle = rawTitle.toLowerCase();
      if (seenTitles.has(lowerTitle)) continue;

      const modId = (r.module_id || 'CRT').toUpperCase();
      if (!moduleTests[modId]) moduleTests[modId] = [];

      seenTitles.add(lowerTitle);
      const synthId = r.test_id ? String(r.test_id) : `synth_${Buffer.from(rawTitle).toString('base64url').slice(0, 32)}`;
      
      moduleTests[modId].push({
        test_id: synthId,
        test_name: rawTitle,
        subcategory: r.subcategory ? r.subcategory.charAt(0).toUpperCase() + r.subcategory.slice(1) : 'Practice Test',
        total_questions: r.total_questions || (Array.isArray(r.answers) ? r.answers.length : 20),
        module_id: modId,
        test_type: r.test_type || 'practice',
        duration: r.duration || 30
      });
    }

    return res.json({
      success: true,
      data: moduleTests
    });
  } catch (error) {
    console.error('Error in getPracticeTestsByModule:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /test-assigned-students/:testId
 * Returns attempted and unattempted students for a test
 */
exports.getTestAssignedStudents = async (req, res) => {
  try {
    const { testId } = req.params;
    const scope = getReportingScope(req);

    let testDoc = null;
    let testName = '';
    let subcategory = 'Practice Test';
    let moduleId = 'CRT';
    let totalQuestions = 0;

    if (mongoose.Types.ObjectId.isValid(testId)) {
      testDoc = await Test.findById(testId).lean().catch(() => null);
    }

    if (testDoc) {
      testName = testDoc.title;
      subcategory = testDoc.subcategory || 'Practice Test';
      moduleId = (testDoc.module_id || 'CRT').toUpperCase();
      totalQuestions = Array.isArray(testDoc.questions) ? testDoc.questions.length : 0;
    } else {
      const sampleResult = await Result.findOne({
        $or: [
          { test_id: testId },
          { _id: mongoose.Types.ObjectId.isValid(testId) ? testId : null }
        ]
      }).lean().catch(() => null);

      if (sampleResult) {
        testName = sampleResult.test_name;
        subcategory = sampleResult.subcategory || 'Practice Test';
        moduleId = (sampleResult.module_id || 'CRT').toUpperCase();
        totalQuestions = sampleResult.total_questions || 20;
      } else if (testId && testId.startsWith('synth_')) {
        try {
          testName = Buffer.from(testId.replace('synth_', ''), 'base64url').toString('utf8');
        } catch (_) {
          testName = 'Practice Test';
        }
      } else {
        testName = testId;
      }
    }

    // Find all results matching this test
    const testMatchConditions = [];
    if (testDoc) {
      testMatchConditions.push({ test_id: testDoc._id });
      testMatchConditions.push({ test_name: testDoc.title });
    } else {
      if (mongoose.Types.ObjectId.isValid(testId)) {
        testMatchConditions.push({ test_id: testId });
      }
      testMatchConditions.push({ test_name: testName });
    }

    const allResults = await Result.find({ $or: testMatchConditions }).sort({ submitted_at: -1 }).lean().catch(() => []);

    // Group attempts by student
    const studentAttemptsMap = new Map();
    for (const r of allResults) {
      const studentKey = String(r.sdms_student_id || r.student_id || r.user_id || '');
      if (!studentKey) continue;

      if (!studentAttemptsMap.has(studentKey)) {
        studentAttemptsMap.set(studentKey, []);
      }
      studentAttemptsMap.get(studentKey).push(r);
    }

    // Gather student directory / eligible audience
    let eligibleStudents = [];
    try {
      if (testDoc && testDoc.test_type === 'online_exam') {
        const audience = await sdmsService.getExamAudience(
          testDoc,
          scope.collegeIds || scope.collegeId,
          2000,
          scope.courseIds || scope.courseId
        );
        eligibleStudents = audience.students || [];
      } else {
        const filterOpts = {
          ...scope,
          page: 1,
          limit: 150,
          includePhoto: false
        };
        const rdsStudents = await sdmsService.getFilteredStudents(filterOpts);
        eligibleStudents = (rdsStudents.students || []).map(s => ({
          ...s,
          sdms_student_id: s.id || s.sdms_student_id
        }));
      }
    } catch (sdmsErr) {
      console.warn('SDMS fetch students in progress tracking fallback:', sdmsErr.message);
    }

    // Fallback: If SDMS returned no students (e.g. offline/isolated environment), use Student collection
    if (eligibleStudents.length === 0) {
      try {
        const localStudents = await Student.find({}).limit(100).lean().catch(() => []);
        eligibleStudents = localStudents.map(s => ({
          sdms_student_id: s.student_id || s._id,
          name: s.name,
          email: s.email,
          roll_number: s.roll_number || s.student_id,
          college_id: s.college_id,
          course_id: s.course_id
        }));
      } catch (_) {}
    }

    // Build attempted students list
    const attempted_students = [];
    const seenAttemptedStudentKeys = new Set();

    for (const [studentKey, attempts] of studentAttemptsMap.entries()) {
      seenAttemptedStudentKeys.add(studentKey);
      
      const latestAttempt = attempts[0];
      const scores = attempts.map(a => Number(a.percentage ?? a.score ?? 0));
      const latestScore = Number(latestAttempt.percentage ?? latestAttempt.score ?? 0);
      const highestScore = Math.max(...scores, 0);

      const studentMatch = eligibleStudents.find(
        s => String(s.sdms_student_id || s.id) === studentKey
      );

      // Enforce RBAC scope if scope is set and student college/course is known
      if (scope.collegeId && studentMatch && studentMatch.college_id && Number(studentMatch.college_id) !== Number(scope.collegeId)) {
        continue;
      }
      if (scope.courseId && studentMatch && studentMatch.course_id && Number(studentMatch.course_id) !== Number(scope.courseId)) {
        continue;
      }

      attempted_students.push({
        student_id: studentKey,
        name: studentMatch?.name || studentMatch?.student_name || latestAttempt.student_name || 'Student',
        email: studentMatch?.email || latestAttempt.student_email || '',
        roll_number: studentMatch?.roll_number || studentMatch?.admission_number || latestAttempt.student_roll_number || `STD-${studentKey}`,
        latest_score: latestScore,
        highest_score: highestScore,
        total_attempts: attempts.length,
        has_attempted: true
      });
    }

    // Build unattempted students list
    const unattempted_students = [];
    for (const s of eligibleStudents) {
      const sKey = String(s.sdms_student_id || s.id);
      if (seenAttemptedStudentKeys.has(sKey)) continue;

      unattempted_students.push({
        student_id: sKey,
        name: s.name || s.student_name || 'Student',
        email: s.email || '',
        roll_number: s.roll_number || s.admission_number || s.pin_no || `STD-${sKey}`,
        latest_score: null,
        highest_score: null,
        total_attempts: 0,
        has_attempted: false
      });
    }

    const scores = attempted_students.map(s => s.latest_score).filter(s => typeof s === 'number' && !isNaN(s));
    const average_score = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0;
    const highest_score = scores.length ? Math.max(...scores) : 0;

    const summary = {
      attempted_count: attempted_students.length,
      unattempted_count: unattempted_students.length,
      total_assigned: attempted_students.length + unattempted_students.length,
      average_score,
      highest_score,
      completion_rate: (attempted_students.length + unattempted_students.length) > 0
        ? Math.round((attempted_students.length / (attempted_students.length + unattempted_students.length)) * 100)
        : 0
    };

    return res.json({
      success: true,
      data: {
        test: {
          test_id: testId,
          test_name: testName,
          subcategory,
          module_id: moduleId,
          total_questions: totalQuestions
        },
        summary,
        attempted_students,
        unattempted_students
      }
    });
  } catch (error) {
    console.error('Error in getTestAssignedStudents:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /student-test-progress/:studentId/:testId
 * Returns all attempt history and summary metrics for a student on a specific test
 */
exports.getStudentTestProgress = async (req, res) => {
  try {
    const { studentId, testId } = req.params;

    // Resolve test details
    let testDoc = null;
    let testName = '';
    let subcategory = 'Practice Test';

    if (mongoose.Types.ObjectId.isValid(testId)) {
      testDoc = await Test.findById(testId).lean().catch(() => null);
    }
    if (testDoc) {
      testName = testDoc.title;
      subcategory = testDoc.subcategory || 'Practice Test';
    } else if (testId && testId.startsWith('synth_')) {
      try {
        testName = Buffer.from(testId.replace('synth_', ''), 'base64url').toString('utf8');
      } catch (_) {
        testName = 'Practice Test';
      }
    } else {
      testName = testId;
    }

    // Resolve student info
    let studentInfo = null;
    const numId = Number(studentId);
    if (Number.isSafeInteger(numId) && numId > 0) {
      try {
        studentInfo = await sdmsService.getStudentIdentityById(numId);
      } catch (_) {}
    }
    if (!studentInfo && mongoose.Types.ObjectId.isValid(studentId)) {
      studentInfo = await Student.findById(studentId).lean().catch(() => null);
    }

    // Query Result for all attempts
    const studentQueries = [];
    if (Number.isSafeInteger(numId) && numId > 0) {
      studentQueries.push({ sdms_student_id: numId });
    }
    studentQueries.push({ student_id: String(studentId) });
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      studentQueries.push({ student_id: studentId }, { user_id: studentId });
    }

    const testQueries = [];
    if (testDoc) {
      testQueries.push({ test_id: testDoc._id });
      testQueries.push({ test_name: testDoc.title });
    } else {
      if (mongoose.Types.ObjectId.isValid(testId)) {
        testQueries.push({ test_id: testId });
      }
      testQueries.push({ test_name: testName });
    }

    const results = await Result.find({
      $and: [
        { $or: studentQueries },
        { $or: testQueries }
      ]
    }).sort({ submitted_at: 1 }).lean().catch(() => []);

    const attempts = results.map((r) => ({
      attempt_id: String(r._id),
      score: Number(r.percentage ?? r.score ?? 0),
      submitted_at: r.submitted_at,
      correct_answers: r.correct_answers || 0,
      total_questions: r.total_questions || (Array.isArray(r.answers) ? r.answers.length : 20),
      time_taken_ms: r.time_taken_ms || (r.duration ? r.duration * 60000 : 0)
    }));

    const scores = attempts.map(a => a.score);
    const highestScore = scores.length ? Math.max(...scores) : 0;
    const latestScore = scores.length ? scores[scores.length - 1] : 0;
    const averageScore = scores.length
      ? Math.round((scores.reduce((sum, s) => sum + s, 0) / scores.length) * 10) / 10
      : 0;

    const firstResult = results[0];

    return res.json({
      success: true,
      data: {
        student: {
          student_id: String(studentId),
          name: studentInfo?.name || studentInfo?.student_name || firstResult?.student_name || 'Student',
          email: studentInfo?.email || firstResult?.student_email || '',
          roll_number: studentInfo?.roll_number || studentInfo?.admission_number || firstResult?.student_roll_number || `STD-${studentId}`
        },
        test: {
          test_id: testId,
          test_name: testName,
          subcategory
        },
        summary: {
          total_attempts: attempts.length,
          highest_score: highestScore,
          average_score: averageScore,
          latest_score: latestScore
        },
        attempts
      }
    });
  } catch (error) {
    console.error('Error in getStudentTestProgress:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /practice-attempt-details/:attemptId
 * Returns question-by-question breakdown for an attempt
 */
exports.getPracticeAttemptDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ success: false, message: 'Invalid attempt ID' });
    }

    const result = await Result.findById(attemptId).lean();
    if (!result) {
      return res.status(404).json({ success: false, message: 'Attempt not found' });
    }

    const answers = Array.isArray(result.answers) ? result.answers : [];
    const detailed_results = await Promise.all(answers.map(async (ans, idx) => {
      const qObj = ans && typeof ans === 'object' ? { ...ans } : { answer: ans };
      const rawAudio = qObj.student_audio_url || qObj.audio_url || (answers.length === 1 ? result.speaking_audio_url : '') || '';
      let presigned = '';
      if (rawAudio && s3Service && typeof s3Service.getPresignedDownloadUrl === 'function' && !rawAudio.startsWith('data:') && !rawAudio.startsWith('/uploads')) {
        try {
          presigned = await s3Service.getPresignedDownloadUrl(rawAudio);
        } catch (_) {}
      }
      const qType = qObj.question_type || (rawAudio ? 'speaking' : 'mcq');
      return {
        ...qObj,
        question_number: idx + 1,
        question_text: qObj.question_text || qObj.question || qObj.text || `Question ${idx + 1}`,
        question_type: qType,
        student_answer: qObj.student_text || qObj.selected_answer || qObj.student_answer || qObj.user_answer || qObj.answer || 'No answer provided',
        student_text: qObj.student_text || qObj.student_answer || '',
        correct_answer: qObj.original_text || qObj.correct_answer || qObj.expected_answer || 'N/A',
        original_text: qObj.original_text || qObj.correct_answer || '',
        is_correct: Boolean(qObj.is_correct),
        explanation: qObj.explanation || '',
        similarity_score: typeof qObj.similarity_score === 'number' ? qObj.similarity_score : (qObj.overall_score || 0),
        student_audio_url: rawAudio,
        audio_url: rawAudio,
        speaking_audio_url: result.speaking_audio_url || rawAudio,
        audio_presigned_url: presigned || rawAudio
      };
    }));

    const timeMinutes = result.time_taken_ms
      ? Math.round(result.time_taken_ms / 60000)
      : (result.duration || 0);

    const attempt = {
      attempt_id: String(result._id),
      total_questions: result.total_questions || detailed_results.length,
      correct_answers: result.correct_answers ?? detailed_results.filter(q => q.is_correct).length,
      time_taken: `${timeMinutes}m`,
      score: Number(result.percentage ?? result.score ?? 0),
      speaking_audio_url: result.speaking_audio_url || '',
      submitted_at: result.submitted_at
    };

    return res.json({
      success: true,
      data: {
        attempt,
        detailed_results
      }
    });
  } catch (error) {
    console.error('Error in getPracticeAttemptDetails:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

