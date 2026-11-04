const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = req.user.role;
    if (allowedRoles.includes(userRole) || userRole === 'superadmin') {
      return next();
    }

    // Check if user has active permissions granted in their role or user account
    // Users with roles like 'evaluator', 'faculty', or custom roles who have been configured
    // by Super Admin with page permissions (e.g. students, tests, results, crt_upload)
    const perms = req.user.permissions || {};
    const hasAnyGrantedPermission = Object.values(perms).some(p => {
      if (typeof p === 'boolean') return p;
      if (typeof p === 'object' && p !== null) return Boolean(p.read || p.write);
      return false;
    });

    // If an administrative/faculty/evaluator role has permissions configured, allow access
    if (hasAnyGrantedPermission && userRole !== 'student') {
      return next();
    }

    return res.status(403).json({ 
      success: false, 
      message: `Access forbidden for role: ${userRole}. Required role: ${allowedRoles.join(', ')}` 
    });
  };
};

module.exports = authorizeRoles;
