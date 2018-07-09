const express = require('express');
const router = express.Router();

const farmRouter = require('./farm');
const nhRouter = require('./nh');
const locationRouter = require('./location');

//테스트용입니다.
router.get('/', (req, res, next) => {
    res.render('index', { title: 'dfasfsdfasdf' });
});

router.use('/farm', farmRouter);
router.use('/nh', nhRouter);
router.use('/location', locationRouter);



module.exports = router;
