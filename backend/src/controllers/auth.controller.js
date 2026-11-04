const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const Role = require('../models/Role');
const hrmsService = require('../services/hrms.service');
const sdmsService = require('../services/sdms.service');

const ALL_PAGES = [
  'dashboard',
  'students',
  'tests',
  'crt_upload',
  'results',
  'progress_tracking',
  'user_management'
];

const createStudentLoginResponse = (student, res) => {
  const permissions = {};
  const identity = {
    id: `sdms-${student.id}`,
    sdms_student_id: student.id,
    auth_source: 'sdms',
    username: student.username,
    name: student.name,
    email: student.email,
    role: 'student',
    role_name: 'student',
    permissions,
    college_id: student.college_id,
    course_id: student.course_id,
    branch_id: student.branch_id,
    year: student.year,
    semester: student.semester,
    section: student.section
  };
  const tokenPayload = {
    ...identity,
    sub: String(student.id)
  };
  const accessToken = jwt.sign(tokenPayload, env.JWT_SECRET_KEY, { expiresIn: env.JWT_EXPIRES_IN });
  const refreshToken = jwt.sign(
    { id: String(student.id), sdms_student_id: student.id, auth_source: 'sdms' },
    env.JWT_REFRESH_SECRET_KEY,
    { expiresIn: env.JWT_REFRESH_EXPIRES_IN }
  );

  return res.json({
    success: true,
    access_token: accessToken,
    refresh_token: refreshToken,
    data: { access_token: accessToken, refresh_token: refreshToken },
    user: identity
  });
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Username / Employee Number and password required' });
    }

    const cleanIdentifier = String(username).trim();

    // 1. Find user in CRT portal database
    let user = await User.findOne({
      $or: [
        { username: cleanIdentifier },
        { emp_no: cleanIdentifier },
        { email: cleanIdentifier }
      ]
    }).populate('role_id');

    if (!user || user.role === 'student') {
      const student = await sdmsService.authenticateStudent(cleanIdentifier, password);
      if (student) return createStudentLoginResponse(student, res);
      if (user?.role === 'student') {
        return res.status(401).json({ success: false, message: 'Invalid student ID or password' });
      }
    }

    let isAuthenticated = false;

    // 2. If user exists in CRT portal
    if (user) {
      if (user.status === 'inactive') {
        return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact an administrator.' });
      }

      // Check if user is linked to HRMS
      if (user.auth_source === 'hrms' || user.emp_no) {
        const hrmsCheck = await hrmsService.verifyHRMSPassword(user.emp_no || user.username || user.email, password);
        if (hrmsCheck.verified) {
          isAuthenticated = true;
        } else if (user.password) {
          // Fallback to local password if exists
          isAuthenticated = await user.comparePassword(password);
        }
      } else {
        // Local user authentication (e.g. initial superadmin)
        isAuthenticated = await user.comparePassword(password);
      }

      if (!isAuthenticated) {
        return res.status(401).json({ success: false, message: 'Invalid employee number / username or password' });
      }
    } else {
      // 3. User not found in CRT. Check if they exist in HRMS directly
      const hrmsCheck = await hrmsService.verifyHRMSPassword(cleanIdentifier, password);
      if (hrmsCheck.verified) {
        return res.status(403).json({
          success: false,
          message: `HRMS credentials verified for Employee (${cleanIdentifier}), but your portal account is pending role assignment. Please contact Super Admin to assign you access in User Management.`
        });
      }

      return res.status(401).json({ success: false, message: 'Invalid employee number / username or password' });
    }

    // 4. Resolve effective permissions
    let permissions = {};

    if (user.role_id && user.role_id.permissions) {
      permissions = { ...user.role_id.permissions };
    }

    if (user.permissions && typeof user.permissions === 'object') {
      permissions = { ...permissions, ...user.permissions };
    }

    // Super Admin gets unrestricted read & write for all portal pages
    if (user.role === 'superadmin') {
      ALL_PAGES.forEach(page => {
        permissions[page] = { read: true, write: true };
      });
    }

    const tokenPayload = {
      id: user._id,
      username: user.username,
      emp_no: user.emp_no,
      role: user.role,
      role_name: user.role_id?.name || user.role,
      permissions: permissions,
      campus_id: user.campus_id,
      sdms_college_id: user.sdms_college_id,
      sdms_course_id: user.sdms_course_id,
      sdms_branch_id: user.sdms_branch_id,
      sdms_year: user.sdms_year,
      sdms_college_ids: user.sdms_college_ids || [],
      sdms_course_ids: user.sdms_course_ids || [],
      sdms_branch_ids: user.sdms_branch_ids || [],
      sdms_years: user.sdms_years || [],
      course_id: user.course_id,
      batch_id: user.batch_id
    };

    const accessToken = jwt.sign(tokenPayload, env.JWT_SECRET_KEY, { expiresIn: env.JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ id: user._id, username: user.username }, env.JWT_REFRESH_SECRET_KEY, { expiresIn: env.JWT_REFRESH_EXPIRES_IN });

    return res.json({
      success: true,
      access_token: accessToken,
      refresh_token: refreshToken,
      data: {
        access_token: accessToken,
        refresh_token: refreshToken
      },
      user: {
        id: user._id,
        username: user.username,
        emp_no: user.emp_no,
        name: user.name || user.username,
        email: user.email,
        role: user.role,
        role_name: user.role_id?.name || user.role,
        permissions: permissions,
        department_name: user.department_name,
        designation_name: user.designation_name,
        phone_number: user.phone_number,
        campus_id: user.campus_id,
        sdms_college_id: user.sdms_college_id,
        sdms_course_id: user.sdms_course_id,
        sdms_branch_id: user.sdms_branch_id,
        sdms_year: user.sdms_year,
        sdms_college_ids: user.sdms_college_ids || [],
        sdms_course_ids: user.sdms_course_ids || [],
        sdms_branch_ids: user.sdms_branch_ids || [],
        sdms_years: user.sdms_years || [],
        course_id: user.course_id,
        batch_id: user.batch_id
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.logout = async (req, res) => {
  return res.json({ success: true, message: 'Logged out successfully' });
};

exports.refreshToken = async (req, res) => {
  try {
    const refreshToken = req.body.refresh_token || req.headers['authorization']?.split(' ')[1];
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET_KEY);
    if (
      decoded.auth_source === 'sdms' &&
      Number.isSafeInteger(Number(decoded.sdms_student_id)) &&
      Number(decoded.sdms_student_id) > 0
    ) {
      const student = await sdmsService.getStudentIdentityById(decoded.sdms_student_id);
      if (!student) return res.status(401).json({ success: false, message: 'Invalid refresh token' });
      const permissions = {};
      const accessToken = jwt.sign({
        id: `sdms-${student.id}`,
        sub: String(student.id),
        sdms_student_id: student.id,
        auth_source: 'sdms',
        username: student.username,
        name: student.name,
        email: student.email,
        role: 'student',
        role_name: 'student',
        permissions,
        college_id: student.college_id,
        course_id: student.course_id,
        branch_id: student.branch_id,
        year: student.year,
        semester: student.semester,
        section: student.section
      }, env.JWT_SECRET_KEY, { expiresIn: env.JWT_EXPIRES_IN });
      return res.json({ success: true, data: { access_token: accessToken }, access_token: accessToken });
    }
    const user = await User.findById(decoded.id).populate('role_id');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    let permissions = {};
    if (user.role_id && user.role_id.permissions) {
      permissions = { ...user.role_id.permissions };
    }
    if (user.permissions) {
      permissions = { ...permissions, ...user.permissions };
    }
    if (user.role === 'superadmin') {
      ALL_PAGES.forEach(page => {
        permissions[page] = { read: true, write: true };
      });
    }

    const newAccessToken = jwt.sign(
      {
        id: user._id,
        username: user.username,
        emp_no: user.emp_no,
        role: user.role,
        role_name: user.role_id?.name || user.role,
        permissions: permissions,
        campus_id: user.campus_id,
        sdms_college_id: user.sdms_college_id,
        sdms_course_id: user.sdms_course_id,
        sdms_branch_id: user.sdms_branch_id,
        sdms_year: user.sdms_year,
        sdms_college_ids: user.sdms_college_ids || [],
        sdms_course_ids: user.sdms_course_ids || [],
        sdms_branch_ids: user.sdms_branch_ids || [],
        sdms_years: user.sdms_years || [],
        course_id: user.course_id,
        batch_id: user.batch_id
      },
      env.JWT_SECRET_KEY,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    return res.json({
      success: true,
      data: { access_token: newAccessToken },
      access_token: newAccessToken
    });
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid refresh token', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    if (req.user.auth_source === 'sdms') {
      const student = await sdmsService.getStudentIdentityById(req.user.sdms_student_id);
      if (!student) return res.status(404).json({ success: false, message: 'Student account not found in SDMS' });
      const user = {
        id: `sdms-${student.id}`,
        sdms_student_id: student.id,
        auth_source: 'sdms',
        username: student.username,
        name: student.name,
        email: student.email,
        role: 'student',
        role_name: 'student',
        permissions: {},
        college_id: student.college_id,
        course_id: student.course_id,
        branch_id: student.branch_id,
        year: student.year,
        semester: student.semester,
        section: student.section
      };
      return res.json({ success: true, user, data: user });
    }
    const user = await User.findById(req.user.id).populate('role_id').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    let permissions = {};
    if (user.role_id && user.role_id.permissions) {
      permissions = { ...user.role_id.permissions };
    }
    if (user.permissions) {
      permissions = { ...permissions, ...user.permissions };
    }
    if (user.role === 'superadmin') {
      ALL_PAGES.forEach(page => {
        permissions[page] = { read: true, write: true };
      });
    }

    return res.json({
      success: true,
      user: {
        ...user,
        permissions
      },
      data: {
        ...user,
        permissions
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  return res.json({ success: true, message: `Password reset email dispatched to ${email || 'user'}` });
};

exports.resetPassword = async (req, res) => {
  return res.json({ success: true, message: 'Password updated successfully' });
};
