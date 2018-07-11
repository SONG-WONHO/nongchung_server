const express = require('express');
const router = express.Router();
const db = require('../../../module/db');
const jwt = require('../../../module/jwt');

router.get('/', async (req, res, next) => {

    //토큰이 있는 지 없는 지 검증하기
    let token = req.headers.token;

    let startDate = req.query.start || "2000-01-01";
    let endDate = req.query.end || "2500-01-01";
    let person = req.query.person || 1;
    let searchContent = req.query.scontent || "";
    let areaList = req.query.area;


    console.log(startDate, endDate, person, searchContent);

    //딕셔너리 만들기 위함, 농활 인덱스: 몇명 신청 받는 지
    let selectQuery = `SELECT idx, personLimit FROM NONGHWAL.nh;`;
    let selectResult = await db.queryParamNone(selectQuery);

    //쿼리수행도중 에러가 있을 경우
    if(!selectResult) {
        res.status(500).send({
            message : "Internal Server Error"
        });
        return;
    }

    //딕셔너리 생성
    let dicPerson = {};
    for (let i = 0; i < selectResult.length; i++){
        dicPerson[selectResult[i].idx] = selectResult[i].personLimit;
    }

    //딕셔너리 만들기 위함, 농활 인덱스 : 농활 이름
    selectQuery = `SELECT idx, name FROM NONGHWAL.nh`;
    selectResult = await db.queryParamNone(selectQuery);

    //쿼리수행도중 에러가 있을 경우
    if(!selectResult) {
        res.status(500).send({
            message : "Internal Server Error"
        });
        return;
    }
    //딕셔너리 생성
    let dicName = {};
    for (let i = 0; i < selectResult.length; i++){
        dicName[selectResult[i].idx] = selectResult[i].name;
    }


    //날짜 필터를 위한 쿼리
    selectQuery =
        `SELECT nhIdx, person 
        FROM NONGHWAL.schedule 
        WHERE startDate >= ? AND endDate <= ?`;

    //결과는 농활 인덱스랑 사람 숫자
    selectResult = await db.queryParamArr(selectQuery, [startDate, endDate]);

    //쿼리수행도중 에러가 있을 경우
    if(!selectResult) {
        res.status(500).send({
            message : "Internal Server Error"
        });
        return;
    }

    //사람 숫자 필터 함수
    function filterLimitPerson(value) {
        //여석이 현재 지원한 사람 숫자보다 크거나 같으면?
        if ((dicPerson[value.nhIdx] - value.person) >= person) {
            return true;
        }
    }

    //날짜, 사람 수, 필터링 된 농활 인덱스
    let filteredNh = selectResult.filter(filterLimitPerson);

    //검색어 필터 함수
    function filterName(value) {

        //사용자가 입력한 값이 없는가?
        if (searchContent === "") {
            return true;

        }
        //사용자가 입력한 값이 있는가?
        else {

            //제목에 사용자가 검색한 내용이 포함돼 있는가?
            if (dicName[value['nhIdx']].indexOf(searchContent) !== -1) {
                return true;
            }
        }
    }

    //사용자가 검색한 내용 필터링
    filteredNh = filteredNh.filter(filterName);

    //모든 농활 리스트 쿼리
    //SELECT idx, name, price, star, period, addr, addrIdx, img FROM (SELECT idx, name, price, star, period, farmIdx FROM nh LEFT JOIN (SELECT distinct nhIdx FROM schedule WHERE deadline >= curdate()) AS avail_nh ON avail_nh.nhIdx = nh.idx) AS nh LEFT JOIN (SELECT farm.idx AS farmIdx, addr, addrIdx, img FROM farm LEFT JOIN (select * from farm_img group by farmIdx) AS farm_img ON farm.idx = farm_img.farmIdx) AS farm ON nh.farmIdx = farm.farmIdx;

    //토큰이 없다면? ==> 기존의 방식으로!
    if (!token) {
        selectQuery =
            `SELECT idx, name, price, star, period, addr, addrIdx, img 
        FROM 
            (SELECT idx, name, price, star, period, farmIdx 
            FROM nh 
            LEFT JOIN (SELECT distinct nhIdx FROM schedule WHERE deadline >= curdate()) AS avail_nh 
            ON avail_nh.nhIdx = nh.idx) AS nh 
        LEFT JOIN 
            (SELECT farm.idx AS farmIdx, addr, addrIdx, img 
            FROM farm 
            LEFT JOIN (select * from farm_img group by farmIdx) AS farm_img ON farm.idx = farm_img.farmIdx) AS farm 
        ON nh.farmIdx = farm.farmIdx;`;

        //쿼리 결과 모든 농활 정보
        selectResult = await db.queryParamNone(selectQuery);

        //쿼리수행도중 에러가 있을 경우
        if(!selectResult) {
            res.status(500).send({
                message : "Internal Server Error"
            });
            return;
        }
    }
    //토큰이 있다면?
    else {

        let decoded = jwt.verify(token);

        //정당하지 않은 토큰이 들어올 때
        if(decoded === -1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });

        }
        //정당한 토큰이 들어올 때
        else {
            //유저 인덱스 받기
            let userIdx = decoded.user_idx;

            console.log(userIdx);

            console.log("!23123123123123");

            selectQuery =
                `SELECT idx, name, price, star, period, addr, addrIdx, img, 0 AS isBooked 
                FROM 
                    (SELECT idx, name, price, star, period, farmIdx 
                    FROM nh 
                    LEFT JOIN (SELECT distinct nhIdx FROM schedule WHERE deadline >= curdate()) AS avail_nh 
                    ON avail_nh.nhIdx = nh.idx) AS nh 
                LEFT JOIN 
                    (SELECT farm.idx AS farmIdx, addr, addrIdx, img 
                    FROM farm 
                    LEFT JOIN (select * from farm_img group by farmIdx) AS farm_img ON farm.idx = farm_img.farmIdx) AS farm 
                ON nh.farmIdx = farm.farmIdx;`;

            //쿼리 결과 모든 농활 정보
            selectResult = await db.queryParamNone(selectQuery);

            //쿼리수행도중 에러가 있을 경우
            if(!selectResult) {
                res.status(500).send({
                    message : "Internal Server Error"
                });
                return;
            }

            //유저가 북마크한 리스트 가져오기
            let selectBookmarkQuery = `SELECT group_concat(nhIdx separator ',') AS nhIdx FROM bookmark WHERE userIdx = ? group by userIdx;`;
            let selectBookmarkResult = await db.queryParamArr(selectBookmarkQuery, [userIdx]);

            if(!selectBookmarkResult) {
                res.status(500).send({
                    message : "Internal Server Error"
                });
                return;
            }

            if (selectBookmarkResult.length >= 1) {
                //북마크 했는 지 여부 필터링 하는 함수
                selectResult.filter((value) => {
                    if(selectBookmarkResult[0]['nhIdx'].indexOf(value.idx) !== -1) {
                        value.isBooked = 1
                    }
                });
            }
        }
    }

    //검색된 농활 인덱스 중복 제거 및 배열 생성
    let nhIdxList = [];

    filteredNh.filter((value) => {
        if (nhIdxList.indexOf(value['nhIdx']) === -1) {
            nhIdxList.push(value['nhIdx']);
        }
    });

    selectResult = selectResult.filter((value) => {
        if (nhIdxList.indexOf(value['idx']) !== -1) {
            return true;
        }
    });

    //지역을 입력 했다면?
    if(areaList && areaList !== []) {

        areaList = Array.from(areaList);

        areaList.splice(0, 1);
        console.log(areaList);

        areaList.pop();

        console.log(areaList);

        let areaString = areaList.join("");
        let realAreaList = [];
        areaList = areaString.split(',').filter(value => {
            realAreaList.push(parseInt(value));
        });
        console.log(realAreaList[0]);

        console.log(selectResult);

        if (realAreaList.indexOf(17) !== -1) {
            console.log(1);
        }

        else {
            //지역필터 추가
            selectResult = selectResult.filter((value) => {
                console.log(2);
                if (realAreaList.indexOf(value.addrIdx) !== -1) {
                    return true;
                }
            });
        }

        res.status(200).send({
            message: "Success To Get Search",
            data: selectResult
        })
    }

    //지역입력이 없다면?
    else {
        res.status(200).send({
            "message" : "Success To Get Search",
            "data": selectResult
        })
    }
});

module.exports = router;
