const express = require('express');
const router = express.Router();


//테스트
router.get('/', async (req,res)=>{

    res.status(200).send({
        message:"test"
    });
});

//농활등록하기
/*
1) 로그인 했는 지 검증
2) 승인된 농장인지 검증
3) 농활등록하기
 */
router.post('/', async(req,res)=>{

});

//농활삭제하기
/*
1) 로그인 했는 지 검증
2) 승인된 농장인지 검증
3) 등록된 농활인지 검증
 */

module.exports = router;
