const express = require('express');
const router = express.Router();
const check = require('../../../module/check');
const db = require('../../../module/db');
const moment = require('moment');

/* 테스트용 입니다. */
router.get('/', async (req, res, next) => {

    let startDate = req.query.start || "2000-01-01";
    let endDate = req.query.end || "2500-01-01";
    let person = req.query.person || 0;
    let searchContent = req.query.scontent || "";

    console.log(startDate, endDate, person, searchContent);

    //딕셔너리 만들기 위함, 농활 인덱스: 몇명 신청 받는 지
    let selectQuery = `SELECT idx, personLimit FROM NONGHWAL.nh;`;
    let selectResult = await db.queryParamNone(selectQuery);

    //딕셔너리 생성
    let dicPerson = {};
    for (let i = 0; i < selectResult.length; i++){
        dicPerson[selectResult[i].idx] = selectResult[i].personLimit;
    }

    //딕셔너리 만들기 위함, 농활 인덱스 : 농활 이름
    selectQuery = `SELECT idx, name FROM NONGHWAL.nh`;
    selectResult = await db.queryParamNone(selectQuery);

    //딕셔너리 생성
    let dicName = {};
    for (let i = 0; i < selectResult.length; i++){
        dicName[selectResult[i].idx] = selectResult[i].name;
    }

    //날짜가 설정돼 있지 않다면 - No need
    if (false) {

    } else {
        //날짜 필터를 위한 쿼리
        selectQuery = `
        SELECT nhIdx, person 
        FROM NONGHWAL.schedule 
        WHERE startDate >= ? AND endDate <= ?`;
        //결과는 농활 인덱스랑 사람 숫자
        selectResult = await db.queryParamArr(selectQuery, [startDate, endDate]);

        //사람 숫자 필터 함수
        function filterLimitPerson(value) {
            //여석이 현재 지원한 사람 숫자보다 크거나 같으면?
            if ((dicPerson[value.nhIdx] - value.person) >= person) {
                return true;
            }
        }

        //날짜, 사람 수, 필터링 된 농활 목록
        let filteredNh = selectResult.filter(filterLimitPerson);

        //이름 필터 함수
        function filterName(value) {

            //사용자가 입력한 값이 없는가?
            if (searchContent === "") {
                return true;
            } else {
                //제목에 사용자가 검색한 내용이 포함돼 있는가?
                if (dicName[value['nhIdx']].indexOf(searchContent) !== -1) {
                    return true;
                }
            }
        }

        //사용자가 검색한 내용 필터링
        filteredNh = filteredNh.filter(filterName);

        //검색된 농활 인덱스 중복 제거 및 배열 생성
        let nhIdxList = [];

        filteredNh.filter((value, pos) => {
            if (nhIdxList.indexOf(value['nhIdx']) === -1) {
                nhIdxList.push(value['nhIdx']);
            }
        });

        //모든 농활 리스트 쿼리
        selectQuery = `
        SELECT 
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
        selectResult = await db.queryParamNone(selectQuery);

        selectResult = selectResult.filter((value) => {
            if (nhIdxList.indexOf(value['idx']) !== -1) {
                return true;
            }
        });

        if(!selectResult) {
            res.status(500).send({
                message : "Internal Server Error"
            })
        } else {
            res.status(200).send({
                "message" : "Success To Get Search",
                "data": selectResult
            })
        }
    }
});

module.exports = router;
