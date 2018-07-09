const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const jwt = require('../../../module/jwt');

const mapRouter = require('./map');
const detailRouter = require('./detail/index');
const requestRouter = require('./request/index');
const moreRouter = require('./more/index');
const themeRouter = require('./theme/index');

router.use('/detail', detailRouter);
router.use('/request', requestRouter);
router.use('/map', mapRouter);
router.use('/more', moreRouter);
router.use('/theme', themeRouter);


router.get('/', async (req, res, next) => {

    //인기 농장에 관련한 회의 필요
    //인기 농활에 대한 메서드 만들 필요 있음

    //토큰이 있는 지 없는 지 검증하기
    let token = req.headers.token;

    //토큰이 없다면? ==> 기존의 방식으로!
    if (!token) {

        //광고 리스트 뽑기
        let selectAdQuery = `SELECT * FROM ad`;
        //광고리스트
        let selectAdResult = await db.queryParamNone(selectAdQuery);

        //인기농활뽑기
        let selectPopulNhQuery = `SELECT * FROM nh_popular limit 0,6`;
        //새로운농활뽑기
        let selectNewNhQuery = `SELECT * FROM nh_new limit 0,6`;

        let selectPopulNhResult = await db.queryParamNone(selectPopulNhQuery);
        let selectNewNhResult = await db.queryParamNone(selectNewNhQuery);

        if (!selectAdResult && !selectPopulNhResult && !selectNewNhResult) {
            res.status(500).send({
                message : "Internal Server Error"
            });
        }
        else {

            //인기농장
            let populFarm = [
                {
                    "idx":2,
                    "addr":"제주 서귀포시",
                    "name":"경주 사과농장"
                },
                {
                    "idx":2,
                    "addr":"제주 서귀포시",
                    "name":"부산 사과농장"
                },
                {
                    "idx":2,
                    "addr":"제주 서귀포시",
                    "name":"대전 포도농장"
                }
            ];

            res.status(200).send({
                message : "Success To Get Information",
                "ads": selectAdResult,
                "populNh":selectPopulNhResult,
                "newNh": selectNewNhResult,
                "populFarm":populFarm
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
                `SELECT nh_popular.nhIdx, name, price, star, period, addr, img, idx, if(userIdx = ?, 1, 0) AS isBooked 
                FROM NONGHWAL.nh_popular 
                LEFT JOIN (SELECT * FROM bookmark WHERE userIdx = ?) AS bookmark on bookmark.nhIdx = nh_popular.nhIdx limit 0, 6;`;
            //새로운농활뽑기
            let selectNewNhQuery =
                `SELECT nh_new.nhIdx, name, price, star, period, addr, img, idx, if(userIdx = ?, 1, 0) AS isBooked 
                FROM NONGHWAL.nh_new
                LEFT JOIN (SELECT * FROM bookmark WHERE userIdx = ?) AS bookmark on bookmark.nhIdx = nh_new.nhIdx limit 0, 6;`;

            let selectPopulNhResult = await db.queryParamArr(selectPopulNhQuery, [userIdx, userIdx]);
            let selectNewNhResult = await db.queryParamArr(selectNewNhQuery, [userIdx, userIdx]);

            if (!selectAdResult && !selectPopulNhResult && !selectNewNhResult) {
                res.status(500).send({
                    message : "Internal Server Error"
                });
            }
            else {
                //인기 농장
                let populFarm = [
                    {
                        "idx":2,
                        "addr":"제주 서귀포시",
                        "name":"경주 사과농장"
                    },
                    {
                        "idx":2,
                        "addr":"제주 서귀포시",
                        "name":"부산 사과농장"
                    },
                    {
                        "idx":2,
                        "addr":"제주 서귀포시",
                        "name":"대전 포도농장"
                    }
                ];

                res.status(200).send({
                    message : "Success To Get Information",
                    "ads": selectAdResult,
                    "populNh":selectPopulNhResult,
                    "newNh":selectNewNhResult,
                    "populFarm":populFarm
                })
            }
        }
    }
});

module.exports = router;
