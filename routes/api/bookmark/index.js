const express = require('express');
const router = express.Router();

const db = require('../../../module/db');
const jwt = require('../../../module/jwt');

//완료
router.get('/', async (req, res) => {
    let token = req.headers.token;

    if(!token){
        res.status(400).send({
            message : "fail to show bookmark from client"
        })
    } else{
        let decoded = jwt.verify(token);
        console.log(decoded.user_idx);
        if(decoded==-1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        }else{
            let getBookmarkListQuery = `SELECT nh.idx, nh.price, nh.star, nh.period, nh.name,
            farm.addr, SUBSTRING_INDEX(GROUP_CONCAT(farm_img.img SEPARATOR ','), ',', 1) as img 
            FROM bookmark, nh, farm, farm_img WHERE nh.idx = bookmark.nhIdx 
            AND farm.idx = farm_img.farmIdx AND bookmark.userIdx = ? GROUP BY nhIdx`
            let getBookmarkList = await db.queryParamArr(getBookmarkListQuery, [decoded.user_idx]);

            if(!getBookmarkList){
                res.status(500).send({
                    message : "Failed"
                })
            } else{
                res.status(200).send({
                    message : "Success",
                    bmList : getBookmarkList
                })
            }
        }
    }

});

router.delete('/', async (req, res) => {
    let token = req.headers.token;

    if(!token){
        res.status(400).send({
            message : "fail to show bookmark from client"
        })
    } else{
        let decoded = jwt.verify(token);
        if(decoded==-1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });
        }else{
            let nhIdx = req.body.nhIdx;

            let checkExistQuery = "SELECT nhIdx FROM bookmark WHERE nhIdx = ?";
            let checkExist = await db.queryParamArr(checkExistQuery, [nhIdx]);

            if(!checkExist){
                res.status(500).send({
                    message : "Internal Server Error"
                })
            }else if(checkExist.length < 1){
                res.status(400).send({
                    message : "No nonghwal activity"
                })
            } 
            else{
                let deleteBookmarkQuery = "DELETE FROM bookmark WHERE userIdx = ? AND nhIdx = ?";
                let deleteBookmark = await db.queryParamArr(deleteBookmarkQuery, [decoded.user_idx, nhIdx]);

                if(!deleteBookmark){
                    res.status(500).send({
                        message : "Internal Server Error"
                    })
                } else{
                    res.status(200).send({
                        message : "Successfully Deleted"
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
            message : "fail to show bookmark from client"
        })

    } else{
        let decoded = jwt.verify(token);

        console.log(decoded.user_idx);

        if(decoded==-1){
            res.status(500).send({
                message : "token err"//여기서 400에러를 주면 클라의 문제니까 메세지만 적절하게 잘 바꿔주면 된다.
            });

        }else{
            let idx = req.body.idx;         //nh의 index

            //농활 인덱스 안주면 널밸류 반환

            let checkExistQuery = "SELECT idx FROM nh WHERE idx = ?";
            let checkExist = await db.queryParamArr(checkExistQuery, [idx]);

            if(!checkExist){
                res.status(500).send({
                    message : "Internal Server Error1"
                });
            } else if(checkExist.length < 1) {
                res.status(400).send({
                    message : "No Nonghwal Activity"
                });
            } else{
                let insertBookmarkQuery = "INSERT INTO bookmark (userIdx, nhIdx) VALUES (?, ?)";
                let insertBookmarkResult = await db.queryParamArr(insertBookmarkQuery, [decoded.user_idx, idx]);


                if(!insertBookmarkResult){
                    res.status(500).send({
                        message : "Internal Server Error2"
                    })
                } else{
                    res.status(200).send({
                        message : "Success to Add"
                    })
                }
            }
        }
    }
});

module.exports = router;
