const Result = require('../models/Result');
const Test = require('../models/Test');
const sdmsService = require('../services/sdms.service');
const { testIncludesSdmsScope } = require('../services/sdmsTestScope.service');

const getReportingScope = (req) => {
  if (req.user.role === 'campus_admin' || req.user.role === 'course_admin') {
    return {
      collegeId: req.sdmsScope?.collegeId || req.user.sdms_college_id || null,
      courseId: req.sdmsScope?.courseId || req.user.sdms_course_id || null
    };
  }
  return {
    collegeId: req.query.college_id || req.query.campus_id || null,
    courseId: req.query.course_id || null
  };
};

const hasRequiredAssignment = (req, scope) => (
  (req.user.role !== 'campus_admin' || scope.collegeId) &&
  (req.user.role !== 'course_admin' || scope.courseId)
);

const studentMatchesTest = (student, test) => {
  const matches = (targets, actual) => (
    !targets?.length || (actual !== null && actual !== undefined && targets.map(Number).includes(Number(actual)))
  );
  return matches(test.target_college_ids, student.college_id) &&
    matches(test.target_course_ids, student.course_id) &&
    matches(test.target_branch_ids, student.branch_id) &&
    matches(test.target_years, student.year) &&
    matches(test.target_semesters, student.semester) &&
    (!test.target_sections?.length || test.target_sections.includes(String(student.section || '').trim())) &&
    !(test.target_campus_ids || []).length &&
    !(test.target_batch_ids || []).length;
};

const shapeAttempt = (result, test) => {
  const detailedResults = Array.isArray(result.answers) ? result.answers : [];
  return {
    ...result,
    test_name: result.test_name || test.title,
    score_percentage: result.percentage ?? result.score ?? 0,
    correct_answers: result.correct_answers ?? detailedResults.filter((answer) => answer.is_correct).length,
    total_questions: result.total_questions || detailedResults.length,
    time_taken: Math.round((result.time_taken_ms || 0) / 60000),
    detailed_results: detailedResults,
    end_time: result.submitted_at
  };
};

