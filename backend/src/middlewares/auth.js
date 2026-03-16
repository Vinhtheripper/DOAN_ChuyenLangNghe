function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  return next();
}

function requireAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== 'admin') {
    return res.status(403).json({ message: 'Forbidden' });
  }
  return next();
}

function requireRoleAction(requiredRole, requiredActions) {
  return (req, res, next) => {
    if (!req.session.userId || req.session.role !== requiredRole) {
      return res.status(403).json({ message: 'Forbidden: Invalid Role' });
    }

    const userAction = req.session.action || 'just view';
    if (requiredActions.includes('edit all') || requiredActions.includes(userAction)) {
      return next();
    }

    if (userAction === 'just view' && requiredActions.includes('view')) {
      return next();
    }

    return res.status(403).json({ message: 'Forbidden: Insufficient Permissions' });
  };
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireRoleAction
};
