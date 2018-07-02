const express = require('express');
const router = express.Router();
const check = require('../../../../module/check');
const db = require('../../../../module/db');

//테스트용입니다.
router.get('/', async (req, res, next) => {

    //어떤 농활인 지 받기
    let nhIdx = req.query.idx;

    //비어있는 값인지 검증
    if(check.checkNull([nhIdx])) {
        res.status(400).send({
            message: "Null Value"
        })
    } else {

        //정당한 농활인 지 검증하기
        let selectQuery = "SELECT * FROM nh WHERE idx = ?";
        let selectResult = await db.queryParamArr(selectQuery, [nhIdx]);

        if (!selectResult) {
            res.status(500).send({
                message : "Internal Server Error"
            })

        //정당한 농장이 아닐때
        } else if (selectResult.length < 1) {
            res.status(400).send({
                message: "No nonghwal activity"
            })

        //정당한 농활이라면?
        } else {
            selectQuery = `SELECT nh.description, star, addr, nh.name, farmer.fname, farmer.comment, farmer.img FROM nh, farm, farmer WHERE nh.farmIdx = farm.idx AND farm.farmerIdx = farmer.idx AND nh.idx = ?;`;
            selectResult = await db.queryParamArr(selectQuery,[nhIdx]);

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
                "description": selectResult[0].description
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

            res.status(200).send({
                "message":"Success To Get Detail Information",
                "nhInfo":nhInfo,
                "farmerInfo":farmerInfo,
                "schedule":selectResult
            })
        }
    }
});

module.exports = router;
