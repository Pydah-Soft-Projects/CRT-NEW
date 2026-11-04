const User = require('../models/User');
const Batch = require('../models/Batch');
const Test = require('../models/Test');
const Result = require('../models/Result');
const sdmsService = require('../services/sdms.service');
const { testIncludesSdmsScope } = require('../services/sdmsTestScope.service');

exports.getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const [colleges, courses] = await Promise.all([
      sdmsService.getColleges().catch(() => []),
      sdmsService.getCourses().catch(() => [])
    ]);
    const totalBatches = await Batch.countDocuments();

    return res.json({
      success: true,
      data: {
        totalUsers,
        totalCampuses: colleges.length,
        totalCourses: courses.length,
        totalBatches,
        systemHealth: '100%'
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const cleanIds = (arr, single) => {
      let list = [];
      if (Array.isArray(arr)) list = arr.map(Number).filter(n => Number.isSafeInteger(n) && n > 0);
      if (list.length === 0 && single !== null && single !== undefined && single !== '' && single !== 'null') {
        const n = Number(single);
        if (Number.isSafeInteger(n) && n > 0) list = [n];
      }
      return list;
    };

    const scope = req.sdmsScope || {};
    const collegeIds = scope.collegeIds || cleanIds(req.user?.sdms_college_ids, req.user?.sdms_college_id);
    const courseIds = scope.courseIds || cleanIds(req.user?.sdms_course_ids, req.user?.sdms_course_id);
    const branchIds = scope.branchIds || cleanIds(req.user?.sdms_branch_ids, req.user?.sdms_branch_id);
    const years = scope.years || cleanIds(req.user?.sdms_years, req.user?.sdms_year);
    const isScoped = req.user?.role !== 'superadmin' && (collegeIds.length > 0 || courseIds.length > 0 || branchIds.length > 0 || years.length > 0);

    // Resolve human-readable labels from SDMS catalog
    let collegeNames = [];
    let courseNames = [];
    let branchNames = [];
    const yearLabels = years.map(y => `${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year`);

    try {
      const catalog = await sdmsService.getAcademicCatalog().catch(() => null);
      if (catalog) {
        if (collegeIds.length > 0) {
          collegeNames = collegeIds.map(id => catalog.collegesById.get(id)?.name).filter(Boolean);
        }
        if (courseIds.length > 0) {
          courseNames = courseIds.map(id => catalog.coursesById.get(id)?.name).filter(Boolean);
        }
        if (branchIds.length > 0) {
          branchNames = branchIds.map(id => catalog.branchesById.get(id)?.name).filter(Boolean);
        }
      }
    } catch (e) {
      console.warn('Catalog lookup error in dashboard:', e.message);
    }

    // Scoped student count
    const studentFilters = {
      collegeId: collegeIds.length ? collegeIds : null,
      courseId: courseIds.length ? courseIds : null,
      branchId: branchIds.length ? branchIds : null,
      year: years.length ? years : null,
      page: 1,
      limit: 1,
      includePhoto: false
    };

    const [totalUsers, totalBatches, studentRes, allTests] = await Promise.all([
      User.countDocuments().catch(() => 0),
      Batch.countDocuments().catch(() => 0),
      sdmsService.getFilteredStudents(studentFilters).catch(() => ({ pagination: { total: 0 } })),
      Test.find().sort({ created_at: -1 }).lean().catch(() => [])
    ]);

    const totalStudents = studentRes.pagination?.total || 0;

    // Filter tests by user access scope
    const visibleTests = isScoped
      ? allTests.filter(t => testIncludesSdmsScope(t, { collegeIds, courseIds, branchIds, years }))
      : allTests;

    const activeExams = visibleTests.filter(t => t.test_type === 'online_exam');
    const practiceTests = visibleTests.filter(t => t.test_type === 'practice' || t.category === 'practice');

    // Recent results & performance statistics
    const visibleTestIds = visibleTests.map(t => t._id);
    let resultQuery = {};
    if (isScoped) {
      resultQuery.test_id = { $in: visibleTestIds.length > 0 ? visibleTestIds : [null] };
    }

    const [totalAttempts, recentResults] = await Promise.all([
      Result.countDocuments(resultQuery).catch(() => 0),
      Result.find(resultQuery).sort({ submitted_at: -1 }).limit(10).lean().catch(() => [])
    ]);

    // Calculate score metrics
    let averageScore = 0;
    let passCount = 0;
    const scoreDistribution = {
      excellent: 0,
      good: 0,
      average: 0,
      needs_improvement: 0
    };

    if (recentResults.length > 0) {
      const sum = recentResults.reduce((acc, r) => acc + (r.percentage ?? r.score ?? 0), 0);
      averageScore = Math.round((sum / recentResults.length) * 10) / 10;
      recentResults.forEach(r => {
        const pct = r.percentage ?? r.score ?? 0;
        if (pct >= 40) passCount++;
        if (pct >= 75) scoreDistribution.excellent++;
        else if (pct >= 60) scoreDistribution.good++;
        else if (pct >= 40) scoreDistribution.average++;
        else scoreDistribution.needs_improvement++;
      });
    }
    const passRate = recentResults.length > 0 ? Math.round((passCount / recentResults.length) * 100) : 0;

    // Shape recent attempts
    const shapedRecentAttempts = recentResults.map(r => ({
      _id: r._id,
      student_id: r.sdms_student_id || r.student_id,
      roll_number: r.student_roll_number || r.roll_number || (r.sdms_student_id ? `STD-${r.sdms_student_id}` : 'Student'),
      student_name: r.student_name || 'Student',
      test_name: r.test_name || 'Online Exam',
      test_type: r.test_type || 'Exam',
      score: r.score ?? 0,
      percentage: r.percentage ?? r.score ?? 0,
      status: (r.percentage ?? r.score ?? 0) >= 40 ? 'Passed' : 'Needs Review',
      submitted_at: r.submitted_at
    }));

    // Active tests summary
    const shapedActiveTests = visibleTests.slice(0, 5).map(t => ({
      _id: t._id,
      title: t.title || 'Untitled Test',
      test_type: t.test_type || 'online_exam',
      category: t.category || 'CRT',
      duration: t.duration || 60,
      question_count: Array.isArray(t.questions) ? t.questions.length : 0,
      start_date: t.start_date,
      end_date: t.end_date,
      target_colleges: t.target_college_ids || [],
      target_courses: t.target_course_ids || [],
      is_active: t.status === 'active' || t.is_active !== false
    }));

    // Scope Summary description
    let scopeSummary = 'Global Scope (All Campuses & Programs)';
    if (isScoped) {
      const parts = [];
      if (collegeNames.length > 0) parts.push(collegeNames.join(', '));
      if (courseNames.length > 0) parts.push(courseNames.join(', '));
      if (branchNames.length > 0) parts.push(branchNames.join(', '));
      if (yearLabels.length > 0) parts.push(yearLabels.join(', '));
      scopeSummary = parts.length > 0 ? parts.join(' • ') : 'Custom Institutional Scope';
    }

    return res.json({
      success: true,
      data: {
        role: req.user?.role || 'superadmin',
        isScoped,
        scopeInfo: {
          isScoped,
          scopeSummary,
          collegeNames,
          courseNames,
          branchNames,
          yearLabels,
          collegeIds,
          courseIds,
          branchIds,
          years
        },
        statistics: {
          total_students: totalStudents,
          total_tests: visibleTests.length,
          total_batches: totalBatches,
          total_attempts: totalAttempts,
          average_score: averageScore,
          pass_rate: passRate,
          active_exams: activeExams.length,
          practice_modules: practiceTests.length
        },
        totalUsers,
        totalCampuses: collegeNames.length || 1,
        totalCourses: courseNames.length || 1,
        totalBatches,
        totalStudents,
        totalTests: visibleTests.length,
        activeStudents: totalStudents,
        activeExamsCount: activeExams.length,
        practiceTestsCount: practiceTests.length,
        averageScore,
        passRate,
        scoreDistribution,
        recentAttempts: shapedRecentAttempts,
        activeTests: shapedActiveTests,
        systemHealth: '100%'
      }
    });
  } catch (error) {
    console.error('getDashboard error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGlobalFeatures = async (req, res) => {
  const role = req.params.role || req.user?.role || 'superadmin';
  return res.json({
    success: true,
    data: {
      role,
      features: {
        dashboard: { name: 'Dashboard', enabled: true, required: true },
        practice_tests: { name: 'Practice Tests', enabled: true, required: true },
        crt_modules: { name: 'CRT Modules', enabled: true, required: true },
        online_tests: { name: 'Online Tests', enabled: true, required: true },
        progress_tracking: { name: 'Progress Tracking', enabled: true, required: true },
        test_history: { name: 'Test History', enabled: true, required: true },
        profile: { name: 'Profile', enabled: true, required: true },
        test_taking: { name: 'Test Taking', enabled: true, required: true },
        speaking_evaluation: { name: 'Speaking AI Evaluation', enabled: true, required: true },
        batch_management: { name: 'Batch Management', enabled: true, required: false }
      }
    }
  });
};

exports.getCampuses = async (req, res) => {
  try {
    const colleges = await sdmsService.getColleges();
    return res.json({ success: true, source: 'rds', read_only: true, data: colleges });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCampus = async (req, res) => {
  return res.status(409).json({ success: false, message: 'Campus records are read-only and managed by SDMS.' });
};

exports.updateCampus = async (req, res) => {
  return res.status(409).json({ success: false, message: 'Campus records are read-only and managed by SDMS.' });
};

exports.deleteCampus = async (req, res) => {
  return res.status(409).json({ success: false, message: 'Campus records are read-only and managed by SDMS.' });
};

exports.getCourses = async (req, res) => {
  try {
    const { campusId } = req.params;
    const courses = await sdmsService.getCourses(campusId);
    return res.json({ success: true, source: 'rds', read_only: true, data: courses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createCourse = async (req, res) => {
  return res.status(409).json({ success: false, message: 'Course records are read-only and managed by SDMS.' });
};
