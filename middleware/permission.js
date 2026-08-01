const ROLE_PERMISSIONS = {
    Administrator: ['*'],
    Management: ['management.view', 'audit.view', 'employees.lookup', 'notifications.view'],
    HR: ['hr.manage', 'employees.lookup', 'requests.manage', 'approvals.review', 'notifications.view'],
    'HR Staff': ['hr.manage', 'employees.lookup', 'requests.manage', 'notifications.view'],
    Maintenance: ['maintenance.manage', 'employees.lookup', 'notifications.view'],
    'Device Manager': ['maintenance.manage', 'employees.lookup', 'notifications.view'],
    Production: ['production.manage', 'employees.lookup', 'notifications.view'],
    Accounting: ['accounting.manage', 'employees.lookup', 'notifications.view'],
    IT: ['it.manage', 'biometric.manage', 'employees.lookup', 'notifications.view'],
    QA: ['quality.manage', 'employees.lookup', 'notifications.view'],
    Dispatch: ['dispatch.manage', 'employees.lookup', 'notifications.view'],
    Sales: ['sales.manage', 'employees.lookup', 'notifications.view'],
    UTESLA: ['utesla.manage', 'employees.lookup', 'notifications.view'],
    Employee: ['selfservice.view', 'notifications.view'],
};

const hasPermission = (user, permission) => {
    const allowed = ROLE_PERMISSIONS[user?.role] || [];
    return allowed.includes('*') || allowed.includes(permission);
};

const requirePermission = (permission) => (req, res, next) => {
    if (!hasPermission(req.user, permission)) {
        return res.status(403).json({ message: 'You do not have permission to perform this action.' });
    }
    next();
};

const RESOURCE_PERMISSIONS = {
    leaves: 'requests.manage', overtime: 'requests.manage',
    'work-orders': 'maintenance.manage', 'preventive-maintenance': 'maintenance.manage',
    traceability: 'production.manage', 'calculator-history': 'production.manage', 'payroll-periods': 'accounting.manage',
};

const requireResourcePermission = (req, res, next) => {
    const permission = RESOURCE_PERMISSIONS[req.params.resource];
    if (!permission) return res.status(404).json({ message: 'Unknown workflow resource.' });
    return requirePermission(permission)(req, res, next);
};

module.exports = { ROLE_PERMISSIONS, hasPermission, requirePermission, requireResourcePermission };
