const router = require("express").Router();
const { uploadXls, importLogs, rawList, totalLogs, timelogOptions, detailedList, dtrCorrection } = require("../controllers/timelogController");

router.post("/uploadxls", uploadXls);
router.post("/import", importLogs);
router.post("/raw-list", rawList);
router.post("/total-logs", totalLogs);
router.get("/options", timelogOptions);
router.post("/detailed-list", detailedList);
router.post("/dtr-correction", dtrCorrection);

module.exports = router;
