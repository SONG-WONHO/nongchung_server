const express = require('express');
const router = express.Router();
const check = require('../../../../module/check');
const db = require('../../../../module/db');
const jwt = require('../../../../module/jwt');
const scheduleRouter = require('./schedule');
const userRouter = require('./user');

router.use('/schedule', scheduleRouter);
router.use('/user',userRouter);

//신청하기
router.post('/', async (req, res, next) => {

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
        else { //정상 사용자일 때

            //인덱스 받기
            let nhIdx = req.body.nhIdx;
            let schIdx = req.body.schIdx;
            let personNum = req.body.personNum || 0;
            let flag = 0;

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
                                `SELECT (nh.personLimit - schedule.person) > ? AS isAvailPerson, nh.personLimit, schedule.person 
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
                                    
                                    let insertQuery = `INSERT INTO activity (userIdx, scheIdx) VALUES (?, ?);`;
                                    let insertResult = await db.queryParamArr(insertQuery, [decoded.user_idx, schIdx]);
                                    //쿼리 수행 중 에러가 있다면?
                                    if (!insertResult){
                                        res.status(500).send({
                                            message : "Internal Server Error"
                                        });
                                        return;
                                    }
                                    //신청을 눌르고 입금의 경우는 0으로 바뀌는 경우가 있다.
                                    
                                    //activity가 1인 거 한해서 person plus를 해준다.
                                    
                                    let updateQuery = `UPDATE schedule SET person = 
                                    (SELECT count(*) FROM activity WHERE scheIdx = ? AND state = ?) 
                                    WHERE idx = ?`;
                                    let updateResult = await db.queryParamArr(updateQuery, [schIdx,1,schIdx]);
                                    let countQuery = `SELECT count(*) AS personCount FROM activity WHERE scheIdx = ?  AND state = ?`;
                                    let countResult = await db.queryParamArr(countQuery,[schIdx,1]);
                                    console.log(countResult[0].personCount);


                                    let stateQuery = `UPDATE schedule SET state = 
                                    CASE
                                    WHEN 
                                        person >= (SELECT personLimit FROM nh WHERE idx = ?)
                                        THEN 1
                                        ELSE 0
                                        END
                                    WHERE idx = ?`;//만약에 리미트를 person이 넘었으면??--> 0: 신청가능 1 
                                    let stateResult = await db.queryParamArr(stateQuery, [nhIdx,schIdx]);

                                    //업데이트 쿼리 수행 중 에러가 있다면?
                                        if (!updateResult && !stateQuery && !countResult){
                                            res.status(500).send({
                                                message : "Internal Server Error"
                                                });
                                                return;
                                            }  

                                            res.status(200).send({
                                                message: "Success To Request For Application",
                                                maxPerson: selectResult[0].personLimit,
                                                currentPerson: countResult[0].personCount
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

//취소하기
router.put('/', async (req, res, next) => {

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
        else { //정상 사용자일 때

            //농활인덱스, 스케쥴인덱스 받기
            let nhIdx = req.body.nhIdx;
            let schIdx = req.body.schIdx;
            let userIdx = decoded.user_idx;

            console.log(nhIdx, schIdx);

            //빈 값인지 확인
            if (check.checkNull([nhIdx, schIdx])){
                res.status(400).send({
                    message: "Null Value"
                })
            }
            //값이 제대로 들어왔으면?
            else {
                let deleteQuery = `DELETE FROM activity WHERE userIdx= ? AND scheIdx = ?;`;
                let deleteResult = await db.queryParamArr(deleteQuery, [userIdx, schIdx]);

                //쿼리가 제대로 입력 안됐으면
                if(!deleteResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                    return;
                }
                // state가 1인 경우에 의해서
                let updateQuery = `UPDATE schedule SET person = 
                (CASE WHEN ((SELECT count(*) FROM activity WHERE scheIdx = ? AND state = ?)<0)
                THEN 0 
                ELSE
                (SELECT count(*) FROM activity WHERE scheIdx = ? AND state = ?)
                END
                )
                WHERE idx = ?`;
                let updateResult = await db.queryParamArr(updateQuery, [schIdx,1,schIdx,1,schIdx]);
                let selectQuery = `SELECT a.scheIdx AS myScheIdx FROM NONGHWAL.activity AS a, NONGHWAL.user AS u WHERE a.userIdx = u.idx AND u.idx = ?`;
                let selectResult = await db.queryParamArr(selectQuery,[decoded.user_idx]);
                let myScheIdx1 = [];
                console.log(selectResult);
                for(let i =0; i<selectResult.length;i++){
                    console.log(selectResult[i].myScheIdx);
                    myScheIdx1.push(selectResult[i].myScheIdx);
                }
                
                console.log(myScheIdx1);

                //쿼리가 제대로 입력 안됐으면
                if(!updateResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                    return;
                }

                res.status(200).send({
                    message:"Success To Cancel",
                    myScheduleActivities : myScheIdx1
                })
            }
        }
    }
});

module.exports = router;
