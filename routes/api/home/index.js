const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const searchRouter = require('./search');

router.use('/search', searchRouter);

router.get('/', async (req, res, next) => {

    //광고 관련 회의 필요
    //인기 농장에 관련한 회의 필요
    //인기 농활, 뉴 농활에 대한 메서드 만들 필요 있음
    //대표 이미지 중복 제거 알고리즘 추가 필요

    let selectQuery = `
    SELECT 
        nh.idx, 
        nh.name, 
        nh.price, 
        nh.star, 
        nh.period, 
        farm.addr, 
        farm_img.img 
    FROM NONGHWAL.farm, NONGHWAL.farmer, NONGHWAL.nh, NONGHWAL.farm_img
    WHERE farm.farmerIdx = farmer.idx 
    AND farm.idx = nh.farmIdx
    AND farm.idx = farm_img.farmIdx`;

    //쿼리 결과 모든 농활 정보
    let selectResult = await db.queryParamNone(selectQuery);

    //인기농활 필터링 쿼리

    //최근농활 필터링 쿼리

    if(!selectResult){
        res.status(500).send({
            message : "Internal Server Error"
        });
    } else {
        res.status(200).send({
            message : "Success To Get Information",
            "ads":[
                {
                    "comment":"맛있는 귤과 함께하는 농활 특집",
                    "img":"13.13.13.13/ads/1"
                },
                {
                    "comment":"우리 고장의 사과를 재배하는 농활 특집",
                    "img":"13.13.13.13/ads/2"
                },
                {
                    "comment":"사랑이 싹트는 농활 특집",
                    "img":"13.13.13.13/ads/3"
                },
                {
                    "comment":"여름맞이 아보카도 농활 특집",
                    "img":"13.13.13.13/ads/4"
                }
            ],  
            "populNh":selectResult,
            "newNh":[
                {
                    "idx":2,
                    "addr":"경상북도 경주",
                    "name":"경주 사과농촌 체험 활동",
                    "img":"13.13.13.13/farm/3",
                    "price":"25,000",
                    "period":"1박 2일",
                    "star":"8.7"
                },
                {
                    "idx":2,
                    "addr":"제주 서귀포시",
                    "name":"서귀포 행복 감귤농활체험",
                    "img":"13.13.13.13/farm/4",
                    "price":"25,000",
                    "period":"1박 2일",
                    "star":"8.7"
                }
            ],
            "populFarm":[
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
            ]
        })
    }
});

module.exports = router;
