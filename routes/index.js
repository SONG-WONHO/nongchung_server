const express = require('express');
const router = express.Router();

const apiRouter = require('./api/index');
const adminRouter = require('./admin/index');

router.use('/api', apiRouter);
router.use('/D033E22AE348AEB5660FC2140AEC35850C4DA997', adminRouter);

module.exports = router;
