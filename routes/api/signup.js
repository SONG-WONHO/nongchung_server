const express = require('express');
const router = express.Router();
const db = require('../../module/db');
const check = require('../../module/check');
const crypto = require('crypto-promise');

//회원가입 라우터
router.post('/', async (req, res, next) => {

    let userMail = req.body.email;
    let userPw = req.body.password;
    let userNickname = req.body.nickname;
    let userName = req.body.name;
    let userSex = req.body.sex;
    let userHp = req.body.handphone;
    let userBirth = req.body.birth;

    console.log(userMail, userNickname, userName, userSex, userHp, userBirth);

    //입력값중에 비어있는 값이 없는 지 검증
    //추후 escape 설정
    if(check.checkNull([userMail, userPw, userNickname, userName, userSex, userHp, userBirth])){
        res.status(400).send({
            message: "Null Value"
        })

    } else { //잘 입력 됐다면 ...

        //1) db에 등록된 유저가 있는 지 검증
        let checkQuery = "SELECT * FROM NONGHWAL.user WHERE mail = ? OR nickname = ?";

        let checkResult = await db.queryParamArr(checkQuery, [userMail, userNickname]);

        if (!checkResult) { // 쿼리수행중 에러가 있을 경우
            res.status(500).send({
                message : "Internal Server Error"
            });

        } else if (checkResult.length >= 1){ // 유저가 존재할 때, 프론트에서 중복 체크 해주지만, 혹시 모를 상황에 대비해 죽복 검증하는 라우터
            res.status(200).send({
                message : "Already Exists"
            });

        } else {//2) 패스워드 생성 후 유저 정보 저장 - hash, salt
            const salt = await crypto.randomBytes(32);
            const hashedpw = await crypto.pbkdf2(userPw, salt.toString('base64'), 100000, 32, 'sha512');

            //DB에 유저 정보 저장 쿼리
            let insertQuery = "INSERT INTO NONGHWAL.user (mail, pw, nickname, name, sex, hp, birth, salt, point, img) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
            let insertResult = await db.queryParamArr(insertQuery, [userMail, hashedpw.toString('base64'), userNickname, userName, userSex, userHp, userBirth, salt.toString('base64'), 0, "https://nonghwal.s3.ap-northeast-2.amazonaws.com/user/1530535264640.userDefault.png"]);

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
