const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const check = require('../../../module/check');

router.get('/', async (req, res, next) => {

    let areaIdx = req.query.idx;

    if (check.checkNull([areaIdx])){
        res.status(400).send({
            message: "Null Value"
        })
    }

    else {
        console.log(areaIdx);

        if (check.checkMapRangeOut(areaIdx)) {
            res.status(400).send({
                message: "Invalid Value"
            })

        } else {
            let selectQuery =
                `SELECT 
                    nh.idx,
                    farm.idx AS farmIdx, 
                    nh.name, 
                    nh.price, 
                    nh.star, 
                    nh.period, 
                    farm.addr, 
                    substring_index(group_concat(farm_img.img separator ','), ',', 1) as img  
                FROM NONGHWAL.farm_img, NONGHWAL.nh LEFT 
                JOIN NONGHWAL.farm ON nh.farmIdx = farm.idx WHERE addrIdx = ? 
                AND farm_img.farmIdx = farm.idx 
                group by idx;`;

            let selectResult = await db.queryParamArr(selectQuery, areaIdx);

            if (! selectResult) {
                res.status(500).send({
                    message : "Internal Server Error"
                });
            } else {
                res.status(200).send({
                    message: "Success To Get Nh Info",
                    nhInfo: selectResult
                })
            }


        }
    }



});


module.exports = router;