exports.getCampusDashboard = async (req, res) => {
  try {
    const scope = getReportingScope(req);
    if (!hasRequiredAssignment(req, scope)) {
      return res.status(403).json({ success: false, message: 'SDMS college assignment is required to view this dashboard.' });
    }
    const [students, totalBatches] = await Promise.all([
      sdmsService.getFilteredStudents({ ...scope, page: 1, limit: 1, includePhoto: false }),
      sdmsService.getBatchCount(scope.collegeId)
    ]);

    return res.json({
      success: true,
      data: {
        totalStudents: students.pagination.total,
        totalBatches,
        campusName: 'Campus Administration',
        activeExams: 0
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCampusReports = async (req, res) => {
  try {
    const scope = getReportingScope(req);
    if (!hasRequiredAssignment(req, scope)) {
      return res.status(403).json({ success: false, message: 'SDMS organization assignment is required to view reports.' });
    }
    let resultFilter = {};
    if (scope.collegeId || scope.courseId) {
      const audience = await sdmsService.getAllFilteredStudents({
        ...scope,
        includePhoto: false,
        loginEnabledOnly: true
      }, 10000);
      resultFilter.sdms_student_id = {
        $in: audience.students.map((student) => student.sdms_student_id)
      };
    }
    let results = await Result.find(resultFilter).sort({ submitted_at: -1 }).limit(1000).lean();
    results = results.slice(0, 50);
    const averageScore = results.length
      ? Math.round((results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length) * 10) / 10
      : 0;

    return res.json({
      success: true,
      data: {
        results,
        averageScore,
        totalAttempts: results.length
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOnlineTestOverview = async (req, res) => {
  try {
    const scope = getReportingScope(req);
    if (!hasRequiredAssignment(req, scope)) {
      return res.status(403).json({ success: false, message: 'SDMS organization assignment is required to view reports.' });
    }

    const tests = await Test.find({ test_type: 'online_exam' }).sort({ created_at: -1 }).lean();
    const visibleTests = [];
    for (const test of tests) {
      if (testIncludesSdmsScope(test, scope)) {
        visibleTests.push(test);
      }
    }

    // Get all SDMS colleges, courses, and branches map for friendly display
    let collegeMap = {};
    let courseMap = {};
    let branchMap = {};
    try {
      const [colleges, courses, branches] = await Promise.all([
        sdmsService.getColleges().catch(() => []),
        sdmsService.getCourses().catch(() => []),
        sdmsService.getBranches().catch(() => [])
      ]);
      if (Array.isArray(colleges)) {
        colleges.forEach(c => { collegeMap[c.id] = c.name; });
      }
      if (Array.isArray(courses)) {
        courses.forEach(c => { courseMap[c.id] = c.name || c.code; });
      }
      if (Array.isArray(branches)) {
        branches.forEach(b => { branchMap[b.id] = b.code || b.name; });
      }
    } catch (e) {
      // Ignore lookup fetch errors
    }

    // Fetch all results for visible tests
    const testIds = visibleTests.map(t => t._id);
    const allResults = testIds.length ? await Result.find({ test_id: { $in: testIds } }).lean() : [];
    const resultsByTest = new Map();
    for (const r of allResults) {
      const tid = String(r.test_id);
      if (!resultsByTest.has(tid)) resultsByTest.set(tid, []);
      resultsByTest.get(tid).push(r);
    }

    // Format category helper
    const formatCategory = (test) => {
      if (test.subcategory) {
        const sub = test.subcategory
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
        return `${test.module_id || 'CRT'} - ${sub}`;
      }
      return test.module_id ? `${test.module_id} Online Test` : 'CRT Assessment';
    };

    const overviewData = await Promise.all(visibleTests.map(async (test) => {
      const tid = String(test._id);
      const results = resultsByTest.get(tid) || [];
      const totalAttempts = results.length;

      const scores = results
        .map(r => Number(r.score_percentage ?? r.percentage ?? r.score))
        .filter(s => typeof s === 'number' && !isNaN(s));

      const highestScore = scores.length ? Math.round(Math.max(...scores) * 10) / 10 : null;
      const averageScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;

      // Calculate assigned students from SDMS audience count
      let totalAssignedStudents = 0;
      try {
        totalAssignedStudents = await sdmsService.getExamAudienceCount(test, scope.collegeId, scope.courseId);
      } catch (e) {
        totalAssignedStudents = 0;
      }

      // Unique student attempts
      const uniqueStudentsAttempted = new Set(
        results.map(r => r.sdms_student_id || r.user_id).filter(Boolean)
      ).size;
      const pendingStudents = Math.max(0, totalAssignedStudents - uniqueStudentsAttempted);

      // College names display
      const targetCollegeIds = (test.target_college_ids || []).map(Number);
      const collegeNames = targetCollegeIds.length
        ? targetCollegeIds.map(id => collegeMap[id] || `College ${id}`)
        : (Array.isArray(test.target_colleges) && test.target_colleges.length ? test.target_colleges : ['All Colleges']);

      // Batch / Target audience details display
      const targetCourseIds = (test.target_course_ids || []).map(Number);
      const targetBranchIds = (test.target_branch_ids || []).map(Number);
      const targetYears = (test.target_years || []).map(Number);
      const targetSemesters = (test.target_semesters || []).map(Number);
      const targetSections = (test.target_sections || []).filter(Boolean);

      const batchParts = [];
      if (Array.isArray(test.target_batch_ids) && test.target_batch_ids.length > 0) {
        batchParts.push(...test.target_batch_ids.map(b => b.name || String(b)));
      }
      if (targetCourseIds.length > 0) {
        batchParts.push(...targetCourseIds.map(id => courseMap[id] || `Course ${id}`));
      }
      if (targetBranchIds.length > 0) {
        batchParts.push(...targetBranchIds.map(id => branchMap[id] || `Branch ${id}`));
      }
      if (targetYears.length > 0) {
        batchParts.push(`Year ${targetYears.join(', ')}`);
      }
      if (targetSemesters.length > 0) {
        batchParts.push(`Sem ${targetSemesters.join(', ')}`);
      }
      if (targetSections.length > 0) {
        batchParts.push(`Sec ${targetSections.join(', ')}`);
      }

      const batchNames = batchParts.length > 0 ? [batchParts.join(' - ')] : ['All Batches'];
      const batchIds = (test.target_batch_ids && test.target_batch_ids.length > 0)
        ? test.target_batch_ids.map(String)
        : (targetBranchIds.length > 0
          ? targetBranchIds.map(String)
          : (targetCourseIds.length > 0 ? targetCourseIds.map(String) : []));

      return {
        ...test,
        test_id: tid,
        test_name: test.title,
        module_name: test.module_id,
        category: formatCategory(test),
        question_count: Array.isArray(test.questions) ? test.questions.length : 0,
        campus_ids: targetCollegeIds.length ? targetCollegeIds.map(String) : ['all'],
        college_ids: targetCollegeIds,
        college_names: collegeNames,
        campus_names: collegeNames,
        batch_ids: batchIds,
        batch_names: batchNames,
        total_assigned_students: totalAssignedStudents,
        pending_students: pendingStudents,
        total_attempts: totalAttempts,
        highest_score: highestScore,
        average_score: averageScore
      };
    }));

    return res.json({ success: true, data: overviewData });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOnlineTestAttempts = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId).lean();
    if (!test) return res.status(404).json({ success: false, message: 'Test not found.' });

    const scope = getReportingScope(req);
    if (!hasRequiredAssignment(req, scope)) {
      return res.status(403).json({ success: false, message: 'SDMS organization assignment is required to view reports.' });
    }
    if (!testIncludesSdmsScope(test, scope)) {
      return res.status(403).json({ success: false, message: 'This test is outside your reporting scope.' });
    }

    const audience = await sdmsService.getExamAudience(test, scope.collegeId, 5000, scope.courseId);
    const students = audience.students;
    const studentIds = students.map((student) => student.sdms_student_id);
    const results = studentIds.length ? await Result.find({
      test_id: test._id,
      sdms_student_id: { $in: studentIds }
    }).sort({ submitted_at: -1 }).lean() : [];
    const resultsByStudent = new Map();
    for (const result of results) {
      const key = String(result.sdms_student_id);
      if (!resultsByStudent.has(key)) resultsByStudent.set(key, []);
      resultsByStudent.get(key).push(result);
    }

    const data = students.map((student) => {
      const attempts = resultsByStudent.get(String(student.sdms_student_id)) || [];
      const shapedAttempts = attempts.map((result) => shapeAttempt(result, test));
      const scores = shapedAttempts.map((attempt) => attempt.score_percentage);
      const attemptedTimes = shapedAttempts.map((attempt) => attempt.time_taken).filter(Number.isFinite);
      return {
        student_id: String(student.sdms_student_id),
        user_id: `sdms-${student.sdms_student_id}`,
        student_name: student.name || 'Student',
        student_email: student.email || '',
        email: student.email || '',
        roll_number: student.roll_number || '',
        campus_name: student.college_name || '',
        course_name: student.course_name || '',
        batch_name: student.batch_name || '',
        has_attempted: shapedAttempts.length > 0,
        attempt_count: shapedAttempts.length,
        highest_score: scores.length ? Math.max(...scores) : 0,
        average_score: scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0,
        average_time: attemptedTimes.length
          ? attemptedTimes.reduce((sum, time) => sum + time, 0) / attemptedTimes.length
          : 0,
        attempts: shapedAttempts
      };
    });
    return res.json({
      success: true,
      data,
      total_students: audience.total,
      truncated: audience.truncated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStudentOnlineTestAttempts = async (req, res) => {
  try {
    const test = await Test.findById(req.params.testId).lean();
    if (!test) return res.status(404).json({ success: false, message: 'Test not found.' });

    const scope = getReportingScope(req);
    if (!hasRequiredAssignment(req, scope)) {
      return res.status(403).json({ success: false, message: 'SDMS organization assignment is required to view reports.' });
    }
    if (!testIncludesSdmsScope(test, scope)) {
      return res.status(403).json({ success: false, message: 'This test is outside your reporting scope.' });
    }

    const sdmsStudentId = Number(req.params.studentId);
    if (!Number.isSafeInteger(sdmsStudentId) || sdmsStudentId <= 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    const student = await sdmsService.getStudentIdentityById(sdmsStudentId);
    if (
      !student ||
      (scope.collegeId && Number(student.college_id) !== Number(scope.collegeId)) ||
      (scope.courseId && Number(student.course_id) !== Number(scope.courseId))
    ) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    if (!studentMatchesTest(student, test)) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const results = await Result.find({
      test_id: test._id,
      sdms_student_id: student.id
    }).sort({ submitted_at: -1 }).lean();
    const data = results.map((result) => ({
      ...shapeAttempt(result, test),
      student_name: student.name || 'Student',
      student_email: student.email || '',
      roll_number: student.roll_number
    }));
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
