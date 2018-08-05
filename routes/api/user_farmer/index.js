const express = require('express');
const router = express.Router();

//농부 회원가입
const routerFarmerSignUp = require('./signup');
//농부 농장등록
const routerFarmerRegisterFarm = require('./registerFarm');

//메인
const routerFarmerMain = require('./main/index');

//농부 농활 등록하기
const routerFarmerNh = require('./nh/index');

router.use('/signup', routerFarmerSignUp);
router.use('/signfarm', routerFarmerRegisterFarm);
router.use('/main', routerFarmerMain);
router.use('/nh', routerFarmerNh);

//테스트
router.get('/', async (req,res)=>{

    res.status(200).send({
        message:"test"
    });
});

module.exports = router;
