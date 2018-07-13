const express = require('express');
const router = express.Router();

//search 라우터
const searchRouter = require('./search');

//realTimeSearch 라우터 - for iOS
const realTimeSearchRouter = require('./realTimeSearch');

router.use('/', searchRouter);
router.use('/real-time', realTimeSearchRouter);

module.exports = router;