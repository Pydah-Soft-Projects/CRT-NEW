const testIncludesSdmsScope = (test, scope = {}) => {
  if (!test) return false;
  const collegeIds = (test.target_college_ids || []).map(Number).filter(n => Number.isSafeInteger(n) && n > 0);
  const courseIds = (test.target_course_ids || []).map(Number).filter(n => Number.isSafeInteger(n) && n > 0);
  const branchIds = (test.target_branch_ids || []).map(Number).filter(n => Number.isSafeInteger(n) && n > 0);
  const years = (test.target_years || []).map(Number).filter(n => Number.isSafeInteger(n) && n > 0);

  const cleanScope = (arr, single) => {
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

  const scopeCollegeIds = cleanScope(scope.collegeIds, scope.collegeId);
  const scopeCourseIds = cleanScope(scope.courseIds, scope.courseId);
  const scopeBranchIds = cleanScope(scope.branchIds, scope.branchId);
  const scopeYears = cleanScope(scope.years, scope.year);

  // If scope has colleges and test has targets, they must overlap
  if (scopeCollegeIds.length > 0 && collegeIds.length > 0) {
    const hasOverlap = collegeIds.some(id => scopeCollegeIds.includes(Number(id)));
    if (!hasOverlap) return false;
  }

  // If scope has courses and test has targets, they must overlap
  if (scopeCourseIds.length > 0 && courseIds.length > 0) {
    const hasOverlap = courseIds.some(id => scopeCourseIds.includes(Number(id)));
    if (!hasOverlap) return false;
  }

  // If scope has branches and test has targets, they must overlap
  if (scopeBranchIds.length > 0 && branchIds.length > 0) {
    const hasOverlap = branchIds.some(id => scopeBranchIds.includes(Number(id)));
    if (!hasOverlap) return false;
  }

  // If scope has years and test has targets, they must overlap
  if (scopeYears.length > 0 && years.length > 0) {
    const hasOverlap = years.some(yr => scopeYears.includes(Number(yr)));
    if (!hasOverlap) return false;
  }

  return true;
};

module.exports = { testIncludesSdmsScope };
