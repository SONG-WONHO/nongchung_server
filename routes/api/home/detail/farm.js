const express = require('express');
const router = express.Router();
const db = require('../../../../module/db');
const jwt = require('../../../../module/jwt');
const check = require('../../../../module/check');


//농장 프로필
router.get('/', async (req, res, next) => {

    //농장 인덱스 받기
    let farmIdx = req.query.idx;

    //토큰 받기
    let token = req.headers.token;

    //농장 인덱스가 없다면?
    if(check.checkNull([farmIdx])){
        res.status(400).send({
            message: "Null value"
        })
    }

    //농장 인덱스가 있다면?
    else{
        //토큰이 없다면
        if(!token){

            //농장 뽑기
            let farmQuery =
                `
                SELECT
                    farm.idx,
					farm.name AS farmName,
                    farm.addr AS farmAddr,
                    farmer.fname AS farmerName,
                    farmer.fphone AS farmerPhone,
                    farmer.comment AS farmerComment,
                    farmer.img AS farmerImg
                FROM (
                    SELECT * FROM farm 
                    INNER JOIN (SELECT farmIdx, img AS farmImg FROM farm_img group by farmIdx) AS farm_img 
                    ON farm.idx = farm_img.farmIdx) AS farm 
                LEFT JOIN farmer 
                ON farm.farmerIdx = farmer.idx
                WHERE farm.idx = ?;
                `;

            let farmResult = await db.queryParamArr(farmQuery,[farmIdx]);

            //농장 인덱스에 해당하는 농활 뽑기
            let nhInfoQuery =
                `
                SELECT 
                    nh.idx AS nhIdx, 
                    price, 
                    name AS nhName, 
                    period, 
                    farm_img.img AS farmImg 
                FROM nh 
                LEFT JOIN (SELECT * FROM farm_img group by farmIdx) AS farm_img 
                ON farm_img.farmIdx = nh.farmIdx 
                WHERE nh.farmIdx = ?;
                `;

            let nhInfoResult = await db.queryParamArr(nhInfoQuery,[farmIdx]);

            //쿼리 수행 중에 에러가 있다면?
            if(!nhInfoResult && !farmResult ){
                res.status(500).send({
                    message:"Internal server Error!"
                });
            }

            //에러 없이 잘 됐다면?
            else{
                res.status(200).send({
                    message:"Success To Show Farmer Profile",
                    farmerInfo : farmResult[0],
                    nhInfo : nhInfoResult
                })
            }

        }
        //토큰이 있다면?
        else{

            let decoded = jwt.verify(token);

            if (decoded === 10) {
                res.status(500).send({
                    message : "token err",//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
                    expired: 1
                });

                return;
            }

            //토큰 에러
            if(decoded === -1){
                res.status(500).send({
                    message:"token error"
                });
            }

            //토큰 에러가 없다면?
            else{

                //농장 프로필 얻기
                let farmQuery =
                    `
                    SELECT
                        farm.idx,
                        farm.name AS farmName,
                        farm.addr AS farmAddr,
                        farmer.fname AS farmerName,
                        farmer.fphone AS farmerPhone,
                        farmer.comment AS farmerComment,
                        farmer.img AS farmerImg
                    FROM (
                        SELECT * FROM farm 
                        INNER JOIN (SELECT farmIdx, img AS farmImg FROM farm_img group by farmIdx) AS farm_img 
                        ON farm.idx = farm_img.farmIdx) AS farm 
                    LEFT JOIN farmer 
                    ON farm.farmerIdx = farmer.idx
                    WHERE farm.idx = ?;
                    `;

                //결과
                let farmResult = await db.queryParamArr(farmQuery,[farmIdx]);

                //농장 인덱스에 해당하는 농활 뽑기
                let nhInfoQuery =
                    `
                    SELECT 
                        nh.idx AS nhIdx, 
                        price, 
                        name AS nhName, 
                        period, 
                        farm_img.img AS farmImg,
                        0 AS isBooked 
                    FROM nh 
                    LEFT JOIN (SELECT * FROM farm_img group by farmIdx) AS farm_img 
                    ON farm_img.farmIdx = nh.farmIdx 
                    WHERE nh.farmIdx = ?;                    
                    `;

                let nhInfoResult = await db.queryParamArr(nhInfoQuery, [farmIdx]);

                let selectBookQuery =
                    `
                    SELECT nhIdx 
                    FROM bookmark 
                    WHERE userIdx = ?
                    `;

                let selectBookResult = await db.queryParamArr(selectBookQuery, [decoded.user_idx]);

                //쿼리 수행도중 에러가 있을 때
                if (!selectBookResult && !nhInfoResult && !farmResult) {
                    res.status(500).send({
                        message:"Internal server Error!"
                    });

                    return;
                }

                let bookList = [];

                // 예약한 것이 있을 때
                if (selectBookResult.length >= 1) {

                    for (let i = 0; i < selectBookResult.length; i ++) {
                        bookList.push(selectBookResult[i].nhIdx)
                    }

                    for (let i = 0; i < nhInfoResult.length; i++) {

                        //북마크 리스트에 농활이 있을 때
                        if(bookList.indexOf(nhInfoResult[i].nhIdx) !== -1) {
                            nhInfoResult[i].isBooked = 1;
                        }
                    }
                }

                res.status(200).send({
                    message:"Success To Show Farmer Profile",
                    farmerInfo : farmResult,
                    nhInfo : nhInfoResult
                })
            }
        }
    }
});

module.exports = router;
