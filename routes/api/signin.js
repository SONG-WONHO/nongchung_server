const express = require('express');
const router = express.Router();
const db = require('../../module/db');
const crypto = require('crypto-promise');
const check = require('../../module/check');
const jwt = require('../../module/jwt');


/* 테스트용 입니다. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'api/signin' });
});

//로그인 라우터
router.post('/', async (req, res, next) => {

    //유저mail과 유저pw를 post 방식으로 받음
    let userMail = req.body.email;
    let userPw = req.body.password;

    //유저mail와 유저pw가 잘 입력됐는 지 검증
    //가능하다면 escape
    if (check.checkNull([userMail, userPw])){
        res.status(400).send({
            message: "Null Value"
        })
    } else { //잘 입력 됐다면 ...

        //1) db에 등록된 유저가 있는 지 검증
        let checkQuery = 'SELECT * FROM user WHERE mail = ?';
        let checkResult = await db.queryParamArr(checkQuery, [userMail]);

        if (!checkResult) { // 쿼리수행중 에러가 있을 경우
            res.status(500).send({
                message : "Internal Server Error"
            });

        } else if (checkResult.length === 1){ // 유저가 존재할 때
            //2) 등록된 유저의 패스워드가 저장된 패스워드와 일치하는 지 검증 - hash, salt
            let hashedpw = await crypto.pbkdf2(userPw, checkResult[0].salt, 100000, 32, 'sha512');	// 입력받은 pw를 DB에 존재하는 salt로 hashing

            //패스워드가 같은 지 검증
            if (hashedpw.toString('base64') === checkResult[0].pw){ //같다면?

                let token = jwt.sign(checkResult[0].user_idx);

                res.status(200).send({
                    message: "Success To Sign In",
                    token:token
                });
            } else { //다르다면?

                res.status(200).send({
                    message : "Fail To Sign In"
                });
                console.log("password error");
            }
        } else { // 유저가 없을 때

            res.status(200).send({
                message : "Fail To Sign In"
            });
            console.log("id error");
        }
    }
});


module.exports = router;