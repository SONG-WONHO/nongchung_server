const express = require('express');
const router = express.Router();
const check = require('../../../../module/check');
const db = require('../../../../module/db');
const jwt = require('../../../../module/jwt');

//농활 디테일 보기!
router.get('/', async (req, res, next) => {

    //토큰이 있는 지 없는 지 검증하기
    let token = req.headers.token;

    //토큰이 없다면? ==> 기존의 방식으로!
    if (!token) {

        //어떤 농활인 지 받기
        let nhIdx = req.query.idx;

        //비어있는 값인지 검증
        if(check.checkNull([nhIdx])) {
            res.status(400).send({
                message: "Null Value"
            })
        }
        //정상적으로 들어왔다면?
        else {

            //정당한 농활인 지 검증하기
            let selectQuery = "SELECT * FROM nh WHERE idx = ?";
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

                //모든 가까운 스케쥴 뽑기
                let selectScheduleQuery =
                    `SELECT 
                        schedule.idx, 
                        state,
                        date_format(startDate, "%Y-%m-%d") as startDate,
                        (personLimit - person) AS availPerson
                    FROM schedule, nh
                    WHERE nhIdx = ? 
                    AND startDate > curdate()
                    AND schedule.nhIdx = nh.idx;`;

                //모든 스케쥴 결과
                let selectScheduleResult = await db.queryParamArr(selectScheduleQuery, [nhIdx]);

                //쿼리 수행도중 에러가 있을때
                if (!selectScheduleResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                    return;
                }

                console.log(selectScheduleResult);

                //대원뽑기
                let selectFriendQuery =
                    `SELECT 
                    name, 
                    nickname, 
                    img 
                FROM user 
                JOIN (SELECT userIdx FROM activity WHERE scheIdx = ? AND state = 0) AS d 
                ON d.userIdx = user.idx;`;

                //대원결과
                let selectFriendResult = await db.queryParamArr(selectFriendQuery, [selectScheduleResult[0].idx]);

                //쿼리 수행도중 에러가 있을 때
                if (!selectFriendResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                    return;
                }

                //이미지 뽑기
                let selectImageQuery =
                    `SELECT img 
                    FROM NONGHWAL.farm_img, nh 
                    WHERE nh.idx = ? 
                    AND nh.farmIdx = farm_img.farmIdx;`;

                //이미지 불러오기
                let selectImageResult = await db.queryParamArr(selectImageQuery, [nhIdx]);

                //쿼리 수행도중 에러가 있을 때
                if (!selectImageResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                    return;
                }

                //불러온 이미지가 있다면? ==> 클라 요청대로 배열로 만들어서 주기
                let imageInfo = [];

                for (let i = 0; i < selectImageResult.length; i++) {
                    imageInfo.push(selectImageResult[i].img);
                }

                //농활, 농부 정보 뽑을 쿼리
                selectQuery =
                    `SELECT 
                    nh.description, 
                    star, 
                    addr, 
                    nh.name, 
                    nh.price,
                    nh.period,
                    farmer.fname, 
                    farmer.comment, 
                    farmer.img 
                FROM nh, farm, farmer 
                WHERE nh.farmIdx = farm.idx 
                AND farm.farmerIdx = farmer.idx 
                AND nh.idx = ?;`;

                //쿼리결과
                selectResult = await db.queryParamArr(selectQuery,[nhIdx]);

                console.log(selectResult);

                if (!selectResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                    return;
                }

                let nhInfo = {
                    "addr": selectResult[0].addr,
                    "name": selectResult[0].name,
                    "star": selectResult[0].star,
                    "description": selectResult[0].description,
                    "price":selectResult[0].price,
                    "period":selectResult[0].period
                };

                let farmerInfo = {
                    "name": selectResult[0].fname,
                    "comment":selectResult[0].comment,
                    "img":selectResult[0].img
                };

                //농활 스케쥴 뽑는 쿼리
                selectQuery = `SELECT time, activity FROM nh_sche WHERE nhIdx = ?;`;
                //농활 스케쥴 결과
                selectResult = await db.queryParamArr(selectQuery,[nhIdx]);

                //쿼리 수행도중 에러가 있다면?
                if(!selectResult){
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                    return;
                }

                console.log(nhInfo);

                res.status(200).send({
                    "message":"Success To Get Detail Information",
                    "image":imageInfo,
                    "nhInfo":nhInfo,
                    "friendsInfo":selectFriendResult,
                    "farmerInfo":farmerInfo,
                    "schedule":selectResult,
                    "nearestStartDate":selectScheduleResult[0].startDate,
                    "allStartDate":selectScheduleResult
                })
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

                //정당한 농활인 지 검증하기
                let selectQuery = "SELECT * FROM nh WHERE idx = ?";
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

                    //모든 스케쥴 뽑기
                    let selectScheduleQuery =
                        `SELECT 
                            nh.idx, 
                            date_format(startDate, "%Y-%m-%d") as startDate,
                            state,
                            (personLimit - person) AS availPerson
                        FROM schedule, nh 
                        WHERE nhIdx = ? 
                        AND startDate > curdate()
                        AND schedule.nhIdx = nh.idx;`;

                    //스케쥴 결과
                    let selectScheduleResult = await db.queryParamArr(selectScheduleQuery, [nhIdx]);

                    //쿼리 수행도중 에러가 있을때
                    if (!selectScheduleResult) {
                        res.status(500).send({
                            message : "Internal Server Error"
                        });
                        return;
                    }

                    console.log(selectScheduleResult, selectResult[0].availPerson);
                    console.log(1);

                    //대원뽑기
                    let selectFriendQuery =
                        `SELECT 
                            name, 
                            nickname, 
                            img 
                        FROM user 
                        JOIN (SELECT userIdx FROM activity WHERE scheIdx = ? AND state = 0) AS d 
                        ON d.userIdx = user.idx;`;

                    //대원결과
                    let selectFriendResult = await db.queryParamArr(selectFriendQuery, [selectScheduleResult[0].idx]);

                    //쿼리 수행도중 에러가 있을 때
                    if (!selectFriendResult) {
                        res.status(500).send({
                            message : "Internal Server Error"
                        });
                        return;
                    }


                    //내가 신청한 농활인지 확인하기 - 모든 농활리스트
                    let checkMineNhQuery =
                        `SELECT scheIdx 
                        FROM activity JOIN (SELECT * FROM NONGHWAL.schedule) 
                        AS d 
                        ON d.idx = activity.scheIdx
                        WHERE nhIdx = ?
                        AND userIdx = ?
                        AND d.state = 0
                        AND activity.state = 0;`;
                    let checkMineResult = await db.queryParamArr(checkMineNhQuery, [nhIdx, userIdx]);

                    //쿼리 수행도중 에러가 있을 때
                    if (!checkMineResult) {
                        res.status(500).send({
                            message : "Internal Server Error"
                        });
                        return;
                    }

                    //배열로 만들어서 전달
                    let checkMineNhResult = [];
                    for (let v of checkMineResult) {
                        checkMineNhResult.push(v.scheIdx);
                    }

                    //이미지 뽑기
                    let selectImageQuery =
                        `SELECT img 
                        FROM NONGHWAL.farm_img, nh 
                        WHERE nh.idx = ? 
                        AND nh.farmIdx = farm_img.farmIdx;`;

                    //이미지 불러오기
                    let selectImageResult = await db.queryParamArr(selectImageQuery, [nhIdx]);

                    //쿼리 수행도중 에러가 있을 때
                    if (!selectImageResult) {
                        res.status(500).send({
                            message : "Internal Server Error"
                        });
                        return;
                    }

                    //있다면
                    let imageInfo = [];

                    for (let i = 0; i < selectImageResult.length; i++) {
                        imageInfo.push(selectImageResult[i].img);
                    }

                    selectQuery =
                        `SELECT 
                            nh.description, 
                            star, 
                            addr, 
                            nh.name, 
                            nh.price,
                            nh.period,
                            farmer.fname, 
                            farmer.comment, 
                            farmer.img 
                        FROM nh, farm, farmer 
                        WHERE nh.farmIdx = farm.idx 
                        AND farm.farmerIdx = farmer.idx 
                        AND nh.idx = ?;`;

                    selectResult = await db.queryParamArr(selectQuery,[nhIdx]);

                    console.log(selectResult);

                    if (!selectResult) {
                        res.status(500).send({
                            message : "Internal Server Error"
                        });
                        return;
                    }

                    let checkBookedQuery = `SELECT EXISTS (SELECT * FROM bookmark WHERE userIdx = ? AND nhIdx = ?) as isBooked`;
                    let checkBookedResult = await db.queryParamArr(checkBookedQuery, [userIdx, nhIdx]);

                    if (!checkBookedResult) {
                        res.status(500).send({
                            message : "Internal Server Error"
                        });
                        return;
                    }

                    console.log(checkBookedResult);

                    let nhInfo = {
                        "addr": selectResult[0].addr,
                        "name": selectResult[0].name,
                        "star": selectResult[0].star,
                        "description": selectResult[0].description,
                        "price":selectResult[0].price,
                        "period":selectResult[0].period,
                        "isBooked":checkBookedResult[0].isBooked
                    };

                    let farmerInfo = {
                        "name": selectResult[0].fname,
                        "comment":selectResult[0].comment,
                        "img":selectResult[0].img
                    };

                    selectQuery = `SELECT time, activity FROM nh_sche WHERE nhIdx = ?;`;
                    selectResult = await db.queryParamArr(selectQuery,[nhIdx]);

                    if(!selectResult){
                        res.status(500).send({
                            message : "Internal Server Error"
                        });
                        return;
                    }

                    console.log(nhInfo);
                    console.log(userIdx);

                    res.status(200).send({
                        "message":"Success To Get Detail Information",
                        "image":imageInfo,
                        "nhInfo":nhInfo,
                        "friendsInfo":selectFriendResult,
                        "farmerInfo":farmerInfo,
                        "schedule":selectResult,
                        "nearestStartDate":selectScheduleResult[0].startDate,
                        "allStartDate":selectScheduleResult,
                        "myScheduleActivities":checkMineNhResult
                    });
                }
            }
        }
    }


});

module.exports = router;
