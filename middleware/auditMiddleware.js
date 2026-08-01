const workflowModel = require('../models/workflowModel');

const moduleFromPath = path => {
    if (path.startsWith('/employees') || path.startsWith('/department') || path.startsWith('/timelogs') || path.startsWith('/holiday') || path.startsWith('/shifts')) return 'Human Resources';
    if (path.startsWith('/salary') || path.startsWith('/payroll')) return 'Accounting';
    if (path.startsWith('/inventory/coils') || path.startsWith('/inventory/skelps')) return 'Production';
    if (path.startsWith('/inventory')) return 'Maintenance';
    if (path.startsWith('/users')) return 'Administration';
    if (path.startsWith('/utesla')) return 'UTESLA Cooperative';
    if (path.startsWith('/it-assets')) return 'IT Asset Management';
    return 'System';
};

const safeBody = body => Object.entries(body || {}).reduce((result, [key, value]) => {
    if (/password|token|image/i.test(key)) result[key] = '[redacted]';
    else if (typeof value === 'string' && value.length > 500) result[key] = `${value.slice(0, 500)}…`;
    else result[key] = value;
    return result;
}, {});

module.exports = (req, res, next) => {
    const readOnlyPost = ['/list', '/raw-list', '/print-raw-list', '/total-logs', '/detailed-list', '/payroll-list', '/options', '/search-options', '/total-employees', '/employee-options']
        .some(suffix => req.path.endsWith(suffix));
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || readOnlyPost || req.path.startsWith('/login') || req.path.startsWith('/workflow') || req.path.startsWith('/it-assets') || req.path.startsWith('/quality') || req.path.startsWith('/dispatch') || req.path.startsWith('/sales')) return next();
    res.on('finish', () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
            const pieces = req.path.split('/').filter(Boolean);
            workflowModel.addAudit({
                user: req.user, action: req.method === 'POST' ? 'CREATE' : req.method === 'DELETE' ? 'DELETE' : 'UPDATE',
                module: moduleFromPath(req.path), entityType: pieces.slice(0, 2).join(' / ') || 'Record',
                entityId: pieces[pieces.length - 1], description: `${req.method} ${req.path}`,
                newValues: safeBody(req.body), ipAddress: req.ip,
            }).catch(error => console.error('Audit logging failed:', error.message));
        }
    });
    next();
};
