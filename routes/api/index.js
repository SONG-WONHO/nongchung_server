const express = require('express');
const router = express.Router();

const signinRouter = require('./signin');
const signupRouter = require('./signup');
const dupRouter = require('./dup');


/* 테스트용 입니다. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'api/index' });
});

router.use('/signin', signinRouter);
router.use('/signup', signupRouter);
router.use('/dup', dupRouter);


module.exports = router;
