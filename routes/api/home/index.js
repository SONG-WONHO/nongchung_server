const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const jwt = require('../../../module/jwt');

const searchRouter = require('./search');
const detailRouter = require('./detail/index');
const requestRouter = require('./request/index');

router.use('/search', searchRouter);
router.use('/detail', detailRouter);
router.use('/request', requestRouter);

//인기농활 얻기 - 더미
function getPopulNh(arr) {
    let populNh = [];
    for (let i = 0; i < 6; i++){
        populNh.push(arr[i]);
    }
    return populNh;
}

//최근농활 얻기
function getNewNh(arr) {
    let newNh = [];
    //농활 리스트 중 가장 나중것 6개 추가하기
    for (let i = 1; i < 7; i++){
        newNh.push(arr.slice(i* -1)[0]);
    }
    return newNh;
}

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

        //모든 농활 뽑기
        let selectNhQuery =
            `SELECT 
                nh.idx, 
                nh.name, 
                nh.price, 
                nh.star, 
                nh.period, 
                farm.addr, 
                substring_index(group_concat(farm_img.img separator ','), ',', 1) as img  
            FROM NONGHWAL.farm, NONGHWAL.farmer, NONGHWAL.nh, NONGHWAL.farm_img
            WHERE farm.farmerIdx = farmer.idx 
            AND farm.idx = nh.farmIdx
            AND farm.idx = farm_img.farmIdx
            group by idx`;

        //쿼리 결과 모든 농활 정보
        let selectNhResult = await db.queryParamNone(selectNhQuery);

        //쿼리수행도중 에러가 있다면?
        if(!selectNhResult && !selectAdResult){
            res.status(500).send({
                message : "Internal Server Error"
            });
        }
        //에러가 없을 때
        else {

            //인기 농활 뽑기 알고리즘 추가
            //인기 농장 뽑기 알고리즘 추가

            //인기농활
            let populNh = getPopulNh(selectNhResult);
            //새로운농활
            let newNh = getNewNh(selectNhResult);
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
                "populNh":populNh,
                "newNh":newNh,
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

            //모든 농활 뽑기
            let selectNhQuery =
                `SELECT 
                    idx, 
                    name, 
                    price, 
                    star, 
                    period, 
                    addr, 
                    img, 
                    if(userIdx = ?, 1, 0) AS isBooked 
                FROM NONGHWAL.bookmark 
                RIGHT JOIN 
                    (SELECT 
                        nh.idx, 
                        nh.name, 
                        nh.price, 
                        nh.star, 
                        nh.period, 
                        farm.addr, 
                        substring_index(group_concat(farm_img.img separator ','), ',', 1) as img
                    FROM NONGHWAL.farm, NONGHWAL.farmer, NONGHWAL.nh, NONGHWAL.farm_img
                    WHERE farm.farmerIdx = farmer.idx 
                    AND farm.idx = nh.farmIdx
                    AND farm.idx = farm_img.farmIdx
                    group by idx)AS d 
                ON bookmark.nhIdx = d.idx`;

            //쿼리 결과 모든 농활 정보
            let selectNhResult = await db.queryParamArr(selectNhQuery, [userIdx]);

            //쿼리수행도중 에러가 있다면?
            if(!selectNhResult && !selectAdResult){
                res.status(500).send({
                    message : "Internal Server Error"
                });
            }
            //에러가 없을 때
            else {

                //인기 농활 뽑기 알고리즘 추가
                //인기 농장 뽑기 알고리즘 추가

                //인기 농활
                let populNh = getPopulNh(selectNhResult);
                //새로운 농활
                let newNh = getNewNh(selectNhResult);
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
                    "populNh":populNh,
                    "newNh":newNh,
                    "populFarm":populFarm
                })
            }
        }
    }
});

module.exports = router;
