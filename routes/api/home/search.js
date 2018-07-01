const express = require('express');
const router = express.Router();
const check = require('../../../module/check');
const db = require('../../../module/db');
const moment = require('moment');

/* 테스트용 입니다. */
router.get('/', async (req, res, next) => {

    let start = req.query.start;
    let end = req.query.end;
    let person = req.query.person;
    let scontent = req.query.scontent;

    if (!check.checkNull([start, end, person, scontent])){
        res.status(400).send({
            message: "Null Value"
        })
    } else {
        let selectQuery = `SELECT schedule.sche_start_date, schedule.sche_end_date, nh.nh_idx, nh.nh_person_limit, schedule.sche_person, nh.nh_name, farm.farm_name 
        FROM NONGHWAL.nh, NONGHWAL.schedule, NONGHWAL.farm 
        WHERE schedule.nh_idx = nh.nh_idx AND nh.farm_idx = farm.farm_idx;`

        let selectResult = await db.queryParamNone(selectQuery);

        console.log(selectResult);

        if(!selectResult) {
            res.status(500).send({
                message : "Internal Server Error"
            })
        } else {
            //시간 변경
            for (let i = 0; i < selectResult.length; i++){
                selectResult[i].sche_start_date = moment(selectResult[i].sche_start_date).format('YYYY-MM-DD HH:mm:ss');
                selectResult[i].sche_end_date = moment(selectResult[i].sche_end_date).format('YYYY-MM-DD HH:mm:ss');
            }

        }

        console.log(selectResult);
    }
});

module.exports = router;
