const express = require('express');
const router = express.Router();

const db = require('../../../module/db');
const jwt = require('../../../module/jwt');

//북마크 보기
router.get('/', async (req, res) => {

    //유저 토큰
    let token = req.headers.token;

    //토큰이 없을 때
    if(!token){
        res.status(400).send({
            message : "Null Value"
        })

    }
    //토큰이 있다면?
    else{
        let decoded = jwt.verify(token);

        //토큰에 에러 있을 때
        if(decoded===-1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        }

        //토큰에 에러 없다면
        else{

            //해당 사용자가 선택한 찜목록의 리스트를 보여주기 위한 쿼리
            let getBookmarkListQuery =
                `
                SELECT 
                    idx, 
                    price, 
                    star, 
                    period, 
                    name, 
                    1 AS isBooked, 
                    addr, 
                    img 
                FROM 
                    (
                    SELECT idx, name, price, star, period, addr, addrIdx, img
                    FROM (SELECT idx, name, price, star, period, farmIdx FROM nh) AS nh
                    LEFT JOIN 
                    (
                        SELECT farm.idx AS farmIdx, addr, addrIdx, img 
                        FROM farm 
                        LEFT JOIN (select * from farm_img group by farmIdx) AS farm_img 
                        ON farm.idx = farm_img.farmIdx
                    ) AS farm 
                    ON nh.farmIdx = farm.farmIdx) AS nh, 
                    bookmark 
                WHERE userIdx = ? 
                AND bookmark.nhIdx = nh.idx;
                `;

            // nhIdx 별로 농활가격, 평점, 기간(몇박 몇일), 농활이름, 농장주소, 농장이미지
            let getBookmarkListResult = await db.queryParamArr(getBookmarkListQuery, [decoded.user_idx]);

            //쿼리 수행 중 에러가 있을 때
            if(!getBookmarkListResult){
                res.status(500).send({
                    message : "Failed"
                })
            }
            //에러가 없다면?
            else{
                res.status(200).send({
                    message : "Success",
                    bmList : getBookmarkListResult
                })
            }
        }
    }
});

//북마크 삭제하기
router.delete('/', async (req, res) => {

    //토큰 받기
    let token = req.headers.token;

    //토큰이 없다면?
    if(!token){
        res.status(400).send({
            message : "Null Value"
        })
    }
    //토큰이 있을 때
    else{

        let decoded = jwt.verify(token);

        //토큰에러
        if(decoded === -1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        }
        //정상적인 토큰이라면?
        else{

            //농활 인덱스 받기
            let nhIdx = req.body.nhIdx;

            //유저의 찜목록에 찜을 해제하기 위한 농활이 있는지 확인하기위한 쿼리
            let checkExistQuery =
                `
                SELECT nhIdx 
                FROM bookmark 
                WHERE nhIdx = ?
                `;

            //결과
            let checkExist = await db.queryParamArr(checkExistQuery, [nhIdx]);

            //쿼리수행중 에러가 있을 때
            if(!checkExist){
                res.status(500).send({
                    message : "Internal Server Error"
                })
            }
            //에러가 없다면? - 정상적이지 않은 농활일 때
            else if(checkExist.length < 1){
                res.status(400).send({
                    message : "No nonghwal activity"
                })
            }
            //에러가 없다면? - 정상적인 농활일 때
            else{

                //해당 유저가 찜을 해제할 목록을 선택하여 리스트에서 지워주기위한 쿼리
                let deleteBookmarkQuery =
                    `
                    DELETE FROM bookmark 
                    WHERE userIdx = ? 
                    AND nhIdx = ?`;

                //결과
                let deleteBookmark = await db.queryParamArr(deleteBookmarkQuery, [decoded.user_idx, nhIdx]);

                //쿼리 수행 중 에러가 있을 때
                if(!deleteBookmark){
                    res.status(500).send({
                        message : "Internal Server Error"
                    })
                }
                //성공적으로 삭제했을 때
                else{
                    res.status(200).send({
                        message : "Success to Delete"
                    })
                }
            }
        }
    }
});

//북마크 등록하기
router.post('/', async (req, res) => {

    //토큰 값
    let token = req.headers.token;

    //토큰이 없을 때
    if(!token){
        res.status(400).send({
            message : "Null Value"
        })

    }
    //토큰이 있다면?
    else{
        let decoded = jwt.verify(token);

        //비정상적인 토큰
        if(decoded === -1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        }
        //정상적인 토큰
        else{

            //농활 인덱스
            let nhIdx = req.body.nhIdx;
            //찜을 선택하기 위한 농활이 nh테이블에 있는지 확인하기 위한 쿼리
            let checkExistQuery =
                `
                SELECT idx 
                FROM nh 
                WHERE idx = ?
                `;

            //쿼리 결과
            let checkExist = await db.queryParamArr(checkExistQuery, [nhIdx]);

            //쿼리 수행 중 에러가 있을 때
            if(!checkExist){
                res.status(500).send({
                    message : "Internal Server Error"
                });
            }
            //에러가 없지만, 농활이 없을 때
            else if(checkExist.length < 1) {
                res.status(400).send({
                    message : "No Nonghwal Activity"
                });
            }
            //에러가 없지만, 농활이 있을 때
            else{

                //찜한 농활이 이미 북마크에 존재하는지 확인하는 쿼리
                let checkExistInBmListQuery =
                    `
                    SELECT nhIdx 
                    FROM bookmark 
                    WHERE nhIdx = ? 
                    AND userIdx = ?
                    `;

                //결과
                let checkExistInBmList = await db.queryParamArr(checkExistInBmListQuery, [nhIdx, decoded.user_idx]);

                //쿼리 수행 중 에러가 있을 때
                if(!checkExistInBmList){
                    res.status(500).send({
                        message : "Internal Server Error"
                    })
                }
                //이미 찜한 농활이라면?
                else if(checkExistInBmList.length >= 1){
                    res.status(400).send({
                        message : "Already Exist"
                    })
                }
                //찜한 농활이 아닐때
                else{
                
                    //유저의 찜목록에 선택한 농활을 추가하기위한 쿼리
                    let insertBookmarkQuery =
                        `
                        INSERT INTO bookmark (userIdx, nhIdx) 
                        VALUES (?, ?)
                        `;
                    let insertBookmarkResult = await db.queryParamArr(insertBookmarkQuery, [decoded.user_idx, nhIdx]);

                    //쿼리 수행 중 에러가 있을 때
                    if(!insertBookmarkResult){
                        res.status(500).send({
                            message : "Internal Server Error"
                        })
                    }
                    //성공적으로 추가했을 때
                    else{
                        res.status(200).send({
                            message : "Success to Add"
                        })
                    }
                }
            }
        }
    }
});

module.exports = router;
