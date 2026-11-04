const sdmsService = require('../services/sdms.service');

const getAcademicFilters = (req) => {
  const getParam = (...names) => {
    for (const name of names) {
      if (req.query && req.query[name] !== undefined && req.query[name] !== '' && req.query[name] !== 'all') return req.query[name];
      if (req.body && req.body[name] !== undefined && req.body[name] !== '' && req.body[name] !== 'all') return req.body[name];
    }
    return null;
  };

  const cleanList = (val) => {
    if (val === null || val === undefined || val === '' || val === 'all') return [];
    if (Array.isArray(val)) return val.map(Number).filter(n => Number.isSafeInteger(n) && n > 0);
    if (typeof val === 'string') return val.split(',').map(s => Number(s.trim())).filter(n => Number.isSafeInteger(n) && n > 0);
    const n = Number(val);
    return Number.isSafeInteger(n) && n > 0 ? [n] : [];
  };

  const scope = req.sdmsScope || {};

  // Colleges
  const requestedColleges = cleanList(getParam('college_ids', 'college_id', 'target_college_ids', 'campus_id', 'campus_ids'));
  const scopedColleges = cleanList(scope.collegeIds || scope.collegeId);
  let effectiveCollege = null;
  if (scopedColleges.length > 0) {
    if (requestedColleges.length > 0) {
      const allowed = requestedColleges.filter(id => scopedColleges.includes(id));
      effectiveCollege = allowed.length > 0 ? allowed : scopedColleges;
    } else {
      effectiveCollege = scopedColleges;
    }
  } else {
    effectiveCollege = requestedColleges.length > 0 ? requestedColleges : null;
  }

  // Courses
  const requestedCourses = cleanList(getParam('course_ids', 'course_id', 'target_course_ids'));
  const scopedCourses = cleanList(scope.courseIds || scope.courseId);
  let effectiveCourse = null;
  if (scopedCourses.length > 0) {
    if (requestedCourses.length > 0) {
      const allowed = requestedCourses.filter(id => scopedCourses.includes(id));
      effectiveCourse = allowed.length > 0 ? allowed : scopedCourses;
    } else {
      effectiveCourse = scopedCourses;
    }
  } else {
    effectiveCourse = requestedCourses.length > 0 ? requestedCourses : null;
  }

  // Branches
  const requestedBranches = cleanList(getParam('branch_ids', 'branch_id', 'target_branch_ids'));
  const scopedBranches = cleanList(scope.branchIds || scope.branchId);
  let effectiveBranch = null;
  if (scopedBranches.length > 0) {
    if (requestedBranches.length > 0) {
      const allowed = requestedBranches.filter(id => scopedBranches.includes(id));
      effectiveBranch = allowed.length > 0 ? allowed : scopedBranches;
    } else {
      effectiveBranch = scopedBranches;
    }
  } else {
    effectiveBranch = requestedBranches.length > 0 ? requestedBranches : null;
  }

  // Years
  const requestedYears = cleanList(getParam('years', 'year', 'target_years', 'current_year'));
  const scopedYears = cleanList(scope.years || scope.year);
  let effectiveYear = null;
  if (scopedYears.length > 0) {
    if (requestedYears.length > 0) {
      const allowed = requestedYears.filter(id => scopedYears.includes(id));
      effectiveYear = allowed.length > 0 ? allowed : scopedYears;
    } else {
      effectiveYear = scopedYears;
    }
  } else {
    effectiveYear = requestedYears.length > 0 ? requestedYears : null;
  }

  return {
    collegeId: effectiveCollege,
    courseId: effectiveCourse,
    branchId: effectiveBranch,
    year: effectiveYear,
    semester: getParam('semesters', 'semester', 'target_semesters', 'current_semester'),
    section: getParam('sections', 'section', 'target_sections'),
    search: req.query.search || req.body?.search || null
  };
};

