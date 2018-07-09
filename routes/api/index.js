const express = require('express');
const router = express.Router();

const signinRouter = require('./signin');
const signupRouter = require('./signup');
const dupEmailRouter = require('./dupemail');
const dupNickRouter = require('./dupnickname');

const homeRouter = require('./home/index');
const searchRouter = require('./search');
const bookmarkRouter = require('./bookmark/index');
const activityRouter = require('./activity/index');
const mypageRouter = require('./mypage/index');

router.use('/signin', signinRouter);
router.use('/signup', signupRouter);
router.use('/dup-email', dupEmailRouter);
router.use('/dup-nickname', dupNickRouter);

router.use('/home', homeRouter);
router.use('/search', searchRouter);
router.use('/bookmark', bookmarkRouter);
router.use('/activity', activityRouter);
router.use('/mypage', mypageRouter);

module.exports = router;
