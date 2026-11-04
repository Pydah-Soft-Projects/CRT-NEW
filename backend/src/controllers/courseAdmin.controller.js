const Result = require('../models/Result');
const Test = require('../models/Test');
const sdmsService = require('../services/sdms.service');

const MAX_STUDENTS = 5000;

const getScope = (req) => {
  const scope = req.sdmsScope || {};
  return {
    collegeId: scope.collegeId || null,
    collegeIds: scope.collegeIds || null,
    courseId: scope.courseId || null,
    courseIds: scope.courseIds || null,
    branchId: scope.branchId || null,
    branchIds: scope.branchIds || null,
    year: scope.year || null,
    years: scope.years || null
  };
};

const getScopedStudents = async (req) => {
  return sdmsService.getAllFilteredStudents({
    ...getScope(req),
    includePhoto: false
  }, MAX_STUDENTS);
};

const getScopedTestFilter = (req) => {
  const scope = getScope(req);
  const filter = { status: 'active' };
  const andConditions = [];

  const colIds = scope.collegeIds || (scope.collegeId ? [scope.collegeId] : null);
  if (colIds && colIds.length) {
    andConditions.push({
      $or: [
        { target_college_ids: { $in: colIds.map(Number) } },
        { target_college_ids: { $size: 0 } },
        { target_college_ids: { $exists: false } }
      ]
    });
  }

  const courseIds = scope.courseIds || (scope.courseId ? [scope.courseId] : null);
  if (courseIds && courseIds.length) {
    andConditions.push({
      $or: [
        { target_course_ids: { $in: courseIds.map(Number) } },
        { target_course_ids: { $size: 0 } },
        { target_course_ids: { $exists: false } }
      ]
    });
  }

  const branchIds = scope.branchIds || (scope.branchId ? [scope.branchId] : null);
  if (branchIds && branchIds.length) {
    andConditions.push({
      $or: [
        { target_branch_ids: { $in: branchIds.map(Number) } },
        { target_branch_ids: { $size: 0 } },
        { target_branch_ids: { $exists: false } }
      ]
    });
  }

  const years = scope.years || (scope.year ? [scope.year] : null);
  if (years && years.length) {
    andConditions.push({
      $or: [
        { target_years: { $in: years.map(Number) } },
        { target_years: { $size: 0 } },
        { target_years: { $exists: false } }
      ]
    });
  }

  if (andConditions.length) filter.$and = andConditions;
  return filter;
};

exports.getCourseDashboard = async (req, res) => {
  try {
    const scope = getScope(req);
    const testFilter = getScopedTestFilter(req);
    const [students, totalTests, matchingTests] = await Promise.all([
      sdmsService.getFilteredStudents({
        ...scope,
        page: 1,
        limit: 1,
        includePhoto: false
      }),
      Test.countDocuments(testFilter),
      Test.find(testFilter).sort({ created_at: -1 }).limit(10).lean().catch(() => [])
    ]);

    const testIds = matchingTests.map(t => t._id);
    const [totalAttempts, recentResults] = await Promise.all([
      Result.countDocuments({ test_id: { $in: testIds.length ? testIds : [null] } }).catch(() => 0),
      Result.find({ test_id: { $in: testIds.length ? testIds : [null] } }).sort({ submitted_at: -1 }).limit(10).lean().catch(() => [])
    ]);

    let averageScore = 0;
    if (recentResults.length > 0) {
      const sum = recentResults.reduce((acc, r) => acc + (r.percentage ?? r.score ?? 0), 0);
      averageScore = Math.round((sum / recentResults.length) * 10) / 10;
    }

    const shapedRecentAttempts = recentResults.map(r => ({
      _id: r._id,
      student_id: r.sdms_student_id,
      roll_number: r.student_roll_number || (r.sdms_student_id ? `STD-${r.sdms_student_id}` : 'Student'),
      student_name: r.student_name || 'Student',
      test_name: r.test_name || 'Course Exam',
      percentage: r.percentage ?? r.score ?? 0,
      submitted_at: r.submitted_at
    }));

    return res.json({
      success: true,
      data: {
        totalStudents: students.pagination?.total || 0,
        totalTests,
        totalBatches: 0,
        activeModules: ['listening', 'speaking', 'reading', 'writing'],
        avgProgress: averageScore,
        averageScore,
        totalAttempts,
        recentAttempts: shapedRecentAttempts,
        statistics: {
          total_students: students.pagination?.total || 0,
          total_tests: totalTests,
          total_batches: 0,
          total_attempts: totalAttempts,
          average_score: averageScore
        }
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStudentProgress = async (req, res) => {
  try {
    const result = await sdmsService.getFilteredStudents({
      ...getScope(req),
      page: req.query.page,
      limit: req.query.limit || 50,
      search: req.query.search,
      includePhoto: false
    });
    return res.json({
      success: true,
      source: 'rds',
      read_only: true,
      data: result.students,
      pagination: result.pagination
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getScopedResults = async (req, testType) => {
  const { students, total, truncated } = await getScopedStudents(req);
  const studentById = new Map(students.map((student) => [Number(student.sdms_student_id), student]));
  const studentIds = [...studentById.keys()];
  if (!studentIds.length) return { results: [], truncated };

  const filter = { sdms_student_id: { $in: studentIds } };
  if (testType === 'online_exam') filter.test_type = testType;
  else filter.test_type = { $ne: 'online_exam' };

  const results = await Result.find(filter)
    .sort({ submitted_at: -1 })
    .limit(1000)
    .lean();
  return {
    results: results.map((result) => {
      const student = studentById.get(Number(result.sdms_student_id));
      return {
        ...result,
        student_id: String(result.sdms_student_id),
        student_name: student?.name || 'Student',
        student_email: student?.email || '',
        roll_number: student?.roll_number || '',
        batch_name: student?.batch_name || '',
        module_name: result.module_id,
        score: result.percentage ?? result.score ?? 0
      };
    }),
    truncated: truncated || total > students.length || results.length === 1000
  };
};

exports.getStudentPracticeResults = async (req, res) => {
  try {
    const result = await getScopedResults(req, 'practice');
    return res.json({ success: true, source: 'rds', data: result.results, truncated: result.truncated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStudentOnlineResults = async (req, res) => {
  try {
    const result = await getScopedResults(req, 'online_exam');
    return res.json({ success: true, source: 'rds', data: result.results, truncated: result.truncated });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
