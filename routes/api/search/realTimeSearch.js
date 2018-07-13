const express = require('express');
const router = express.Router();
const db = require('../../../module/db');

router.get('/', async (req, res, next) => {

    //농활인덱스, 농활이름, 가격, 지역인덱스, 시작, 끝
    let selectQuery =
        `
        SELECT nhIdx, nh.name, price, addrIdx, addr 
        FROM (SELECT idx AS nhIdx, name, price, farmIdx FROM nh) AS nh LEFT 
        JOIN farm 
        ON nh.farmIdx = farm.idx;
        `;

    let selectResult = await db.queryParamNone(selectQuery);

    //시작날짜, 끝나는 날짜
    let selectScheduleSelect =
        `
        select nhIdx, group_concat(startDate) AS startDate, group_concat(endDate) AS endDate 
        from schedule 
        group by nhIdx;
        `;

    let selectScheduleResult = await db.queryParamNone(selectScheduleSelect);

    //쿼리 수행도중 에러가 있을 때
    if (!selectResult && !selectScheduleResult) {
        res.status(500).send({
            message : "Internal Server Error"
        });
    }

    //쿼리가 잘 수행 됐다면?
    else {
        console.log(selectScheduleResult);

        //스케쥴 필터 처리
        selectScheduleResult.filter((value) => {

            value.startDate = (value.startDate).split(',');
            value.endDate = (value.endDate).split(',');
        });

        console.log(selectScheduleResult);

        res.status(200).send({
            message:"Success To Get Nh Info",
            nhInfo: selectResult,
            scheduleInfo: selectScheduleResult
        })
    }

});

module.exports = router;
