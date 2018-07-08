const express = require('express');
const router = express.Router();
const morePopulNhRouter = require('./morePopul');
const moreNewNhRouter = require('./moreNew');

router.use('/morePopul', morePopulNhRouter);
router.use('/moreNew', moreNewNhRouter);

router.get('/', async (req, res, next) => {

});

module.exports = router;