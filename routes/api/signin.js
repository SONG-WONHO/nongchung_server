const express = require('express');
const router = express.Router();
const db = require('../../module/db');
const crypto = require('crypto-promise');

/* 테스트용 입니다. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'api/signin' });
});

//로그인 라우터
router.post('/', async (req, res, next) => {

    //유저id와 유저pw를 post 방식으로 받음
    let user_id = req.body.user_id;
    let user_pw = req.body.user_pw;

    //유저id와 유저pw가 잘 입력됐는 지 검증 - 추후 escape 설정
    if (!user_id || !user_pw){
        res.status(400).send({
            message: "Null Value"
        })
    } else { //잘 입력 됐다면 ...

        //1) db에 등록된 유저가 있는 지 검증
        let checkQuery = 'SELECT * FROM user WHERE user_id = ?';
        let checkResult = await db.queryParamArr(checkQuery, [user_id]);

        if (!checkResult) { // 쿼리수행중 에러가 있을 경우
            res.status(500).send({
                message : "Internal Server Error"
            });

        } else if (checkResult.length === 1){ // 유저가 존재할 때
            //2) 등록된 유저의 패스워드가 저장된 패스워드와 일치하는 지 검증 - hash, salt
            let hashedpw = await crypto.pbkdf2(user_pw, checkResult[0].user_salt, 100000, 32, 'sha512');	// 입력받은 pw를 DB에 존재하는 salt로 hashing

            //패스워드가 같은 지 검증
            if (hashedpw.toString('base64') === checkResult[0].user_pw){ //같다면?

                res.status(201).send({
                    message: "Login Success"
                });
            } else { //다르다면?

                res.status(400).send({
                    message : "Login Failed"
                });
                console.log("password error");
            }
        } else { // 유저가 없을 때

            res.status(400).send({
                message : "Login Failed"
            });
            console.log("id error");
        }
    }
});


module.exports = router;