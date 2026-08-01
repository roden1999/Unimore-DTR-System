const router = require("express").Router();
const verifyToken = require('../middleware/auth');
const { requirePermission, hasPermission } = require('../middleware/permission');
router.use(verifyToken);
const allowBiometric = (req, res, next) => {
    if (hasPermission(req.user, 'hr.manage') || hasPermission(req.user, 'biometric.manage')) return next();
    return res.status(403).json({ message: 'You do not have permission to manage biometric logs.' });
};
const { uploadXls, importLogs, rawList, printRawList, totalLogs, timelogOptions, detailedList, dtrCorrection, approveDtrCorrection } = require("../controllers/timelogController");

router.post("/uploadxls", allowBiometric, uploadXls);
router.post("/import", allowBiometric, importLogs);
router.post("/raw-list", allowBiometric, rawList);
router.post("/print-raw-list", allowBiometric, printRawList);
router.post("/total-logs", allowBiometric, totalLogs);
router.get("/options", allowBiometric, timelogOptions);
router.post("/detailed-list", requirePermission('hr.manage'), detailedList);
router.post("/dtr-correction", requirePermission('hr.manage'), dtrCorrection);
router.post("/approved-dtr-correction", requirePermission('hr.manage'), approveDtrCorrection);

module.exports = router;
