const express = require('express');
const router = express.Router();

//USER
const signinRouter = require('./user/signin');
const signupRouter = require('./user/signup');
const dupEmailRouter = require('./user/dupemail');
const dupNickRouter = require('./user/dupnickname');

//PUSH
const pushRouter = require('./push/index');

//TAP - home, search, bookmark, acitvity, mypage
const homeRouter = require('./home/index');
const searchRouter = require('./search/index');
const bookmarkRouter = require('./bookmark/index');
const activityRouter = require('./activity/index');
const mypageRouter = require('./mypage/index');

//REVIEW
const reviewRouter = require('./review/index');

router.use('/signin', signinRouter);
router.use('/signup', signupRouter);
router.use('/dup-email', dupEmailRouter);
router.use('/dup-nickname', dupNickRouter);

router.use('/push', pushRouter);

router.use('/home', homeRouter);
router.use('/search', searchRouter);
router.use('/bookmark', bookmarkRouter);
router.use('/activity', activityRouter);
router.use('/mypage', mypageRouter);

router.use('/review', reviewRouter);

module.exports = router;
