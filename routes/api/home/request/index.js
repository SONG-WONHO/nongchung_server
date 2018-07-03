const express = require('express');
const router = express.Router();
const check = require('../../../../module/check');
const db = require('../../../../module/db');
const jwt = require('../../../../module/jwt');

//신청하기 - 날짜리스트 보기
router.get('/', async (req, res, next) => {
    let nhIdx = req.query.idx;

    if (check.checkNull([nhIdx])) {
        res.status(400).send({
            message: "Null Value"
        })
    } else {

        //정당한 농활인 지 검증하기
        let selectQuery = "SELECT * FROM nh WHERE idx = ?";
        let selectResult = await db.queryParamArr(selectQuery, [nhIdx]);

        if (!selectResult) {
            res.status(500).send({
                message: "Internal Server Error"
            })

        //정당한 농장이 아닐때
        } else if (selectResult.length < 1) {
            res.status(400).send({
                message: "No nonghwal activity"
            })
        //정당한 농활이라면?
        } else {
            selectQuery = `
            SELECT 
                (nh.personLimit-schedule.person) as availPerson, 
                startTime, 
                state, 
                date_format(startDate, "%Y-%m-%d") as startDate, 
                date_format(endDate, "%Y-%m-%d") as endDate 
            FROM NONGHWAL.schedule, NONGHWAL.nh 
            WHERE schedule.nhIdx = nh.idx
            AND schedule.nhIdx = ?;`;

            selectResult = await db.queryParamArr(selectQuery, [selectResult[0].idx]);

            if (!selectResult) {
                res.status(500).send({
                    message : "Internal Server Error"
                })
            } else {
                res.status(200).send({
                    message: "Success To Get Schedule",
                    data: selectResult
                });
            }
        }
    }
});

//신청하기
router.post('/', async (req, res, next) => {

    //토큰 받기
    let token = req.headers.token;

    //토큰이 없을 때
    if(!token){
        res.status(400).send({
            message : "No token"
        })

    } else {
        let decoded = jwt.verify(token);
        console.log(decoded.user_idx);
        console.log(decoded);
        if (decoded === -1) { //올바르지 않은 토큰일 때
            res.status(500).send({
                message: "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        } else { //정상 사용자일 때

            //인덱스 받기
            let nhIdx = req.body.nhIdx;
            let schIdx = req.body.schIdx;
            let personNum = req.body.personNum || 0;

            if(check.checkNull([nhIdx, schIdx])) {
                res.status(400).send({
                    message: "Null Value"
                })
            } else {

                let selectQuery = "SELECT * FROM schedule WHERE idx = ? AND nhIdx = ?";
                let selectResult = await db.queryParamArr(selectQuery,[schIdx, nhIdx]);

                console.log(selectResult);

                //정당하지 않은 농활, 스케쥴 인덱스일 때
                if (selectResult.length === 0){
                    res.status(400).send({
                        message: "Invalid nhIdx and schIdx"
                    })
                } else { //정당한 농활, 스케쥴 인덱스일 때

                    //1) status 확인 후 신청가능한 지 판단
                    if(selectResult[0]['state'] !== 0) {
                        res.status(400).send({
                            message:"Invalid schIdx"
                        })
                    } else { //1) 유저가 시간대 중복으로 신청했는가?
                        /*토큰으로 들어온 유저가 신청중인 스케쥴을 확인하고,
                          해당 스케쥴이 그 유저가 이미 신청중인 스케쥴에 중복된다면 중복!
                        */
                        selectQuery =
                            `SELECT * 
                            FROM schedule 
                            JOIN (SELECT scheIdx FROM NONGHWAL.activity WHERE activity.state = 0 AND userIdx = ?) as D 
                            WHERE schedule.idx = D.scheIdx 
                            AND ((startDate >= ? AND startDate <= ?) 
                            OR (? >= startDate AND ? <= endDate));`;

                        selectResult = await db.queryParamArr(selectQuery, [decoded.user_idx, selectResult[0]['startDate'], selectResult[0]['endDate'], selectResult[0]['startDate'], selectResult[0]['startDate']]);
                        console.log(selectResult);

                        //있다면 중복!
                        if (selectResult.length >= 1) {
                            res.status(400).send({
                                message:"Duplicate To Time"
                            })
                        //없다면?
                        } else {
                            //유저가 들어갈 자리가 있는가?
                            selectQuery =
                                `SELECT (nh.personLimit - schedule.person) > ? AS isAvailPerson 
                                FROM schedule, nh 
                                WHERE schedule.nhIdx = nh.idx 
                                AND nh.idx = ? 
                                AND schedule.idx = ?;`;

                            selectResult = await db.queryParamArr(selectQuery, [personNum, nhIdx, schIdx]);
                            console.log(selectResult);

                            //쿼리가 제대로 수행되지 않았을 때
                            if (!selectResult) {
                                res.status(500).send({
                                    message : "Internal Server Error"
                                })
                            } else { //제대로 수행 됐다면?

                                //사람수가 사용자가 원하는 숫자 이상인가? 즉, 가능한가?
                                if (selectResult[0].isAvailPerson) {

                                    let insertQuery = `INSERT INTO activity (userIdx, state, scheIdx) VALUES (?, ?, ?);`;
                                    let insertResult = await db.queryParamArr(insertQuery, [decoded.user_idx, 0, schIdx]);

                                    //쿼리 수행 중 에러가 있다면?
                                    if (!insertResult){
                                        res.status(500).send({
                                            message : "Internal Server Error"
                                        });
                                        return;
                                    }

                                    let updateQuery = `UPDATE schedule SET person = person + 1 WHERE idx = ?`;
                                    let updateResult = await db.queryParamArr(updateQuery, [schIdx]);

                                    //업데이트 쿼리 수행 중 에러가 있다면?
                                    if (!updateResult){
                                        res.status(500).send({
                                            message : "Internal Server Error"
                                        });
                                        return;
                                    }

                                    res.status(200).send({
                                        message: "Success To Request For Application"
                                    })
                                } else {
                                    res.status(400).send({
                                        message:"Fail To Request For Application, No Available Person Number"
                                    })
                                }
                            }

                        }
                    }
                }
            }
        }
    }

});

module.exports = router;
