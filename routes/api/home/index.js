const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const jwt = require('../../../module/jwt');

//detail 라우터
//홈의 인기 농활, 뉴 농활, 인기 농장 클릭 시 자세한 정보 제공해줄 수 있는 API
const detailRouter = require('./detail/index');

//request 라우터
//신청 view 와 관련된 모든 라우터 - 농활 스케쥴 변경, 신청하기, 취소하기할 수 있는 API
const requestRouter = require('./request/index');

//more 라우터
//인기 농활, 뉴 농활 더보기 눌렀을 때 paging 처리할 수 있는 API
const moreRouter = require('./more/index');

//theme 라우터
//홈의 각 테마 클릭 시 테마에 대한 정보를 보여줄 수 있는 API
const themeRouter = require('./theme/index');

router.use('/detail', detailRouter);
router.use('/request', requestRouter);
router.use('/more', moreRouter);
router.use('/theme', themeRouter);


//홈 보여주기
router.get('/', async (req, res, next) => {

    //인기 농장에 관련한 회의 필요

    //토큰이 있는 지 없는 지 검증하기
    let token = req.headers.token;

    //토큰이 없다면? ==> 기존의 방식으로!
    if (!token) {

        //광고 리스트 뽑기
        let selectAdQuery =
            `
            SELECT * FROM ad
            `;
        //광고리스트
        let selectAdResult = await db.queryParamNone(selectAdQuery);

        //인기농활뽑기
        let selectPopulNhQuery =
            `
            SELECT * FROM nh_popular limit 0,6
            `;

        //새로운농활뽑기
        let selectNewNhQuery =
            `
            SELECT * FROM nh_new limit 0,6
            `;

        //인기농장뽑기
        let selectFarmQuery =
            `
            SELECT 
                farm.idx AS farmIdx, 
                farm.name, farm.addr, 
                farm.farmImg, 
                farmer.img AS farmerImg 
            FROM (
                SELECT * FROM farm 
                INNER JOIN (SELECT farmIdx, img AS farmImg FROM farm_img group by farmIdx) AS farm_img 
                ON farm.idx = farm_img.farmIdx) AS farm 
            LEFT JOIN farmer 
            ON farm.farmerIdx = farmer.idx
            limit 0,6;
            `;

        let selectPopulNhResult = await db.queryParamNone(selectPopulNhQuery);
        let selectNewNhResult = await db.queryParamNone(selectNewNhQuery);
        let selectFarmResult = await db.queryParamNone(selectFarmQuery);

        //쿼리 수행도중 에러가 있을 때
        if (!selectAdResult && !selectPopulNhResult && !selectNewNhResult && !selectFarmResult) {
            res.status(500).send({
                message : "Internal Server Error"
            });
        }

        //에러가 없다면?
        else {

            res.status(200).send({
                message : "Success To Get Information",
                "ads": selectAdResult,
                "populNh":selectPopulNhResult,
                "newNh": selectNewNhResult,
                "populFarm":selectFarmResult
            })
        }
    }

    //토큰이 있다면? ==> 유저의 찜 상태를 보여줘야 한다.
    else {
        let decoded = jwt.verify(token);

        //정당하지 않은 토큰이 들어올 때
        if(decoded === -1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });

        }
        //정당한 토큰일 때
        else{

            //유저 인덱스 얻기
            let userIdx = decoded.user_idx;

            //광고 리스트 뽑기
            let selectAdQuery = `SELECT * FROM ad`;
            //광고리스트
            let selectAdResult = await db.queryParamNone(selectAdQuery);


            //인기농활뽑기
            let selectPopulNhQuery =
                `
                SELECT nh_popular.nhIdx, name, price, star, period, addr, img, idx, if(userIdx = ?, 1, 0) AS isBooked 
                FROM NONGHWAL.nh_popular 
                LEFT JOIN (SELECT * FROM bookmark WHERE userIdx = ?) AS bookmark on bookmark.nhIdx = nh_popular.nhIdx limit 0, 6;
                `;

            //새로운농활뽑기
            let selectNewNhQuery =
                `
                SELECT nh_new.nhIdx, name, price, star, period, addr, img, idx, if(userIdx = ?, 1, 0) AS isBooked 
                FROM NONGHWAL.nh_new
                LEFT JOIN (SELECT * FROM bookmark WHERE userIdx = ?) AS bookmark on bookmark.nhIdx = nh_new.nhIdx limit 0, 6;
                `;

            //인기농장뽑기
            let selectFarmQuery =
                `
                SELECT 
                    farm.idx AS farmIdx, 
                    farm.name, farm.addr, 
                    farm.farmImg, 
                    farmer.img AS farmerImg 
                FROM (
                    SELECT * FROM farm 
                    INNER JOIN (SELECT farmIdx, img AS farmImg FROM farm_img group by farmIdx) AS farm_img 
                    ON farm.idx = farm_img.farmIdx) AS farm 
                LEFT JOIN farmer 
                ON farm.farmerIdx = farmer.idx
                limit 0,6;
                `;

            let selectPopulNhResult = await db.queryParamArr(selectPopulNhQuery, [userIdx, userIdx]);
            let selectNewNhResult = await db.queryParamArr(selectNewNhQuery, [userIdx, userIdx]);
            let selectFarmResult = await db.queryParamNone(selectFarmQuery);

            if (!selectAdResult && !selectPopulNhResult && !selectNewNhResult && !selectFarmResult) {
                res.status(500).send({
                    message : "Internal Server Error"
                });
            }
            else {

                res.status(200).send({
                    message : "Success To Get Information",
                    "ads": selectAdResult,
                    "populNh":selectPopulNhResult,
                    "newNh":selectNewNhResult,
                    "populFarm":selectFarmResult
                })
            }
        }
    }
});

module.exports = router;
