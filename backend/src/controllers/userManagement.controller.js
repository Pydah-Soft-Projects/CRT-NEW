const User = require('../models/User');
const Role = require('../models/Role');
const hrmsService = require('../services/hrms.service');
const sdmsService = require('../services/sdms.service');

const PORTAL_PAGES = [
  { id: 'dashboard', name: 'Dashboard', path: '/superadmin/dashboard', description: 'Overview statistics and system health' },
  { id: 'students', name: 'Student Management', path: '/superadmin/students', description: 'Student directory and profile management' },
  { id: 'tests', name: 'Test Management', path: '/superadmin/tests', description: 'Module creation and test scheduling' },
  { id: 'crt_upload', name: 'CRT Upload', path: '/superadmin/crt-upload', description: 'Dynamic CRT modules, topics, levels, and question upload' },
  { id: 'results', name: 'Results Management', path: '/superadmin/results', description: 'View student scores and test submissions' },
  { id: 'progress_tracking', name: 'Progress Tracking', path: '/superadmin/progress-tracking', description: 'Student module progress tracking' },
  { id: 'user_management', name: 'User Management', path: '/superadmin/user-management', description: 'HRMS users linking, role creation, and permissions' }
];

// Helper to seed initial system roles if empty
const seedDefaultRoles = async () => {
  const count = await Role.countDocuments();
  if (count > 0) return;

  const fullPerms = {};
  PORTAL_PAGES.forEach(p => { fullPerms[p.id] = { read: true, write: true }; });

  const campusPerms = {};
  PORTAL_PAGES.forEach(p => {
    if (['dashboard', 'students', 'tests', 'results', 'progress_tracking'].includes(p.id)) {
      campusPerms[p.id] = { read: true, write: true };
    } else {
      campusPerms[p.id] = { read: false, write: false };
    }
  });

  const evaluatorPerms = {};
  PORTAL_PAGES.forEach(p => {
    if (['dashboard', 'students', 'tests', 'progress_tracking'].includes(p.id)) {
      evaluatorPerms[p.id] = { read: true, write: false };
    } else if (p.id === 'results') {
      evaluatorPerms[p.id] = { read: true, write: true };
    } else {
      evaluatorPerms[p.id] = { read: false, write: false };
    }
  });

  await Role.insertMany([
    {
      name: 'Super Admin',
      key: 'superadmin',
      description: 'Full read and write privileges across all portal pages',
      is_system: true,
      permissions: fullPerms
    },
    {
      name: 'Campus Admin',
      key: 'campus_admin',
      description: 'Manage campus students, tests, results, and progress',
      is_system: true,
      permissions: campusPerms
    },
    {
      name: 'Course Admin',
      key: 'course_admin',
      description: 'Manage course-specific students, tests, and view results',
      is_system: true,
      permissions: campusPerms
    },
    {
      name: 'Evaluator / Faculty',
      key: 'evaluator',
      description: 'Review student performance and evaluate test results',
      is_system: false,
      permissions: evaluatorPerms
    }
  ]);

  console.log('✅ Seeded default system roles');
};

// Seed on startup
seedDefaultRoles().catch(err => console.warn('Role seed error:', err.message));

/**
 * Get available portal pages
 */
exports.getAvailablePages = async (req, res) => {
  return res.json({
    success: true,
    data: PORTAL_PAGES
  });
};

/**
 * Get system summary metrics
 */
