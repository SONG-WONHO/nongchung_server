const express = require('express');
const router = express.Router();
const check = require('../../../../module/check');
const db = require('../../../../module/db');

//신청하기 - 날짜리스트 보기
router.get('/', async (req, res, next) => {
    let schIdx = req.query.idx;

    //스케쥴 인덱스를 안 줬을 때
    if (check.checkNull(schIdx)) {
        res.status(400).send({
            message: "Null Value"
        })
    }
    //스케쥴 인덱스를 줬을 때
    else {
        //대원뽑기
        let selectFriendQuery =
            `SELECT 
                name, 
                nickname, 
                img 
            FROM user 
            JOIN (SELECT userIdx FROM activity WHERE scheIdx = ? AND state = 0) AS d 
            ON d.userIdx = user.idx;`;

        //대원결과
        let selectFriendResult = await db.queryParamArr(selectFriendQuery, [schIdx]);

        //쿼리 수행도중 에러가 있을 때
        if (!selectFriendResult) {
            res.status(500).send({
                message : "Internal Server Error"
            });
            return;
        }

        res.status(200).send({
            message:"Success To Get Data",
            friendsInfo: selectFriendResult
        })

    }
});


module.exports = router;
