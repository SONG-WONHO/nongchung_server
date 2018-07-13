const express = require('express');
const router = express.Router();

//농활 디테일 보여주는 라우터
const nhRouter = require('./nh');

//농장 디테일 보여주는 라우터
const farmRouter = require('./farm');

//QNA 보여주고 질문하는 라우터
const qnaRouter = require('./qna');

//보류 for web
const locationRouter = require('./location');

router.use('/nh', nhRouter);
router.use('/farm', farmRouter);
router.use('/qna', qnaRouter);

//보류 for web
router.use('/location', locationRouter);



module.exports = router;
