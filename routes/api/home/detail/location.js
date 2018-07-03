const express = require('express');
const router = express.Router();
const check = require('../../../../module/check');
const db = require('../../../../module/db');
//테스트용입니다.
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
                message : "Internal Server Error"
            })

        //정당한 농장이 아닐때
        } else if (selectResult.length < 1) {
            res.status(400).send({
                message: "No nonghwal activity"
            })

        //정당한 농활이라면?
        } else {
            selectQuery = "SELECT * FROM farm WHERE idx = ?";
            selectResult = await db.queryParamArr(selectQuery, [selectResult[0]['farmIdx']]);

            // address to geoLocation 추가하기

            res.status(200).send({
                "message":"Success To Get Location",
                "location":selectResult[0]['addr'],
                "geoLocation":{
                    "latitude":130,
                    "longitude":150
                }
            })
        }
    }

});

module.exports = router;
