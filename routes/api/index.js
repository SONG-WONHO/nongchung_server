const express = require('express');
const router = express.Router();

const signinRouter = require('./signin');
const signupRouter = require('./signup');
const dupEmailRouter = require('./dupemail');
const dupNickRouter = require('./dupnickname');

const homeRouter = require('./home/index');
const bookmarkRouter = require('./bookmark/index');
const activityRouter = require('./activity/index');
const noteRouter = require('./note/index');
const mypageRouter = require('./mypage/index');

/* 테스트용 입니다. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'api/index' });
});

router.use('/signin', signinRouter);
router.use('/signup', signupRouter);
router.use('/dup-email', dupEmailRouter);
router.use('/dup-nickname', dupNickRouter);

router.use('/home', homeRouter);
router.use('/bookmark', bookmarkRouter);
router.use('/activity', activityRouter);
router.use('/note', noteRouter);
router.use('/mypage', mypageRouter);

module.exports = router;
