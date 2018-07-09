const express = require('express');
const router = express.Router();
const check = require('../../../../module/check');
const db = require('../../../../module/db');

//qna 겟 요청
router.get('/', async (req, res, next) => {
    //농활 인덱스 받기
    let nhIdx = req.query.idx;

    if (check.checkNull([nhIdx])) {
        res.status(400).send({
            message: "Null Value"
        })
    }

    //빈 값인지 검증하기
    else {

        let selectQuery = `SELECT * FROM qna WHERE nhIdx = ?`;
        let selectResult = await db.queryParamArr(selectQuery, [nhIdx]);

        //쿼리 수행도중 에러
        if (!selectResult) {
            res.status(500).send({
                message : "Internal Server Error"
            })
        }
        //쿼리가 잘 수행 됐을 때
        else {

            //정당한 농활 인덱스인지 검증하기
            if (selectResult.length === 0) {
                res.status(400).send({
                    message: "No nonghwal activity"
                })

            }

            //정당한 농활 인덱스일 때
            else {
                res.status(200).send({
                    message: "Success To Get Qna",
                    data: selectResult
                })

            }
        }
    }

});

//qna 포스트 요청
router.post('/', async (req, res, next) => {

    //농활 인덱스 받기
    let nhIdx = req.body.idx;
    let question = req.body.question;

    //빈 값인지 검증하기
    if (check.checkNull([nhIdx, question])) {
        res.status(400).send({
            message: "Null Value"
        })
    }

    //정당한 농활 인덱스인가?
    else {

        let selectQuery = `SELECT * FROM nh WHERE idx = ?`;
        let selectResult = await db.queryParamArr(selectQuery, [nhIdx]);

        //쿼리 수행도중 에러
        if (!selectResult) {
            res.status(500).send({
                message : "Internal Server Error"
            })
        }
        //쿼리가 잘 수행 됐을 때
        else {

            //정당한 농활 인덱스인지 검증하기
            if (selectResult.length === 0) {
                res.status(400).send({
                    message: "No nonghwal activity"
                })

            }

            //정당한 농활 인덱스일 때
            else {
                let insertQuery = `INSERT INTO qna_user (nhIdx, question) VALUES (?, ?);`;
                let insertResult = await db.queryParamArr(insertQuery, [nhIdx, question]);

                //쿼리 수행도중 에러
                if (!insertResult) {
                    res.status(500).send({
                        message : "Internal Server Error"
                    })
                } else {
                    res.status(200).send({
                        message: "Success To Question"
                    })
                }

            }
        }
    }
});

module.exports = router;
