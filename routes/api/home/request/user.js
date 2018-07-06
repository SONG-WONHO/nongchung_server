const express = require('express');
const router = express.Router();
const db = require('../../../../module/db');
const jwt = require('../../../../module/jwt');
router.get('/', async (req, res, next) => {
    //토큰 받기
    let token = req.headers.token;

    //토큰이 없을 때
    if(!token){
        res.status(400).send({
            message : "No token"
        })

    }
    //토큰이 있을 때
    else {
        let decoded = jwt.verify(token);
        console.log(decoded.user_idx);
        console.log(decoded);
        if (decoded === -1) { //올바르지 않은 토큰일 때
            res.status(500).send({
                message: "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        }
        //올바른 토큰일 때
        else {
            let userIdx = decoded.user_idx;
            let selectQuery = `SELECT name, img, birth, sex, mail, hp FROM user WHERE idx=?;`;
            let selectResult = await db.queryParamArr(selectQuery, [userIdx]);

            if(!selectResult) {
                res.status(500).send({
                    message : "Internal Server Error"
                });
            } else {
                res.status(200).send({
                    message: "Success To Get User Info",
                    data: selectResult
                })
            }
        }
        }
});

module.exports = router;
