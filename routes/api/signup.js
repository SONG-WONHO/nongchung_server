const express = require('express');
const router = express.Router();
const db = require('../../module/db');
const check = require('../../module/check');
const crypto = require('crypto-promise');
const jwt = require('../../module/jwt');


/* 테스트용 입니다. */
router.get('/', (req, res, next) => {
    res.render('index', { title: 'api/signup' });
});

//회원가입 라우터
router.post('/', async (req, res, next) => {

    let user_mail = req.body.email;
    let user_pw = req.body.password;
    let user_nickname = req.body.nickname;
    let user_name = req.body.name;
    let user_sex = req.body.sex;
    let user_hp = req.body.handphone;
    let user_birth = req.body.birth;

    //입력값중에 비어있는 값이 없는 지 검증
    //추후 escape 설정
    if(check.checkNull([user_mail, user_pw, user_nickname, user_name, user_sex, user_hp, user_birth])){
        res.status(400).send({
            message: "Null Value"
        })

    } else { //잘 입력 됐다면 ...

        //1) db에 등록된 유저가 있는 지 검증
        let checkQuery = "SELECT * FROM user WHERE user_mail = ?";
        let checkResult = await db.queryParamArr(checkQuery, [user_mail]);

        if (!checkResult) { // 쿼리수행중 에러가 있을 경우
            res.status(500).send({
                message : "Internal Server Error"
            });

        } else if (checkResult.length === 1){ // 유저가 존재할 때
            res.status(400).send({
                message : "Already Exists"
            });

        } else {//2) 패스워드 생성 후 유저 정보 저장 - hash, salt
            const salt = await crypto.randomBytes(32);
            const hashedpw = await crypto.pbkdf2(user_pw, salt.toString('base64'), 100000, 32, 'sha512');

            //DB에 유저 정보 저장 쿼리
            let insertQuery = "INSERT INTO user (user_mail, user_pw, user_nickname, user_name, user_sex, user_hp, user_birth, user_salt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            let insertResult = await db.queryParamArr(insertQuery, [user_mail, hashedpw.toString('base64'), user_nickname, user_name, user_sex, user_hp, user_birth, salt.toString('base64')]);

            if(!insertResult){ // 쿼리수행중 에러가 있을 경우
                res.status(500).send({
                    message : "Internal Server Error"
                });
            } else {
                res.status(200).send({
                    message: "Success To Sign Up"
                })
            }
        }
    }

});


module.exports = router;