exports.getColleges = async (req, res) => {
  try {
    let colleges = await sdmsService.getColleges();
    const scopeColIds = req.sdmsScope?.collegeIds || (req.sdmsScope?.collegeId ? [req.sdmsScope.collegeId] : null);
    if (scopeColIds && scopeColIds.length > 0) {
      const allowed = new Set(scopeColIds.map(Number));
      colleges = colleges.filter((college) => allowed.has(Number(college.id)));
    } else if (req.sdmsScope?.courseIds || req.sdmsScope?.courseId) {
      const courseIds = req.sdmsScope.courseIds || [req.sdmsScope.courseId];
      const courses = await sdmsService.getCourses();
      const collegeIds = new Set(
        courses
          .filter((course) => courseIds.map(Number).includes(Number(course.id)))
          .map((course) => Number(course.college_id))
      );
      colleges = colleges.filter((college) => collegeIds.has(Number(college.id)));
    }
    return res.json({
      success: true,
      source: 'rds',
      read_only: true,
      data: colleges
    });
  } catch (error) {
    console.error('SDMS getColleges Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const filters = getAcademicFilters(req);
    let courses = await sdmsService.getCourses(filters.collegeId);
    const scopeCourseIds = req.sdmsScope?.courseIds || (req.sdmsScope?.courseId ? [req.sdmsScope.courseId] : null);
    if (scopeCourseIds && scopeCourseIds.length > 0) {
      const allowed = new Set(scopeCourseIds.map(Number));
      courses = courses.filter((course) => allowed.has(Number(course.id)));
    }
    return res.json({
      success: true,
      source: 'rds',
      read_only: true,
      data: courses
    });
  } catch (error) {
    console.error('SDMS getCourses Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getBranches = async (req, res) => {
  try {
    const filters = getAcademicFilters(req);
    let branches = await sdmsService.getBranches(filters.collegeId, filters.courseId);
    const scopeBranchIds = req.sdmsScope?.branchIds || (req.sdmsScope?.branchId ? [req.sdmsScope.branchId] : null);
    if (scopeBranchIds && scopeBranchIds.length > 0) {
      const allowed = new Set(scopeBranchIds.map(Number));
      branches = branches.filter((branch) => allowed.has(Number(branch.id)));
    }
    return res.json({
      success: true,
      source: 'rds',
      read_only: true,
      data: branches
    });
  } catch (error) {
    console.error('SDMS getBranches Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getYears = async (req, res) => {
  try {
    const filters = getAcademicFilters(req);
    let years = await sdmsService.getYears(filters.collegeId, filters.courseId, filters.branchId);
    const scopeYears = req.sdmsScope?.years || (req.sdmsScope?.year ? [req.sdmsScope.year] : null);
    if (scopeYears && scopeYears.length > 0) {
      const allowed = new Set(scopeYears.map(Number));
      years = years.filter((yr) => allowed.has(Number(yr)));
    }
    return res.json({
      success: true,
      source: 'rds',
      read_only: true,
      data: years
    });
  } catch (error) {
    console.error('SDMS getYears Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSemesters = async (req, res) => {
  try {
    const filters = getAcademicFilters(req);
    const semesters = await sdmsService.getSemesters(
      filters.collegeId,
      filters.courseId,
      filters.branchId,
      filters.year
    );
    return res.json({
      success: true,
      source: 'rds',
      read_only: true,
      data: semesters
    });
  } catch (error) {
    console.error('SDMS getSemesters Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSections = async (req, res) => {
  try {
    const filters = getAcademicFilters(req);
    const sections = await sdmsService.getSections(
      filters.collegeId,
      filters.courseId,
      filters.branchId,
      filters.year,
      filters.semester
    );
    return res.json({
      success: true,
      source: 'rds',
      read_only: true,
      data: sections
    });
  } catch (error) {
    console.error('SDMS getSections Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const filters = getAcademicFilters(req);
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const result = await sdmsService.getFilteredStudents({
      ...filters,
      page,
      limit,
      includePhoto: req.query.include_photo !== 'false'
    });

    return res.json({
      success: true,
      source: 'rds',
      read_only: true,
      data: result.students,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('SDMS getStudents Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportStudentsCsv = async (req, res) => {
  try {
    const filters = getAcademicFilters(req);

    const result = await sdmsService.getAllFilteredStudents({
      ...filters,
      includePhoto: false
    });

    const students = result.students || [];
    const headers = ['ID', 'PIN / Roll No', 'Admission No', 'Name', 'Email', 'Mobile', 'College', 'Course', 'Branch', 'Year', 'Semester', 'Section', 'Status'];
    const rows = students.map(s => [
      `"${s.id || ''}"`,
      `"${s.roll_number || s.pin_no || ''}"`,
      `"${s.admission_number || ''}"`,
      `"${(s.name || '').replace(/"/g, '""')}"`,
      `"${s.email || ''}"`,
      `"${s.mobile_number || ''}"`,
      `"${(s.college_name || '').replace(/"/g, '""')}"`,
      `"${(s.course_name || '').replace(/"/g, '""')}"`,
      `"${(s.branch_name || '').replace(/"/g, '""')}"`,
      `"${s.year || ''}"`,
      `"${s.semester || ''}"`,
      `"${s.section || ''}"`,
      `"${s.status || 'active'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="sdms_students.csv"');
    return res.send(csvContent);
  } catch (error) {
    console.error('SDMS Export CSV Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.exportSingleStudentCsv = async (req, res) => {
  try {
    const { studentId } = req.params;
    if (!/^\d+$/.test(studentId) || Number(studentId) <= 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    const student = await sdmsService.getStudentIdentityById(studentId);
    if (
      !student ||
      (req.sdmsScope?.collegeId && student.college_id !== req.sdmsScope.collegeId) ||
      (req.sdmsScope?.courseId && student.course_id !== req.sdmsScope.courseId)
    ) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    const headers = ['ID', 'PIN / Roll No', 'Name', 'Email', 'Mobile', 'College', 'Course', 'Branch', 'Year', 'Semester', 'Section'];
    const row = [
      `"${student.id || ''}"`,
      `"${student.roll_number || ''}"`,
      `"${(student.name || '').replace(/"/g, '""')}"`,
      `"${student.email || ''}"`,
      `"${student.mobile_number || ''}"`,
      `"${(student.college_name || '').replace(/"/g, '""')}"`,
      `"${(student.course_name || '').replace(/"/g, '""')}"`,
      `"${(student.branch_name || '').replace(/"/g, '""')}"`,
      `"${student.year || ''}"`,
      `"${student.semester || ''}"`,
      `"${student.section || ''}"`
    ];

    const csvContent = [headers.join(','), row.join(',')].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${student.roll_number || 'student'}_details.csv"`);
    return res.send(csvContent);
  } catch (error) {
    console.error('SDMS Export Single Student Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get institutional academic validation rules (Colleges, Courses with durations, Branches, Semesters)
 */
exports.getAcademicValidationRules = async (req, res) => {
  try {
    const rules = await sdmsService.getAcademicValidationRules();
    return res.json({
      success: true,
      source: 'rds',
      data: rules
    });
  } catch (error) {
    console.error('SDMS getAcademicValidationRules Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Validate a single student payload against RDS academic rules
 */
exports.validateStudent = async (req, res) => {
  try {
    const studentData = req.body || {};
    const result = await sdmsService.validateStudentData(studentData);
    return res.json({
      success: true,
      isValid: result.isValid,
      errors: result.errors,
      data: result.normalizedData
    });
  } catch (error) {
    console.error('SDMS validateStudent Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Bulk validate student rows
 */
exports.validateStudentsBulk = async (req, res) => {
  try {
    const students = Array.isArray(req.body) ? req.body : (req.body.students || []);
    const result = await sdmsService.validateStudentUpload(students);
    return res.json(result);
  } catch (error) {
    console.error('SDMS validateStudentsBulk Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
