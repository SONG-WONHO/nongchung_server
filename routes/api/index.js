const express = require('express');
const router = express.Router();

const signinRouter = require('./user/signin');
const signupRouter = require('./user/signup');
const dupEmailRouter = require('./user/dupemail');
const dupNickRouter = require('./user/dupnickname');
const pushRouter = require('./user/push');

const homeRouter = require('./home/index');
const searchRouter = require('./search/search');
const realTimeSearchRouter = require('./search/realTimeSearch');
const bookmarkRouter = require('./bookmark/index');
const activityRouter = require('./activity/index');
const mypageRouter = require('./mypage/index');

const reviewRouter = require('./review');

router.use('/signin', signinRouter);
router.use('/signup', signupRouter);
router.use('/dup-email', dupEmailRouter);
router.use('/dup-nickname', dupNickRouter);
router.use('/push', pushRouter);

router.use('/home', homeRouter);
router.use('/search', searchRouter);
router.use('/real-time-search', realTimeSearchRouter);
router.use('/bookmark', bookmarkRouter);
router.use('/activity', activityRouter);
router.use('/mypage', mypageRouter);

router.use('/review', reviewRouter);

module.exports = router;
