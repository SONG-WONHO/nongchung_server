const express = require('express');
const router = express.Router();
const db = require('../../../module/db');


/* 테스트용 입니다. */
router.get('/', async (req, res, next) => {
    let selectQuery = `SELECT farm.farm_idx, farm_addr, img, nh_name, nh_price, nh_period, nh_star FROM  NONGHWAL.farm 
    JOIN NONGHWAL.nh ON farm.farm_idx = nh.farm_idx 
    JOIN NONGHWAL.farm_img ON farm.farm_idx = farm_img.farm_idx;`

    let selectResult = await db.queryParamNone(selectQuery);

    console.log(selectResult);

    if(!selectResult){
        res.status(500).send({
            message : "Internal Server Error"
        });
    } else {
        res.status(200).send({
            message : "Success To get information",
            "ads":[
                {
                    "comment":"맛있는 귤과 함께하는 농활 특집",
                    "img":"13.13.123.23/ads/1"
                },
                {
                    "comment":"맛있는 사과와 함께하는 농활 특집",
                    "img":"13.13.123.23/ads/2"
                }
            ],
            "populNh":selectResult,
            "populFarm":selectResult
        })
    }
});

module.exports = router;
