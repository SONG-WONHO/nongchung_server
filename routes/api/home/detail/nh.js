const express = require('express');
const router = express.Router();
const moment = require('moment');
const check = require('../../../../module/check');
const db = require('../../../../module/db');
const jwt = require('../../../../module/jwt');

//농활 디테일 보기 라우터
router.get('/', async (req, res, next) => {

    //토큰이 있는 지 없는 지 검증하기
    let token = req.headers.token;
    

    //토큰이 없다면? ==> 기존의 방식으로!
    if (!token) {

        //어떤 농활인 지 받기
        let nhIdx = req.query.idx;
        console.log(nhIdx);
        //비어있는 값인지 검증
        if(check.checkNull([nhIdx])) {
            res.status(400).send({
                message: "Null Value"
            })
        }
        //정상적으로 들어왔다면?
        else {

            //정당한 농활인 지 검증하기
            let selectQuery =
                `
                SELECT * 
                FROM nh 
                WHERE idx = ?
                `;
            let selectResult = await db.queryParamArr(selectQuery, [nhIdx]);

            //쿼리 수행도중 에러가 있을 때
            if (!selectResult) {
                res.status(500).send({
                    message : "Internal Server Error"
                })
            }
            //에러가 없을 때, 농활리스트가 없다면?
            else if (selectResult.length < 1) {
                res.status(400).send({
                    message: "No nonghwal activity"
                })

            }
            //농활리스트가 있다면?
            else {

                //농활의 모든 스케쥴 뽑기
                let selectScheduleQuery =
                    `
                    SELECT 
                        nh.period,
                        schedule.idx, 
                        state,
                        date_format(startDate, "%Y-%m-%d") as startDate,
                        date_format(endDate, "%Y-%m-%d") as endDate,
                        (personLimit - person) AS availPerson
                    FROM schedule, nh
                    WHERE nhIdx = ? 
                    AND deadline > curdate()
                    AND schedule.nhIdx = nh.idx;
                    `;

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
                //

                //스케츌 총 인원  쿼리
                let selectFriendQuery = `SELECT nh.personLimit, idx AS nhIdx
                FROM nh 
                JOIN (SELECT schedule.nhIdx  FROM schedule WHERE schedule.idx = ?) AS schedule 
                ON schedule.nhIdx = nh.idx
                `;

                // 성비 쿼리 & 참여인원 쿼리
                let selectSexRatioQuery = `SELECT user.sex, userIdx, birth
                FROM activity
                JOIN(SELECT idx, sex, (YEAR(CURDATE())-YEAR(birth)+1) AS birth FROM user) AS user
                ON(userIdx = user.idx)
                WHERE scheIdx = ?
                group by userIdx;`;
                

                //대원결과
                //1 스케쥴 총 인원 쿼리 2. 성비 쿼리 3. 참여 인원 쿼리 
                let selectFriendResult = await db.queryParamArr(selectFriendQuery, [selectScheduleResult[0].idx]);
                let selectSexRatioResult = await db.queryParamArr(selectSexRatioQuery,[selectScheduleResult[0].idx]);
                console.log(selectSexRatioResult);
                
                //남녀 뽑기                
                let woman  = 0;
                let man = 0;
                let age = 0;
                for (let i = 0; i < selectSexRatioResult.length; i++){
                    if(selectSexRatioResult[i].sex === 1){
                        man++;
                    }else{
                        woman++;
                    }
                    age += selectSexRatioResult[i].birth
                }
                age = age/selectSexRatioResult.length
                if(selectSexRatioResult.length === 0){
                    age = 0;
                }
                
                console.log(age);

                //쿼리 수행도중 에러가 있을 때
                if (!selectFriendResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                    return;
                }

                //이미지 뽑기
                let selectImageQuery =
                    `
                    SELECT img 
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
                    `
                    SELECT 
                        nh.description, 
                        star, 
                        addr, 
                        nh.name, 
                        nh.price,
                        nh.period,
                        farmer.fname, 
                        farmer.comment, 
                        farmer.img,
                        nh.farmIdx 
                    FROM nh, farm, farmer 
                    WHERE nh.farmIdx = farm.idx 
                    AND farm.farmerIdx = farmer.idx 
                    AND nh.idx = ?;
                    `;

                //쿼리결과
                selectResult = await db.queryParamArr(selectQuery,[nhIdx]);

                //쿼리 수행 중 에러가 있을 때
                if (!selectResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                    return;
                }
                //참여대원 정보
                
                let friendsInfo = [{
                    womanCount : woman ,
                    manCount : man ,
                    attendCount : selectSexRatioResult.length,
                    personLimit :  selectFriendResult[0].personLimit,
                    ageAverage : age,
                    name: "temp",
                    nickname: "temp",
                    img: "temp"
                }];

                //농활 정보 만들기
                let nhInfo = {
                    "nhIdx" : nhIdx,
                    "addr": selectResult[0].addr,
                    "name": selectResult[0].name,
                    "star": selectResult[0].star,
                    "description": selectResult[0].description,
                    "price":selectResult[0].price,
                    "period":selectResult[0].period
                };

                //농부 정보 만들기
                let farmerInfo = {
                    "name": selectResult[0].fname,
                    "comment":selectResult[0].comment,
                    "img":selectResult[0].img,
                    "farmIdx": selectResult[0].farmIdx
                };

                //농활 스케쥴 뽑는 쿼리
                selectQuery =
                    `
                    SELECT date_format(time, "%H:%i") AS time, activity 
                    FROM nh_sche WHERE nhIdx = ?;
                    `;

                //농활 스케쥴 결과
                selectResult = await db.queryParamArr(selectQuery,[nhIdx]);

                //쿼리 수행도중 에러가 있다면?
                if(!selectResult){
                    res.status(500).send({
                        message : "Internal Server Error"
                    });
                    return;
                }

                res.status(200).send({
                    "message":"Success To Get Detail Information",
                    "image":imageInfo,
                    "nhInfo":nhInfo,
                    "friendsInfo":friendsInfo,
                    "farmerInfo":farmerInfo,
                    "schedule":selectResult,
                    "nearestStartDate":selectScheduleResult[0].startDate,
                    "nearestEndDate":selectScheduleResult[0].endDate,
                    "allStartDate":selectScheduleResult
                })
            }
        }
    }
    //토큰이 있다면?
    else {

        //토큰이 있다면? ==> 이미 신청한 농활이라면? 취소하기 할 수있도록 정보 하나 추가해줘야 한다!!
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

                }
                //에러가 없을 때 - 정당하지 않은 농활 인덱스라면?
                else if (selectResult.length < 1) {
                    res.status(400).send({
                        message: "No nonghwal activity"
                    })

                }
                //에러가 없을 때 - 정당한 농활 인덱스라면?
                else {

                    //모든 스케쥴 뽑기
                    let selectScheduleQuery =
                        `
                        SELECT 
                            nh.period,
                            schedule.idx, 
                            date_format(startDate, "%Y-%m-%d") as startDate,
                            date_format(endDate, "%Y-%m-%d") as endDate,
                            state,
                            (personLimit - person) AS availPerson
                        FROM schedule, nh 
                        WHERE nhIdx = ? 
                        AND deadline > curdate()
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

                    //대원뽑기
                    /*let selectFriendQuery =
                        `SELECT 
                            name, 
                            nickname, 
                            img 
                        FROM user 
                        JOIN (SELECT userIdx FROM activity WHERE scheIdx = ? AND state = 1) AS activity 
                        ON activity.userIdx = user.idx;`;*/

                    //스케츌 총 인원  쿼리
                    let selectFriendQuery = `SELECT nh.personLimit, idx AS nhIdx
                    FROM nh 
                    JOIN (SELECT schedule.nhIdx  FROM schedule WHERE schedule.idx = ?) AS schedule 
                    ON schedule.nhIdx = nh.idx
                    `;

                    // 성비 쿼리 & 참여인원 쿼리
                    let selectSexRatioQuery = `SELECT  birth,user.sex, userIdx
                    FROM activity
                    JOIN(SELECT idx, sex, (YEAR(CURDATE())-YEAR(birth)+1) AS birth FROM user) AS user
                    ON(userIdx = user.idx)
                    WHERE scheIdx = ?
                    group by userIdx;`;


                    

                    //대원결과
                    //1 스케쥴 총 인원 쿼리 2. 성비 쿼리 3. 참여 인원 쿼리 
                    let selectFriendResult = await db.queryParamArr(selectFriendQuery, [selectScheduleResult[0].idx]);
                    let selectSexRatioResult = await db.queryParamArr(selectSexRatioQuery,[selectScheduleResult[0].idx]);
                    console.log(selectSexRatioResult);
                    
                    //남녀 뽑기                
                    let woman  = 0;
                    let man = 0;
                    let age = 0;
                    for (let i = 0; i < selectSexRatioResult.length; i++){
                        if(selectSexRatioResult[i].sex == 1){
                            man++;
                        }else{
                            woman++;
                        }
                        age += selectSexRatioResult[i].birth; 
                    }
                    console.log(age);
                    age =  age/selectSexRatioResult.length;
                    if(selectSexRatioResult.length == 0){
                        age = 0;
                    }
                    console.log(age);
                    console.log(selectFriendResult[0].personLimit);

                    //쿼리 수행도중 에러가 있을 때
                    if (!selectFriendResult && ! selectSexRatioResult) {
                        res.status(500).send({
                            message : "Internal Server Error"
                        });
                        return;
                    }


                    //내가 신청한 농활인지 확인하기 - 모든 농활리스트
                    let checkMineNhQuery =
                        `
                        SELECT scheIdx 
                        FROM activity 
                        JOIN (SELECT * FROM NONGHWAL.schedule) AS schedule
                        ON schedule.idx = activity.scheIdx
                        WHERE nhIdx = ?
                        AND userIdx = ?
                        AND (schedule.state = 0 OR schedule.state= 1)
                        AND (activity.state = 1 OR activity.state = 0);
                        `;

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
                    for (let value of checkMineResult) {
                        checkMineNhResult.push(value.scheIdx);
                    }

                    //이미지 뽑기
                    let selectImageQuery =
                        `
                        SELECT img 
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

                    //이미지가 있다면
                    let imageInfo = [];

                    for (let i = 0; i < selectImageResult.length; i++) {
                        imageInfo.push(selectImageResult[i].img);
                    }

                    selectQuery =
                        `
                        SELECT 
                            nh.description, 
                            star, 
                            addr, 
                            nh.name, 
                            nh.price,
                            nh.period,
                            farmer.fname, 
                            farmer.comment, 
                            farmer.img,
                            nh.farmIdx 
                        FROM nh, farm, farmer 
                        WHERE nh.farmIdx = farm.idx 
                        AND farm.farmerIdx = farmer.idx 
                        AND nh.idx = ?;
                        `;

                    selectResult = await db.queryParamArr(selectQuery,[nhIdx]);

                    if (!selectResult) {
                        res.status(500).send({
                            message : "Internal Server Error"
                        });
                        return;
                    }

                    let checkBookedQuery =
                        `
                        SELECT EXISTS (SELECT * FROM bookmark WHERE userIdx = ? AND nhIdx = ?) as isBooked
                        `;

                    let checkBookedResult = await db.queryParamArr(checkBookedQuery, [userIdx, nhIdx]);

                    //쿼리 수행 도중 에러가 있을 때
                    if (!checkBookedResult) {
                        res.status(500).send({
                            message : "Internal Server Error"
                        });
                        return;
                    }
                    //참여대원 정보
                    
                    let friendsInfo = [{
                        womanCount : woman ,
                        manCount : man ,
                        attendCount : selectSexRatioResult.length,
                        personLimit :  selectFriendResult[0].personLimit,
                        ageAverage : age,
                        name: "temp",
                        nickname: "temp",
                        img: "temp"
                    }];

                    //농활 정보
                    let nhInfo = {
                        "nhIdx": nhIdx,
                        "addr": selectResult[0].addr,
                        "name": selectResult[0].name,
                        "star": selectResult[0].star,
                        "description": selectResult[0].description,
                        "price":selectResult[0].price,
                        "period":selectResult[0].period,
                        "isBooked":checkBookedResult[0].isBooked
                    };

                    //농부 정보
                    let farmerInfo = {
                        "name": selectResult[0].fname,
                        "comment":selectResult[0].comment,
                        "img":selectResult[0].img,
                        "farmIdx": selectResult[0].farmIdx
                    };

                    //농활 스케쥴 뽑기
                    selectQuery =
                        `
                        SELECT date_format(time, "%H:%i") AS time, activity 
                        FROM nh_sche 
                        WHERE nhIdx = ?;
                        `;

                    selectResult = await db.queryParamArr(selectQuery,[nhIdx]);

                    //쿼리 수행도중 에러가 있을 때
                    if(!selectResult){
                        res.status(500).send({
                            message : "Internal Server Error"
                        });
                        return;
                    }

                    res.status(200).send({
                        "message":"Success To Get Detail Information",
                        "image":imageInfo,
                        "nhInfo":nhInfo,
                        "friendsInfo":friendsInfo,                           
                        "farmerInfo":farmerInfo,
                        "schedule":selectResult,
                        "nearestStartDate":selectScheduleResult[0].startDate,
                        "nearestEndDate":selectScheduleResult[0].endDate,
                        "allStartDate":selectScheduleResult,
                        "myScheduleActivities":checkMineNhResult
                    });
                }
            }
        }
    }


});

module.exports = router;
