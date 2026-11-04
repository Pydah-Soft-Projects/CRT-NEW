const requireSdmsAssignment = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

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

  const collegeIds = cleanIds(req.user.sdms_college_ids, req.user.sdms_college_id);
  const courseIds = cleanIds(req.user.sdms_course_ids, req.user.sdms_course_id);
  const branchIds = cleanIds(req.user.sdms_branch_ids, req.user.sdms_branch_id);
  const years = cleanIds(req.user.sdms_years, req.user.sdms_year);

  const collegeId = collegeIds[0] || (req.user.sdms_college_id ? Number(req.user.sdms_college_id) : null);
  const courseId = courseIds[0] || (req.user.sdms_course_id ? Number(req.user.sdms_course_id) : null);
  const branchId = branchIds[0] || (req.user.sdms_branch_id ? Number(req.user.sdms_branch_id) : null);
  const year = years[0] || (req.user.sdms_year ? Number(req.user.sdms_year) : null);

  // Sync to user object so legacy code continues to work seamlessly
  req.user.sdms_college_id = collegeId;
  req.user.sdms_course_id = courseId;
  req.user.sdms_branch_id = branchId;
  req.user.sdms_year = year;
  req.user.sdms_college_ids = collegeIds;
  req.user.sdms_course_ids = courseIds;
  req.user.sdms_branch_ids = branchIds;
  req.user.sdms_years = years;

  if (req.user.role === 'campus_admin') {
    if (collegeIds.length === 0) {
      return res.status(403).json({ success: false, message: 'Assign an SDMS college before accessing student records.' });
    }
    req.sdmsScope = {
      collegeId,
      collegeIds: collegeIds.length > 0 ? collegeIds : null,
      courseId: courseId || null,
      courseIds: courseIds.length > 0 ? courseIds : null,
      branchId: branchId || null,
      branchIds: branchIds.length > 0 ? branchIds : null,
      year: year || null,
      years: years.length > 0 ? years : null
    };
  } else if (req.user.role === 'course_admin') {
    if (courseIds.length === 0) {
      return res.status(403).json({ success: false, message: 'Assign an SDMS course before accessing student records.' });
    }
    req.sdmsScope = {
      collegeId: collegeId || null,
      collegeIds: collegeIds.length > 0 ? collegeIds : null,
      courseId,
      courseIds: courseIds.length > 0 ? courseIds : null,
      branchId: branchId || null,
      branchIds: branchIds.length > 0 ? branchIds : null,
      year: year || null,
      years: years.length > 0 ? years : null
    };
  } else {
    // Other roles (evaluator, faculty, custom, or superadmin)
    // If scope has been assigned, populate req.sdmsScope so endpoints filter properly
    req.sdmsScope = {
      collegeId: collegeId || null,
      collegeIds: collegeIds.length > 0 ? collegeIds : null,
      courseId: courseId || null,
      courseIds: courseIds.length > 0 ? courseIds : null,
      branchId: branchId || null,
      branchIds: branchIds.length > 0 ? branchIds : null,
      year: year || null,
      years: years.length > 0 ? years : null
    };
  }
  return next();
};

module.exports = requireSdmsAssignment;
