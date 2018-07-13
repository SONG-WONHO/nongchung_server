const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const crypto = require('crypto-promise');
const check = require('../../../module/check');
const jwt = require('../../../module/jwt');

//로그인 라우터
router.post('/', async (req, res, next) => {

    //유저mail과 유저pw를 post 방식으로 받음
    let userMail = req.body.email;
    let userPw = req.body.password;

    //유저mail와 유저pw가 잘 입력됐는 지 검증
    if (check.checkNull([userMail, userPw])){
        res.status(400).send({
            message: "Null Value"
        })

    } else { //잘 입력 됐다면 ...

        //1) db에 등록된 유저가 있는 지 검증
        let checkQuery =
            `
            SELECT
                user.mail,
                user.name,
                date_format(user.birth,"%Y-%m-%d") AS birth,
                user.sex,
                user.hp,
                user.point,
                user.img, 
                user.nickname, 
                (date_format(curdate(),"%Y") - date_format(birth, "%Y") +1) AS age,
                user.pw,
                user.salt
            FROM user WHERE mail = ?;`;
        let checkResult = await db.queryParamArr(checkQuery, [userMail]);

        //쿼리 수행 중 에러가 있을 경우
        if (!checkResult) {
            res.status(500).send({
                message : "Internal Server Error"
            });

        }
        //유저가 존재한다면
        else if (checkResult.length === 1){
            //등록된 유저의 패스워드가 저장된 패스워드와 일치하는 지 검증 - hash, salt
            let hashedpw = await crypto.pbkdf2(userPw, checkResult[0].salt, 100000, 32, 'sha512');	// 입력받은 pw를 DB에 존재하는 salt로 hashing

            //패스워드가 같은 지 검증
            if (hashedpw.toString('base64') === checkResult[0].pw){
                //패스워드가 같다면?

                //유저 인덱스를 포함한 토큰 발급하기
                let token = jwt.sign(checkResult[0].idx);

                console.log(checkResult);

                //데이트 포맷 바꿔주기
                for(let i = 0; i < checkResult.length; i++){
                    let temp = checkResult[i].birth;
                    temp = temp.split("-");
                    console.log(temp);
                    checkResult[i].birth = temp[0]+ "년 "+temp[1]+"월 "+temp[2]+"일";
                }

                //프론트한테 보내줄 결과 만들기
                let result = {
                    mail: checkResult[0].mail,
                    name: checkResult[0].name,
                    birth: checkResult[0].birth,
                    sex: checkResult[0].sex,
                    hp: checkResult[0].hp,
                    point: checkResult[0].point,
                    img: checkResult[0].img,
                    nickname: checkResult[0].nickname,
                    age: checkResult[0].age
                };

                console.log(result);

                res.status(200).send({
                    message : "Success To Sign In",
                    token : token,
                    data : result
                });

            }

            //만약 패스워드가 다르다면?
            else {

                res.status(401).send({
                    message : "Fail To Sign In"
                });
                console.log("password error");
            }
        }
        //만약 유저가 없다면?
        else {

            res.status(401).send({
                message : "Fail To Sign In"
            });
            console.log("id error");
        }
    }
});

module.exports = router;