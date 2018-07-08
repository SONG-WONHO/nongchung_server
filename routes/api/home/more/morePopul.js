const express = require('express');
const router = express.Router();
const check = require('../../../../module/check');
const db = require('../../../../module/db');
const jwt = require('../../../../module/jwt');

//토큰이 있을 때랑 토큰이 없을 때
router.get("/", async (req, res, next) => {
    //토큰이 있는 지 없는 지 검증하기
    let token = req.headers.token;

    //토큰이 없다면? ==> 기존의 방식으로!
    if (!token) {

        //어떤 농활인 지 받기
        let nhIdx = req.query.idx ;

        //비어있는 값인지 검증
        if(check.checkNull([nhIdx])) {
            res.status(400).send({
                message: "Null Value"
            })
        }
        //정상적으로 들어왔다면?
        else {
            nhIdx = nhIdx * 1;

            //정당한 농활인 지 검증하기
            let selectQuery = "SELECT * FROM nh_popular WHERE idx = ?";
            let selectResult = await db.queryParamArr(selectQuery, [nhIdx]);

            //쿼리 수행도중 에러가 있을 때
            if (!selectResult) {
                res.status(500).send({
                    message : "Internal Server Error"
                })

                //정당한 농장이 아닐때
            }
            //에러가 없을 때, 농활리스트가 없다면?
            else if (selectResult.length < 1) {
                res.status(400).send({
                    message: "No nonghwal activity"
                })

                //정당한 농활이라면?
            }
            //농활리스트가 있다면?
            else {
                console.log(nhIdx);
                let selectQuery = `SELECT * FROM nh_popular limit ?,6`;
                let selectResult = await db.queryParamArr(selectQuery, [nhIdx]);

                let isEnd = 0;

                let checkQuery = `SELECT idx FROM nh_new WHERE idx = ?`;
                let checkResult = await db.queryParamArr(checkQuery, nhIdx + 6 + 1);

                if (checkResult.length === 0) {
                    isEnd = 1;
                }

                if (!selectResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    })
                } else {
                    res.status(200).send({
                        message : "Success To Get Data",
                        isEnd: isEnd,
                        data: selectResult
                    })
                }
            }
        }
    }
    //토큰이 있다면?
    else {
        //토큰이 있다면? ==> 이미 신청한 농활이라면? 취소하기 할 수있도록 정보 하나 추가해줘야 한다!!
        let decoded = jwt.verify(token);

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

            //어떤 농활인 지 받기
            let nhIdx = req.query.idx;

            //비어있는 값인지 검증
            if(check.checkNull([nhIdx])) {
                res.status(400).send({
                    message: "Null Value"
                })
            }
            //농활 인덱스가 잘 입력 됐을 때
            else {

                nhIdx = nhIdx * 1;


                //정당한 농활인 지 검증하기
                let selectQuery = "SELECT * FROM nh_popular WHERE idx = ?";
                let selectResult = await db.queryParamArr(selectQuery, [nhIdx]);

                //쿼리 수행도중 에러가 있다면?
                if (!selectResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    })

                    //정당한 농장이 아닐때
                }
                //에러가 없을 때 - 정당하지 않은 농활 인덱스라면?
                else if (selectResult.length < 1) {
                    res.status(400).send({
                        message: "No nonghwal activity"
                    })

                    //정당한 농활이라면?
                }
                //에러가 없을 때 - 정당한 농활 인덱스라면?
                else {
                    let selectQuery =
                        `SELECT nh_popular.nhIdx, name, price, star, period, addr, img, idx, if(userIdx = ?, 1, 0) AS isBooked 
                        FROM NONGHWAL.nh_popular 
                        LEFT JOIN (SELECT * FROM bookmark WHERE userIdx = ?) AS bookmark on bookmark.nhIdx = nh_popular.nhIdx limit ?, 6;`;

                    let selectResult = await db.queryParamArr(selectQuery, [userIdx, userIdx, nhIdx]);

                    let isEnd = 0;

                    let checkQuery = `SELECT idx FROM nh_new WHERE idx = ?`;
                    let checkResult = await db.queryParamArr(checkQuery, nhIdx + 6 + 1);

                    if (checkResult.length === 0) {
                        isEnd = 1;
                    }
                    console.log(selectResult);

                    if (!selectResult) {
                        res.status(500).send({
                            message : "Internal Server Error"
                        })
                    } else {
                        res.status(200).send({
                            message : "Success To Get Data",
                            isEnd: isEnd,
                            data: selectResult
                        })
                    }

                }
            }
        }
    }
});


module.exports = router;