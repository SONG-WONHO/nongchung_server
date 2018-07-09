const express = require('express');
const router = express.Router();

const signinRouter = require('./user/signin');
const signupRouter = require('./user/signup');
const dupEmailRouter = require('./user/dupemail');
const dupNickRouter = require('./user/dupnickname');

const homeRouter = require('./home/index');
const searchRouter = require('./search');
const bookmarkRouter = require('./bookmark/index');
const activityRouter = require('./activity/index');
const mypageRouter = require('./mypage/index');

const reviewRouter = require('./review');

router.use('/signin', signinRouter);
router.use('/signup', signupRouter);
router.use('/dup-email', dupEmailRouter);
router.use('/dup-nickname', dupNickRouter);

router.use('/home', homeRouter);
router.use('/search', searchRouter);
router.use('/bookmark', bookmarkRouter);
router.use('/activity', activityRouter);
router.use('/mypage', mypageRouter);

router.use('/review', reviewRouter);

module.exports = router;
