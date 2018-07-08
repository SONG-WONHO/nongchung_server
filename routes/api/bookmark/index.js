const express = require('express');
const router = express.Router();

const db = require('../../../module/db');
const jwt = require('../../../module/jwt');

//완료
router.get('/', async (req, res) => {
    let token = req.headers.token;

    if(!token){
        res.status(400).send({
            message : "Null Value"
        })
    } else{
        let decoded = jwt.verify(token);
        if(decoded==-1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        }else{
            //해당 사용자가 선택한 찜목록의 리스트를 보여주기 위한 쿼리
            let getBookmarkListQuery = `SELECT nh.idx, nh.price, nh.star, nh.period, nh.name, 
            (select count(*) from bookmark where bookmark.userIdx = ? and  bookmark.nhIdx = nh.idx) 
            as isBooked, farm.addr, SUBSTRING_INDEX(GROUP_CONCAT(farm_img.img SEPARATOR ','), ',', 1) 
            as img FROM bookmark, nh, farm, farm_img WHERE nh.idx = bookmark.nhIdx AND 
            farm.idx = farm_img.farmIdx AND bookmark.userIdx = ? GROUP BY nhIdx`

            // nhIdx별로 농활가격, 평점, 기간(O박O일등), 농활이름, 농장주소, 농장이미지
            let getBookmarkListResult = await db.queryParamArr(getBookmarkListQuery, [decoded.user_idx, decoded.user_idx]);

            if(!getBookmarkListResult){
                res.status(500).send({
                    message : "Failed"
                })
            } else{
                res.status(200).send({
                    message : "Success",
                    bmList : getBookmarkListResult
                })
            }
        }
    }

});

router.delete('/', async (req, res) => {
    let token = req.headers.token;

    if(!token){
        res.status(400).send({
            message : "Null Value"
        })
    } else{
        let decoded = jwt.verify(token);
        if(decoded==-1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        }else{
            let nhIdx = req.body.nhIdx;

            //유저의 찜목록에 찜을 해제하기 위한 농활이 있는지 확인하기위한 쿼리
            let checkExistQuery = "SELECT nhIdx FROM bookmark WHERE nhIdx = ?";

            let checkExist = await db.queryParamArr(checkExistQuery, [nhIdx]);
            if(!checkExist){
                res.status(500).send({
                    message : "Internal Server Error"
                })
            }else if(checkExist.length < 1){

            //유저의 찜목록에 찜을 해제할 농활이 없을 때
                res.status(400).send({
                    message : "No nonghwal activity"
                })
            } 
            else{

                //해당 유저가 찜을 해제할 목록을 선택하여 리스트에서 지워주기위한 쿼리
                let deleteBookmarkQuery = "DELETE FROM bookmark WHERE userIdx = ? AND nhIdx = ?";

                let deleteBookmark = await db.queryParamArr(deleteBookmarkQuery, [decoded.user_idx, nhIdx]);

                if(!deleteBookmark){
                    res.status(500).send({
                        message : "Internal Server Error"
                    })
                } else{
                    res.status(200).send({
                        message : "Success to Delete"
                    })
                }
            }
        }
    }
});

router.post('/', async (req, res) => {
    let token = req.headers.token;

    if(!token){
        res.status(400).send({
            message : "Null Value"
        })

    } else{
        let decoded = jwt.verify(token);

        if(decoded==-1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });

        }else{
            let nhIdx = req.body.nhIdx;         

            //찜을 선택하기 위한 농활이 nh테이블에 있는지 확인하기 위한 쿼리
            let checkExistQuery = "SELECT idx FROM nh WHERE idx = ?";

            let checkExist = await db.queryParamArr(checkExistQuery, [nhIdx]);

            if(!checkExist){
                res.status(500).send({
                    message : "Internal Server Error"
                });
            } else if(checkExist.length < 1) {
            //찜할 농활이 nh테이블에 없을때
                res.status(400).send({
                    message : "No Nonghwal Activity"
                });
            } else{

                //찜한 농활이 이미 북마크에 존재하는지 확인하는 쿼리
                let checkExistInBmListQuery = "SELECT nhIdx FROM bookmark WHERE nhIdx = ? AND userIdx = ?"

                let checkExistInBmList = await db.queryParamArr(checkExistInBmListQuery, [nhIdx, decoded.user_idx]);

                if(!checkExistInBmList){
                    res.status(500).send({
                        message : "Internal Server Error"
                    })
                } else if(checkExistInBmList.length >= 1){
                //이미 해당 농활을 찜한 상태일때
                    res.status(400).send({
                        message : "Already Exist"
                    })
                } else{
                
                    //유저의 찜목록에 선택한 농활을 추가하기위한 쿼리
                    let insertBookmarkQuery = "INSERT INTO bookmark (userIdx, nhIdx) VALUES (?, ?)";
                    let insertBookmarkResult = await db.queryParamArr(insertBookmarkQuery, [decoded.user_idx, nhIdx]);

                    if(!insertBookmarkResult){
                        res.status(500).send({
                            message : "Internal Server Error"
                        })
                    } else{
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