exports.getSummary = async (req, res) => {
  try {
    const [portalUsersCount, hrmsLinkedCount, rolesCount] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ auth_source: 'hrms', emp_no: { $exists: true, $ne: null } }),
      Role.countDocuments()
    ]);

    let hrmsTotalEmployees = 0;
    try {
      const conn = await hrmsService.getHRMSConnection();
      hrmsTotalEmployees = await conn.db.collection('employees').countDocuments({ is_active: { $ne: false } });
    } catch (_) {}

    return res.json({
      success: true,
      data: {
        totalPortalUsers: portalUsersCount,
        hrmsLinkedUsers: hrmsLinkedCount,
        totalRoles: rolesCount,
        hrmsTotalEmployees
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * List all portal users
 */
exports.getUsers = async (req, res) => {
  try {
    const { search = '', role = '', status = '', page = 1, limit = 20 } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (role) {
      query.role = role;
    }

    if (search && search.trim()) {
      const regex = { $regex: search.trim(), $options: 'i' };
      query.$or = [
        { name: regex },
        { username: regex },
        { emp_no: regex },
        { email: regex },
        { department_name: regex },
        { designation_name: regex }
      ];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('role_id', 'name key permissions')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(query)
    ]);

    // Build SDMS lookup maps for friendly display
    let collegeMap = {};
    let courseMap = {};
    let branchMap = {};
    try {
      const [colleges, courses, branches] = await Promise.all([
        sdmsService.getColleges().catch(() => []),
        sdmsService.getCourses().catch(() => []),
        sdmsService.getBranches().catch(() => [])
      ]);
      if (Array.isArray(colleges)) colleges.forEach(c => { collegeMap[c.id] = c.name; });
      if (Array.isArray(courses)) courses.forEach(c => { courseMap[c.id] = c.name || c.code; });
      if (Array.isArray(branches)) branches.forEach(b => { branchMap[b.id] = b.code || b.name; });
    } catch (e) {
      // Ignore lookup errors
    }

    const enrichedUsers = users.map(u => {
      const collegeIds = (Array.isArray(u.sdms_college_ids) && u.sdms_college_ids.length > 0)
        ? u.sdms_college_ids
        : (u.sdms_college_id ? [u.sdms_college_id] : []);
      const courseIds = (Array.isArray(u.sdms_course_ids) && u.sdms_course_ids.length > 0)
        ? u.sdms_course_ids
        : (u.sdms_course_id ? [u.sdms_course_id] : []);
      const branchIds = (Array.isArray(u.sdms_branch_ids) && u.sdms_branch_ids.length > 0)
        ? u.sdms_branch_ids
        : (u.sdms_branch_id ? [u.sdms_branch_id] : []);
      const years = (Array.isArray(u.sdms_years) && u.sdms_years.length > 0)
        ? u.sdms_years
        : (u.sdms_year ? [u.sdms_year] : []);

      const collegeNames = collegeIds.map(id => collegeMap[id] || `College ${id}`);
      const courseNames = courseIds.map(id => courseMap[id] || `Course ${id}`);
      const branchNames = branchIds.map(id => branchMap[id] || `Branch ${id}`);

      return {
        ...u,
        sdms_college_ids: collegeIds,
        sdms_course_ids: courseIds,
        sdms_branch_ids: branchIds,
        sdms_years: years,
        sdms_college_name: collegeNames.join(', '),
        sdms_course_name: courseNames.join(', '),
        sdms_branch_name: branchNames.join(', '),
        sdms_college_names: collegeNames,
        sdms_course_names: courseNames,
        sdms_branch_names: branchNames
      };
    });

    return res.json({
      success: true,
      data: enrichedUsers,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Link an HRMS employee as a portal user
 */
exports.linkHRMSUser = async (req, res) => {
  try {
    const {
      emp_no,
      role_id,
      custom_permissions = {},
      role_name,
      sdms_college_ids,
      sdms_course_ids,
      sdms_branch_ids,
      sdms_years,
      sdms_college_id,
      sdms_course_id,
      sdms_branch_id,
      sdms_year
    } = req.body;

    if (!emp_no) {
      return res.status(400).json({ success: false, message: 'Employee number (emp_no) is required' });
    }

    const employee = await hrmsService.getEmployeeByEmpNo(emp_no);
    if (!employee) {
      return res.status(404).json({ success: false, message: `Employee '${emp_no}' not found in HRMS Database` });
    }

    let roleDoc = null;
    let finalRoleKey = 'custom';
    if (role_id) {
      roleDoc = await Role.findById(role_id);
      if (roleDoc) {
        finalRoleKey = roleDoc.key || roleDoc.name.toLowerCase().replace(/\s+/g, '_');
      }
    } else if (role_name) {
      roleDoc = await Role.findOne({ $or: [{ key: role_name }, { name: role_name }] });
      if (roleDoc) {
        finalRoleKey = roleDoc.key;
      } else {
        finalRoleKey = role_name;
      }
    }

    const parseNumArray = (arr, single) => {
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.map(Number).filter(n => Number.isSafeInteger(n) && n > 0);
      }
      if (single !== undefined && single !== null && single !== '') {
        const n = Number(single);
        return Number.isSafeInteger(n) && n > 0 ? [n] : [];
      }
      return [];
    };

    const collegeIds = parseNumArray(sdms_college_ids, sdms_college_id);
    const courseIds = parseNumArray(sdms_course_ids, sdms_course_id);
    const branchIds = parseNumArray(sdms_branch_ids, sdms_branch_id);
    const years = parseNumArray(sdms_years, sdms_year);

    // Role-specific SDMS validations
    if (finalRoleKey === 'campus_admin' && collegeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Campus Admin role requires at least one College selection.'
      });
    }
    if (finalRoleKey === 'course_admin' && (collegeIds.length === 0 || courseIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Course Admin role requires both College and Course selections.'
      });
    }

    // Merge role permissions and custom overrides
    const mergedPermissions = {
      ...(roleDoc?.permissions || {}),
      ...custom_permissions
    };

    // Check if user already exists
    let user = await User.findOne({
      $or: [
        { emp_no: String(emp_no) },
        { username: String(emp_no) }
      ]
    });

    if (user) {
      user.name = employee.employee_name;
      user.email = employee.email || user.email;
      user.emp_no = String(emp_no);
      user.auth_source = 'hrms';
      user.role = finalRoleKey;
      user.role_id = roleDoc ? roleDoc._id : user.role_id;
      user.permissions = mergedPermissions;
      user.department_name = employee.department_name;
      user.designation_name = employee.designation_name;
      user.phone_number = employee.phone_number || user.phone_number;
      user.sdms_college_ids = collegeIds;
      user.sdms_course_ids = courseIds;
      user.sdms_branch_ids = branchIds;
      user.sdms_years = years;
      user.sdms_college_id = collegeIds[0] || null;
      user.sdms_course_id = courseIds[0] || null;
      user.sdms_branch_id = branchIds[0] || null;
      user.sdms_year = years[0] || null;
      user.status = 'active';
      user.updated_at = new Date();
      await user.save();
    } else {
      user = new User({
        username: String(emp_no),
        emp_no: String(emp_no),
        name: employee.employee_name,
        email: employee.email || `${emp_no}@pydah.edu.in`,
        auth_source: 'hrms',
        role: finalRoleKey,
        role_id: roleDoc ? roleDoc._id : null,
        permissions: mergedPermissions,
        department_name: employee.department_name,
        designation_name: employee.designation_name,
        phone_number: employee.phone_number,
        sdms_college_ids: collegeIds,
        sdms_course_ids: courseIds,
        sdms_branch_ids: branchIds,
        sdms_years: years,
        sdms_college_id: collegeIds[0] || null,
        sdms_course_id: courseIds[0] || null,
        sdms_branch_id: branchIds[0] || null,
        sdms_year: years[0] || null,
        status: 'active'
      });
      await user.save();
    }

    const populatedUser = await User.findById(user._id).populate('role_id');

    return res.status(201).json({
      success: true,
      message: `Employee ${employee.employee_name} (${emp_no}) successfully linked as portal user`,
      data: populatedUser
    });
  } catch (error) {
    console.error('linkHRMSUser Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update portal user
 */
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      role_id,
      role,
      permissions,
      status,
      sdms_college_ids,
      sdms_course_ids,
      sdms_branch_ids,
      sdms_years,
      sdms_college_id: sdmsCollegeId,
      sdms_course_id: sdmsCourseId,
      sdms_branch_id: sdmsBranchId,
      sdms_year: sdmsYear
    } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let targetRole = user.role;
    if (role_id) {
      const roleDoc = await Role.findById(role_id);
      if (roleDoc) {
        user.role_id = roleDoc._id;
        user.role = roleDoc.key || roleDoc.name.toLowerCase().replace(/\s+/g, '_');
        targetRole = user.role;
      }
    } else if (role) {
      user.role = role;
      targetRole = role;
    }

    const parseNumArray = (arr, single) => {
      if (Array.isArray(arr)) {
        return arr.map(Number).filter(n => Number.isSafeInteger(n) && n > 0);
      }
      if (single !== undefined && single !== null && single !== '') {
        const n = Number(single);
        return Number.isSafeInteger(n) && n > 0 ? [n] : [];
      }
      return null;
    };

    const parsedCollegeIds = parseNumArray(sdms_college_ids, sdmsCollegeId);
    const parsedCourseIds = parseNumArray(sdms_course_ids, sdmsCourseId);
    const parsedBranchIds = parseNumArray(sdms_branch_ids, sdmsBranchId);
    const parsedYears = parseNumArray(sdms_years, sdmsYear);

    const effectiveCollegeIds = parsedCollegeIds !== null ? parsedCollegeIds : (user.sdms_college_ids?.length ? user.sdms_college_ids : (user.sdms_college_id ? [user.sdms_college_id] : []));
    const effectiveCourseIds = parsedCourseIds !== null ? parsedCourseIds : (user.sdms_course_ids?.length ? user.sdms_course_ids : (user.sdms_course_id ? [user.sdms_course_id] : []));

    // Validations based on target role
    if (targetRole === 'campus_admin' && effectiveCollegeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Campus Admin role requires at least one College selection.'
      });
    }
    if (targetRole === 'course_admin' && (effectiveCollegeIds.length === 0 || effectiveCourseIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Course Admin role requires both College and Course selections.'
      });
    }

    if (permissions !== undefined) {
      user.permissions = permissions;
    }

    if (status !== undefined) {
      user.status = status;
    }

    if (parsedCollegeIds !== null) {
      user.sdms_college_ids = parsedCollegeIds;
      user.sdms_college_id = parsedCollegeIds[0] || null;
    }
    if (parsedCourseIds !== null) {
      user.sdms_course_ids = parsedCourseIds;
      user.sdms_course_id = parsedCourseIds[0] || null;
    }
    if (parsedBranchIds !== null) {
      user.sdms_branch_ids = parsedBranchIds;
      user.sdms_branch_id = parsedBranchIds[0] || null;
    }
    if (parsedYears !== null) {
      user.sdms_years = parsedYears;
      user.sdms_year = parsedYears[0] || null;
    }

    user.updated_at = new Date();
    await user.save();

    const populated = await User.findById(user._id).populate('role_id');
    return res.json({
      success: true,
      message: 'User updated successfully',
      data: populated
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete user from portal
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.username === 'superadmin' || user.role === 'superadmin') {
      return res.status(400).json({ success: false, message: 'Cannot delete primary Super Admin user' });
    }

    await User.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `User ${user.name || user.username} access removed from portal`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all roles with permissions and user count
 */
exports.getRoles = async (req, res) => {
  try {
    await seedDefaultRoles();

    const roles = await Role.find().sort({ is_system: -1, name: 1 }).lean();

    // Compute user counts per role
    const userCounts = await User.aggregate([
      {
        $group: {
          _id: { $ifNull: ['$role_id', '$role'] },
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = new Map();
    userCounts.forEach(c => {
      if (c._id) countMap.set(String(c._id), c.count);
    });

    const enriched = roles.map(r => ({
      ...r,
      user_count: countMap.get(String(r._id)) || countMap.get(r.key) || 0
    }));

    return res.json({
      success: true,
      data: enriched
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Create a new custom role with page read/write permissions
 */
exports.createRole = async (req, res) => {
  try {
    const { name, description = '', permissions = {} } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const cleanName = name.trim();
    const key = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_');

    const existing = await Role.findOne({ $or: [{ name: cleanName }, { key }] });
    if (existing) {
      return res.status(400).json({ success: false, message: `Role '${cleanName}' already exists` });
    }

    // Ensure all portal pages are covered with boolean defaults
    const formattedPermissions = {};
    PORTAL_PAGES.forEach(page => {
      const pagePerm = permissions[page.id] || {};
      formattedPermissions[page.id] = {
        read: Boolean(pagePerm.read || pagePerm === 'read' || pagePerm === 'write'),
        write: Boolean(pagePerm.write || pagePerm === 'write')
      };
    });

    const role = new Role({
      name: cleanName,
      key,
      description,
      is_system: false,
      permissions: formattedPermissions
    });

    await role.save();

    return res.status(201).json({
      success: true,
      message: `Role '${cleanName}' created successfully`,
      data: role
    });
  } catch (error) {
    console.error('createRole Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Update an existing role
 */
exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (name && name.trim()) {
      role.name = name.trim();
    }

    if (description !== undefined) {
      role.description = description;
    }

    if (permissions && typeof permissions === 'object') {
      const formattedPermissions = { ...role.permissions };
      PORTAL_PAGES.forEach(page => {
        if (permissions[page.id] !== undefined) {
          const pagePerm = permissions[page.id];
          formattedPermissions[page.id] = {
            read: Boolean(pagePerm.read || pagePerm === 'read' || pagePerm === 'write'),
            write: Boolean(pagePerm.write || pagePerm === 'write')
          };
        }
      });
      role.permissions = formattedPermissions;
    }

    role.updated_at = new Date();
    await role.save();

    return res.json({
      success: true,
      message: `Role '${role.name}' updated successfully`,
      data: role
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a custom role
 */
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found' });
    }

    if (role.is_system || role.key === 'superadmin') {
      return res.status(400).json({ success: false, message: 'Cannot delete built-in system role' });
    }

    // Check if any users have this role assigned
    const assignedUsersCount = await User.countDocuments({ role_id: role._id });
    if (assignedUsersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role '${role.name}': it is currently assigned to ${assignedUsersCount} user(s). Reassign them first.`
      });
    }

    await Role.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: `Role '${role.name}' deleted successfully`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Search live HRMS employees
 */
exports.searchHRMSEmployees = async (req, res) => {
  try {
    const results = await hrmsService.searchEmployees(req.query);
    return res.json(results);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get HRMS employee by emp_no
 */
exports.getHRMSEmployee = async (req, res) => {
  try {
    const { emp_no } = req.params;
    const employee = await hrmsService.getEmployeeByEmpNo(emp_no);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found in HRMS' });
    }
    return res.json({ success: true, data: employee });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get HRMS departments for dropdowns
 */
exports.getHRMSDepartments = async (req, res) => {
  try {
    const departments = await hrmsService.getDepartments();
    return res.json({ success: true, data: departments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
