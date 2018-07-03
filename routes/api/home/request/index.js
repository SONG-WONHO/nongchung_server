const express = require('express');
const router = express.Router();
const check = require('../../../../module/check');
const db = require('../../../../module/db');

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

router.post('/', async (req, res, next) => {

});

module.exports = router;
