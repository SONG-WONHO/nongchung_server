const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const check = require('../../../module/check');
const jwt = require('../../../module/jwt');

router.post('/', async (req, res, next) => {
    let token = req.headers.token;

    //토큰이 없다면? ==> 기존의 방식으로!
    if (!token) {

        res.status(400).send({
            message : "No token"
        })
    }

    //토큰이 있다면?
    else {
        //토큰이 있다면?
        let decoded = jwt.verify(token);

        if (decoded === 10) {
            res.status(500).send({
                message : "token err",//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
                expired: 1
            });

            return;
        }

        //정당하지 않은 토큰이 들어올 때
        if(decoded === -1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });

        }
        //정당한 토큰이 들어올 때
        else {

            //유저 인덱스 받기
            let userIdx = decoded.user_idx;

            //디바이스 토큰, 종류 받기
            let deviceToken = req.body.token;
            let deviceCategory = req.body.deviceCategory;

            //값이 없다면?
            if (check.checkNull([deviceToken, deviceCategory])) {
                res.status(400).send({
                    message: "Null Value"
                })
            }
            //값이 있다면?
            else {
                let updateQuery =
                    `
                    UPDATE NONGHWAL.user 
                    SET token=?, deviceCategory=? 
                    WHERE idx=?;
                    `;

                let updateResult = await db.queryParamArr(updateQuery, [deviceToken, deviceCategory, userIdx]);

                //쿼리수행중 에러가 있다면?
                if (!updateResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                }

                //에러가 없이 잘 수행됐을 때
                else {
                    res.status(200).send({
                        message: "Success To Register Token"
                    })
                }
            }
        }
    }
});

module.exports = router;