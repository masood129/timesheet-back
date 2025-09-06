const validateReportId = (req, res, next) => {
    const reportId = parseInt(req.params.reportId);
    if (isNaN(reportId)) {
        return res.status(400).send('Invalid reportId: must be an integer');
    }
    req.params.reportId = reportId; // normalized
    next();
};

module.exports = validateReportId;
